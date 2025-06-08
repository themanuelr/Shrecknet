from typing import AsyncGenerator

from openai import OpenAI
from app.config import settings
from app.crud import crud_vectordb
from app.models.model_agent import Agent
from sqlalchemy.ext.asyncio import AsyncSession

openai_model = settings.open_ai_model


async def chat_with_agent(
    session: AsyncSession, agent_id: int, messages: list[dict], n_results: int = 4
) -> AsyncGenerator[str, None]:
    """Stream a chat response using OpenAI with world and agent context."""

    agent = await session.get(Agent, agent_id)
    if not agent or agent.vector_db_update_date is None:
        raise ValueError("Agent unavailable")

    query = messages[-1].get("content", "") if messages else ""
    docs = crud_vectordb.query_world(agent.world_id, query, n_results)
    context = "\n\n".join(d["document"] for d in docs)
    personality = agent.personality or "helpful NPC"
    system_prompt = (
        f"You are an NPC with the following personality: {personality}. Use the following context to answer:\n"
        + context
    )
    chat_messages = [{"role": "system", "content": system_prompt}] + messages

    client = OpenAI(api_key=settings.openai_api_key)
    stream = client.chat.completions.create(
        model=openai_model, messages=chat_messages, stream=True
    )

    for chunk in stream:
        content = chunk.choices[0].delta.content
        if content:
            yield content


from sqlalchemy.future import select
from datetime import datetime, timezone
from typing import List, Optional

async def create_agent(session: AsyncSession, agent: Agent) -> Agent:
    session.add(agent)
    await session.commit()
    await session.refresh(agent)
    return agent

async def get_agent(session: AsyncSession, agent_id: int) -> Optional[Agent]:
    return await session.get(Agent, agent_id)

async def get_agents(session: AsyncSession, world_id: int | None = None) -> List[Agent]:
    stmt = select(Agent)
    if world_id:
        stmt = stmt.where(Agent.world_id == world_id)
    result = await session.execute(stmt)
    return result.scalars().all()

async def update_agent(session: AsyncSession, agent_id: int, updates: dict) -> Optional[Agent]:
    db_agent = await session.get(Agent, agent_id)
    if not db_agent:
        return None
    for k, v in updates.items():
        setattr(db_agent, k, v)
    db_agent.updated_at = datetime.now(timezone.utc)
    await session.commit()
    await session.refresh(db_agent)
    return db_agent

async def delete_agent(session: AsyncSession, agent_id: int) -> bool:
    db_agent = await session.get(Agent, agent_id)
    if not db_agent:
        return False
    await session.delete(db_agent)
    await session.commit()
    return True
