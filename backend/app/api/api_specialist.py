from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.dependencies import get_current_user
from app.models.model_user import User
from app.database import get_session
from app.crud import crud_specialist_source, crud_specialist_vectordb
from app.models.model_specialist_source import SpecialistSource
from app.schemas.schema_specialist_source import SpecialistSourceCreate, SpecialistSourceRead

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
