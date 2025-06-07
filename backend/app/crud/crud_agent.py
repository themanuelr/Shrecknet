from openai import OpenAI
from app.config import settings
from app.crud import crud_vectordb

openai_model = settings.open_ai_model


def chat_with_agent(world_id: int, messages: list[dict], n_results: int = 4) -> str:
    """Generate a chat response using OpenAI with world context."""
    query = messages[-1].get("content", "") if messages else ""
    docs = crud_vectordb.query_world(world_id, query, n_results)
    context = "\n\n".join(d["document"] for d in docs)
    system_prompt = (
        "You are a helpful NPC from the game world. Use the following context to answer:\n"
        + context
    )
    chat_messages = [{"role": "system", "content": system_prompt}] + messages
    # Initialize the OpenAI client lazily to avoid issues during import
    client = OpenAI(api_key=settings.openai_api_key)
    print (f"Testing this model: {openai_model}")
    resp = client.chat.completions.create(model=openai_model, messages=chat_messages)
    return resp.choices[0].message.content


from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from datetime import datetime, timezone
from typing import List, Optional
from app.models.model_agent import Agent

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
