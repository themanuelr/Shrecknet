from typing import AsyncGenerator

from sqlalchemy.ext.asyncio import AsyncSession

from langchain_openai import ChatOpenAI
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.messages import HumanMessage
from langgraph.graph import MessageGraph

from app.config import settings
from app.crud import crud_vectordb
from app.models.model_agent import Agent
from app.models.model_gameworld import GameWorld

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
    world = await session.get(GameWorld, agent.world_id)

    context_parts = []
    for d in docs:
        page_id = d.get("page_id")
        concept_id = d.get("concept_id")
        if page_id is None or concept_id is None:
            continue
        link = f"website/worlds/{agent.world_id}/concept/{concept_id}/page/{page_id}"
        context_parts.append(f"[{link}] {d['document']}")
    context = "\n\n".join(context_parts)

    history_txt = "\n".join(f"{m['role']}: {m['content']}" for m in messages[:-1])
    personality = agent.personality or "helpful NPC"
    system_prompt = (
        "The agent is a helper to consume data from the world.\n"
        f"World system: {world.system}\n"
        f"World description: {world.description}\n"
        f"Personality: {personality}\n"
        "Use the following context and chat history to answer the user's question.\n"
        "When referencing information, cite the page link used.\n"
        "If no relevant information is found in the documents, inform the user."
    )

    prompt = ChatPromptTemplate.from_messages(
        [
            ("system", system_prompt),
            ("system", f"Context:\n{context}" if context else "Context: none"),
            ("system", f"Chat history:\n{history_txt}" if history_txt else "Chat history: none"),
            ("user", "{input}"),
        ]
    )

    llm = ChatOpenAI(api_key=settings.openai_api_key or "sk-test", model=openai_model, streaming=True)
    chain = prompt | llm

    builder = MessageGraph()
    builder.add_node("chat", chain)
    builder.set_entry_point("chat")
    builder.set_finish_point("chat")
    graph = builder.compile()

    async for step in graph.astream([HumanMessage(content=query)], {"input": query}):
        messages_out = step.get("chat", [])
        for msg in messages_out:
            if getattr(msg, "content", None):
                yield msg.content


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
