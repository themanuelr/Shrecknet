from fastapi import APIRouter, Depends, HTTPException
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

@router.post("/{world_id}/chat")
async def chat(world_id: int, payload: ChatRequest, user: User = Depends(get_current_user)):
    msgs = [m.model_dump() for m in payload.messages]
    response = chat_with_agent(world_id, msgs)
    return {"response": response}


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

