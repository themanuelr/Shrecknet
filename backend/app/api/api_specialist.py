from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from uuid import uuid4
import json
from pathlib import Path

from app.dependencies import get_current_user
from app.models.model_user import User
from app.database import get_session
from app.crud import crud_specialist_source, crud_specialist_vectordb
from app.models.model_specialist_source import SpecialistSource
from app.schemas.schema_specialist_source import SpecialistSourceCreate, SpecialistSourceRead
from app.task_queue import task_rebuild_specialist_vectors
from app.config import settings

router = APIRouter(prefix="/specialist_agents", tags=["SpecialistAgents"], dependencies=[Depends(get_current_user)])

@router.post("/{agent_id}/sources", response_model=SpecialistSourceRead)
async def add_source(agent_id: int, payload: SpecialistSourceCreate, session: AsyncSession = Depends(get_session)):
    source = SpecialistSource(agent_id=agent_id, **payload.model_dump())
    return await crud_specialist_source.add_source(session, source)

@router.get("/{agent_id}/sources", response_model=list[SpecialistSourceRead])
async def list_sources(agent_id: int, session: AsyncSession = Depends(get_session)):
    return await crud_specialist_source.get_sources(session, agent_id)

@router.delete("/{agent_id}/sources/{source_id}")
async def remove_source(agent_id: int, source_id: int, session: AsyncSession = Depends(get_session)):
    ok = await crud_specialist_source.delete_source(session, source_id)
    if not ok:
        raise HTTPException(status_code=404, detail="Source not found")
    return {"ok": True}

@router.post("/{agent_id}/rebuild_vectors")
async def rebuild_vectors(agent_id: int, session: AsyncSession = Depends(get_session)):
    count = await crud_specialist_vectordb.rebuild_agent(session, agent_id)
    return {"documents_indexed": count}


@router.post("/{agent_id}/rebuild_vectors_async")
async def rebuild_vectors_async(agent_id: int, user: User = Depends(get_current_user)):
    job_id = uuid4().hex
    job_dir = Path(settings.specialist_job_dir)
    job_dir.mkdir(parents=True, exist_ok=True)
    job_path = job_dir / f"{job_id}.json"
    with open(job_path, "w") as f:
        json.dump({"status": "queued", "agent_id": agent_id, "job_type": "rebuild_specialist_vectors"}, f)
    task_rebuild_specialist_vectors.delay(agent_id, job_id)
    return {"job_id": job_id}


@router.get("/vector_jobs/{job_id}")
async def specialist_vector_job_status(job_id: str):
    job_path = Path(settings.specialist_job_dir) / f"{job_id}.json"
    if not job_path.is_file():
        raise HTTPException(status_code=404, detail="Job not found")
    with open(job_path) as f:
        data = json.load(f)
    return data


@router.get("/vector_jobs")
async def list_vector_jobs():
    job_dir = Path(settings.specialist_job_dir)
    job_dir.mkdir(parents=True, exist_ok=True)
    jobs = []
    for p in job_dir.glob("*.json"):
        with open(p) as f:
            data = json.load(f)
        data["job_id"] = p.stem
        jobs.append(data)
    return jobs
