from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import JSONResponse
from sqlalchemy.ext.asyncio import AsyncSession
from app.dependencies import get_current_user, require_role
from app.models.model_user import User, UserRole
from app.models.model_agent import Agent
from app.crud.crud_agent import (
    chat_with_agent,
    create_agent,
    get_agent,
    get_agents,
    update_agent,
    delete_agent,
)
from app.crud import crud_vectordb, crud_chat_history
from app.crud.crud_page_analysis import analyze_page, generate_pages
from app.crud.crud_page import get_page
from app.schemas.schema_agent import AgentCreate, AgentRead, AgentUpdate
from app.database import get_session
from pydantic import BaseModel
from typing import List, Literal, Optional
import json

class ChatMessage(BaseModel):
    role: Literal["system", "user", "assistant"]
    content: str

class ChatRequest(BaseModel):
    messages: List[ChatMessage]

router = APIRouter(prefix="/agents", tags=["Agents"], dependencies=[Depends(get_current_user)])


@router.post("/{agent_id}/update_vector_db")
async def update_vector_job(
    agent_id: int,
    user: User = Depends(get_current_user),
):
    from uuid import uuid4
    from pathlib import Path
    from app.config import settings
    from app.task_queue import task_rebuild_vectordb

    job_id = uuid4().hex
    job_dir = Path(settings.vectordb_job_dir)
    job_dir.mkdir(parents=True, exist_ok=True)
    job_path = job_dir / f"{job_id}.json"
    with open(job_path, "w") as f:
        json.dump({"status": "queued", "agent_id": agent_id, "job_type": "update_vector_db"}, f)

    task_rebuild_vectordb.delay(agent_id, job_id)
    return {"job_id": job_id}


@router.get("/vector_jobs/{job_id}")
async def vector_job_status(job_id: str):
    from pathlib import Path
    from app.config import settings

    job_path = Path(settings.vectordb_job_dir) / f"{job_id}.json"
    if not job_path.is_file():
        raise HTTPException(status_code=404, detail="Job not found")
    with open(job_path) as f:
        data = json.load(f)
    return data


@router.get("/vector_jobs")
async def list_vector_jobs():
    from pathlib import Path
    from app.config import settings

    job_dir = Path(settings.vectordb_job_dir)
    job_dir.mkdir(parents=True, exist_ok=True)
    jobs = []
    for p in job_dir.glob("*.json"):
        with open(p) as f:
            data = json.load(f)
        data["job_id"] = p.stem
        jobs.append(data)
    return jobs


@router.get("/writer_jobs/{job_id}")
async def writer_job_status(job_id: str):
    from pathlib import Path
    from app.config import settings

    job_path = Path(settings.writer_job_dir) / f"{job_id}.json"
    if not job_path.is_file():
        raise HTTPException(status_code=404, detail="Job not found")
    with open(job_path) as f:
        data = json.load(f)
    return data


@router.patch("/writer_jobs/{job_id}")
async def update_writer_job(job_id: str, payload: dict):
    from pathlib import Path
    from app.config import settings

    job_path = Path(settings.writer_job_dir) / f"{job_id}.json"
    if not job_path.is_file():
        raise HTTPException(status_code=404, detail="Job not found")
    with open(job_path) as f:
        data = json.load(f)
    data.update(payload)
    with open(job_path, "w") as f:
        json.dump(data, f)
    data["job_id"] = job_id
    return data


@router.get("/writer_jobs")
async def list_writer_jobs():
    from pathlib import Path
    from app.config import settings

    job_dir = Path(settings.writer_job_dir)
    job_dir.mkdir(parents=True, exist_ok=True)
    jobs = []
    for p in job_dir.glob("*.json"):
        with open(p) as f:
            data = json.load(f)
        data["job_id"] = p.stem
        jobs.append(data)
    return jobs


@router.get("/novelist_jobs/{job_id}")
async def novelist_job_status(job_id: str):
    from pathlib import Path
    from app.config import settings

    job_path = Path(settings.novelist_job_dir) / f"{job_id}.json"
    if not job_path.is_file():
        raise HTTPException(status_code=404, detail="Job not found")
    with open(job_path) as f:
        data = json.load(f)
    return data


@router.patch("/novelist_jobs/{job_id}")
async def update_novelist_job(job_id: str, payload: dict):
    from pathlib import Path
    from app.config import settings

    job_path = Path(settings.novelist_job_dir) / f"{job_id}.json"
    if not job_path.is_file():
        raise HTTPException(status_code=404, detail="Job not found")
    with open(job_path) as f:
        data = json.load(f)
    data.update(payload)
    with open(job_path, "w") as f:
        json.dump(data, f)
    data["job_id"] = job_id
    return data


@router.get("/novelist_jobs")
async def list_novelist_jobs():
    from pathlib import Path
    from app.config import settings

    job_dir = Path(settings.novelist_job_dir)
    job_dir.mkdir(parents=True, exist_ok=True)
    jobs = []
    for p in job_dir.glob("*.json"):
        with open(p) as f:
            data = json.load(f)
        data["job_id"] = p.stem
        jobs.append(data)
    return jobs

@router.post("/{agent_id}/chat")
async def chat(
    agent_id: int,
    payload: ChatRequest,
    session: AsyncSession = Depends(get_session),
    user: User = Depends(get_current_user),
):
    msgs = [m.model_dump() for m in payload.messages]
    agent = await get_agent(session, agent_id)
    if not agent or agent.vector_db_update_date is None:
        raise HTTPException(status_code=400, detail="Agent unavailable")

    history = crud_chat_history.load_history(user.id, agent_id)
    user_msg = msgs[-1] if msgs else {"role": "user", "content": ""}
    chat_messages = history + [user_msg]
    assistant_resp = await chat_with_agent(
        session,
        agent_id,
        chat_messages,
        user_nickname=user.nickname,
    )

    assistant_msg = {"role": "assistant", "content": assistant_resp["answer"]}
    if assistant_resp.get("sources"):
        assistant_msg["sources"] = assistant_resp["sources"]

    new_history = (history + [user_msg, assistant_msg])[-20:]
    crud_chat_history.save_history(user.id, agent_id, new_history)

    return JSONResponse(assistant_resp)


@router.get("/{agent_id}/history")
async def chat_history(agent_id: int, user: User = Depends(get_current_user)):
    messages = crud_chat_history.load_history(user.id, agent_id)
    return {"messages": messages[-20:]}


@router.delete("/{agent_id}/history")
async def clear_chat_history(agent_id: int, user: User = Depends(get_current_user)):
    """Remove all stored chat messages between the current user and this agent."""
    crud_chat_history.clear_history(user.id, agent_id)
    return {"ok": True}


@router.post("/{agent_id}/chat_test")
async def chat_test(
    agent_id: int,
    payload: ChatRequest,
    session: AsyncSession = Depends(get_session),
    user: User = Depends(get_current_user),
):
    """Return the vector DB documents for the last user message."""
    msgs = [m.model_dump() for m in payload.messages]
    agent = await get_agent(session, agent_id)
    if not agent or agent.vector_db_update_date is None:
        raise HTTPException(status_code=400, detail="Agent unavailable")

    query = msgs[-1].get("content", "") if msgs else ""
    docs = crud_vectordb.query_world(agent.world_id, query, n_results=4)
    return {"documents": docs}


@router.post("/", response_model=AgentRead)
async def create_agent_endpoint(
    agent: AgentCreate,
    session: AsyncSession = Depends(get_session),
    user: User = Depends(require_role(UserRole.world_builder)),
):
    db_agent = Agent(
        **agent.model_dump(),
    )
    return await create_agent(session, db_agent)


@router.get("/", response_model=List[AgentRead])
async def list_agents(
    world_id: Optional[int] = None,
    session: AsyncSession = Depends(get_session),
):
    return await get_agents(session, world_id)


@router.get("/{agent_id}", response_model=AgentRead)
async def read_agent(
    agent_id: int,
    session: AsyncSession = Depends(get_session),
):
    agent = await get_agent(session, agent_id)
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")
    return agent


@router.patch("/{agent_id}", response_model=AgentRead)
async def update_agent_endpoint(
    agent_id: int,
    updates: AgentUpdate,
    session: AsyncSession = Depends(get_session),
    user: User = Depends(require_role(UserRole.world_builder)),
):
    agent = await update_agent(session, agent_id, updates.model_dump(exclude_unset=True))
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")
    return agent


@router.delete("/{agent_id}")
async def delete_agent_endpoint(
    agent_id: int,
    session: AsyncSession = Depends(get_session),
    user: User = Depends(require_role(UserRole.world_builder)),
):
    success = await delete_agent(session, agent_id)
    if not success:
        raise HTTPException(status_code=404, detail="Agent not found")
    return {"ok": True}


@router.post("/{agent_id}/pages/{page_id}/analyze")
async def analyze_page_endpoint(
    agent_id: int,
    page_id: int,
    session: AsyncSession = Depends(get_session),
    user: User = Depends(get_current_user),
):
    agent = await get_agent(session, agent_id)
    page = await get_page(session, page_id)
    if not agent or not page:
        raise HTTPException(status_code=404, detail="Agent or page not found")
    if agent.world_id != page.gameworld_id:
        raise HTTPException(status_code=400, detail="Agent and page belong to different worlds")

    result = await analyze_page(session, agent, page)
    return result


class GeneratePagesRequest(BaseModel):
    pages: List[dict]


@router.post("/{agent_id}/pages/{page_id}/generate")
async def generate_pages_endpoint(
    agent_id: int,
    page_id: int,
    payload: GeneratePagesRequest,
    session: AsyncSession = Depends(get_session),
    user: User = Depends(get_current_user),
):
    agent = await get_agent(session, agent_id)
    page = await get_page(session, page_id)
    if not agent or not page:
        raise HTTPException(status_code=404, detail="Agent or page not found")
    if agent.world_id != page.gameworld_id:
        raise HTTPException(status_code=400, detail="Agent and page belong to different worlds")

    result = await generate_pages(session, agent, page, payload.pages)
    return result


class AnalyzeJobRequest(BaseModel):
    pass


@router.post("/{agent_id}/pages/{page_id}/analyze_job")
async def analyze_page_job_endpoint(
    agent_id: int,
    page_id: int,
    user: User = Depends(get_current_user),
):
    from uuid import uuid4
    from pathlib import Path
    from app.config import settings
    from app.task_queue import task_analyze_pages_job

    job_id = uuid4().hex
    job_dir = Path(settings.writer_job_dir)
    job_dir.mkdir(parents=True, exist_ok=True)
    job_path = job_dir / f"{job_id}.json"
    with open(job_path, "w") as f:
        json.dump(
            {
                "status": "queued",
                "agent_id": agent_id,
                "job_type": "analyze_pages",
                "page_ids": [page_id],
                "pages_total": 1,
                "pages_processed": 0,
            },
            f,
        )

    task_analyze_pages_job.delay(agent_id, [page_id], job_id)
    return {"job_id": job_id}


class GenerateJobRequest(BaseModel):
    pages: List[dict]
    suggestions: Optional[List[dict]] = None
    merge_groups: Optional[List[List[str]]] = None
    bulk_accept_updates: Optional[bool] = False


@router.post("/{agent_id}/pages/{page_id}/generate_job")
async def generate_pages_job_endpoint(
    agent_id: int,
    page_id: int,
    payload: GenerateJobRequest,
    user: User = Depends(get_current_user),
):
    from uuid import uuid4
    from pathlib import Path
    from app.config import settings
    from app.task_queue import task_generate_pages_job

    job_id = uuid4().hex
    job_dir = Path(settings.writer_job_dir)
    job_dir.mkdir(parents=True, exist_ok=True)
    job_path = job_dir / f"{job_id}.json"
    with open(job_path, "w") as f:
        json.dump(
            {
                "status": "queued",
                "agent_id": agent_id,
                "page_id": page_id,
                "job_type": "generate_pages",
                "merge_groups": payload.merge_groups or [],
                "suggestions": payload.suggestions or [],
                "bulk_accept_updates": payload.bulk_accept_updates or False,
            },
            f,
        )

    task_generate_pages_job.delay(
        agent_id,
        page_id,
        payload.pages,
        job_id,
        payload.merge_groups or [],
        payload.suggestions or [],
        payload.bulk_accept_updates or False,
    )
    return {"job_id": job_id}


class AnalyzePagesJobRequest(BaseModel):
    page_ids: List[int]


class NovelJobRequest(BaseModel):
    text: str
    instructions: str
    example: str | None = None
    helper_agents: Optional[List[int]] = None


@router.post("/{agent_id}/analyze_job")
async def analyze_pages_job_endpoint(
    agent_id: int,
    payload: AnalyzePagesJobRequest,
    user: User = Depends(get_current_user),
):
    from uuid import uuid4
    from pathlib import Path
    from app.config import settings
    from app.task_queue import task_analyze_pages_job

    job_id = uuid4().hex
    job_dir = Path(settings.writer_job_dir)
    job_dir.mkdir(parents=True, exist_ok=True)
    job_path = job_dir / f"{job_id}.json"

    with open(job_path, "w") as f:
        json.dump(
            {
                "status": "queued",
                "agent_id": agent_id,
                "job_type": "analyze_pages",
                "page_ids": payload.page_ids,
                "pages_total": len(payload.page_ids),
                "pages_processed": 0,
            },
            f,
        )

    task_analyze_pages_job.delay(agent_id, payload.page_ids, job_id)
    return {"job_id": job_id}


@router.post("/{agent_id}/novel_job")
async def create_novel_job_endpoint(
    agent_id: int,
    payload: NovelJobRequest,
    user: User = Depends(get_current_user),
):
    from uuid import uuid4
    from pathlib import Path
    from app.config import settings
    from app.task_queue import task_create_novel_job

    job_id = uuid4().hex
    job_dir = Path(settings.novelist_job_dir)
    job_dir.mkdir(parents=True, exist_ok=True)
    job_path = job_dir / f"{job_id}.json"
    with open(job_path, "w") as f:
        json.dump(
            {
                "status": "queued",
                "agent_id": agent_id,
                "job_type": "create_novel",
            },
            f,
        )

    task_create_novel_job.delay(
        agent_id,
        payload.text,
        payload.instructions,
        payload.example,
        payload.helper_agents or [],
        job_id,
    )
    return {"job_id": job_id}


