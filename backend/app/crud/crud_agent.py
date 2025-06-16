

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
    session: AsyncSession, agent_id: int, messages: list[dict], n_results: int = 5
) -> dict:
    """Return a chat response and source links using OpenAI with world and agent context."""

    agent = await session.get(Agent, agent_id)
    if not agent or agent.vector_db_update_date is None:
        raise ValueError("Agent unavailable")

    n_results = max(n_results, 5)

    # print (f" - AGENT CHAT: {agent.name}")

    query = messages[-1].get("content", "") if messages else ""
    docs = crud_vectordb.query_world(agent.world_id, query, n_results)
    world = await session.get(GameWorld, agent.world_id)
    # print (f" ---- Querry: {query}")
    # print (f" ---- Docs: {docs}")    
    # print (f" ---- world: {world}")        

    sources = []
    context_parts = []
    for d in docs:
        page_id = d.get("page_id")
        concept_id = d.get("concept_id")
        title = d.get("title") or f"Page {page_id}" if page_id else "Unknown page"
        if page_id is None or concept_id is None:
            continue
        url = f"/worlds/{agent.world_id}/concept/{concept_id}/page/{page_id}"
        sources.append({"title": title, "url": url})
        context_parts.append(f"[{title}]\n{d['document']}")
    context = "\n\n".join(context_parts)
      

    history_txt = "\n".join(f"{m['role']}: {m['content']}" for m in messages[:-1])
    personality = agent.personality or "helpful NPC"
    agent_name = agent.name or "Agent"

    # print (f" ---- Context: {context}")
    # print (f" ---- history_txt: {history_txt}")
    # print (f" ---- personality: {personality}")    


    system_prompt = (
        "The agent is a helper to consume data from the world.\n"
        f"Agent name: {agent_name}\n"
        f"World system: {world.system}\n"
        f"World description: {world.description}\n"
        f"Agent`s personality: {personality}\n"
        "Use the following context and chat history to answer the user's question.\n"
        "Use the agent`s personality to give the tone of your responses. Stick to it, and make it creative!\n"
        "Do not mention any links in your answer.\n"
        "If no relevant information is found in the documents, inform the user."
    )

    # print (f" ---- system_prompt: {system_prompt}") 

    prompt = ChatPromptTemplate.from_messages(
        [
            ("system", system_prompt),
            ("system", f"Context:\n{context}" if context else "Context: none"),
            ("system", f"Chat history:\n{history_txt}" if history_txt else "Chat history: none"),
            ("user", "{input}"),
        ]
    )

    llm = ChatOpenAI(api_key=settings.openai_api_key or "sk-test", model=openai_model)
    chain = prompt | llm

    builder = MessageGraph()
    builder.add_node("chat", chain)
    builder.set_entry_point("chat")
    builder.set_finish_point("chat")
    graph = builder.compile()

    response = await graph.ainvoke([HumanMessage(content=query)], {"input": query})

    return {"answer": response[1].content, "sources": sources}


from sqlalchemy.future import select
from datetime import datetime, timezone
from typing import List, Optional

async def create_agent(session: AsyncSession, agent: Agent) -> Agent:

    print (f"Creating this agent: {agent}")

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
    return_result = result.scalars().all()
    print (f"GOT THIS AGENTS: {return_result}")
    return return_result

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
