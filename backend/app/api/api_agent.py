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
from app.crud.crud_page_analysis import analyze_page
from app.crud.crud_page import get_page
from app.schemas.schema_agent import AgentCreate, AgentRead, AgentUpdate
from app.database import get_session
from pydantic import BaseModel
from typing import List, Literal, Optional

class ChatMessage(BaseModel):
    role: Literal["system", "user", "assistant"]
    content: str

class ChatRequest(BaseModel):
    messages: List[ChatMessage]

router = APIRouter(prefix="/agents", tags=["Agents"], dependencies=[Depends(get_current_user)])

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
    assistant_text = await chat_with_agent(session, agent_id, chat_messages)

    new_history = (
        history + [user_msg, {"role": "assistant", "content": assistant_text}]
    )[-20:]
    crud_chat_history.save_history(user.id, agent_id, new_history)

    return JSONResponse({"content": assistant_text})


@router.get("/{agent_id}/history")
async def chat_history(agent_id: int, user: User = Depends(get_current_user)):
    messages = crud_chat_history.load_history(user.id, agent_id)
    return {"messages": messages[-20:]}


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

