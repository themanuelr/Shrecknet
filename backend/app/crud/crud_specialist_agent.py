from datetime import datetime, timezone
from typing import List

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from langchain_openai import ChatOpenAI
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.messages import HumanMessage
from langgraph.graph import Graph

from app.config import settings
from app.models.model_agent import Agent
from app.models.model_specialist_source import SpecialistSource
from .crud_specialist_vectordb import query_agent
from .crud_agent import ensure_personality_prompts

openai_model = settings.open_ai_model


async def chat_with_specialist(
    session: AsyncSession,
    agent_id: int,
    messages: List[dict],
    n_results: int = 5,
    user_nickname: str | None = None,
) -> dict:
    """Generate a chat response using the specialist vector database."""
    agent = await session.get(Agent, agent_id)
    if not agent or agent.specialist_update_date is None:
        raise ValueError("Agent unavailable")

    query = messages[-1].get("content", "") if messages else ""
    docs = query_agent(agent_id, query, max(n_results, 5))

    # Map source ids to names
    src_ids = {d.get("source_id") for d in docs if d.get("source_id") is not None}
    sources_lookup = {}
    if src_ids:
        result = await session.execute(
            select(SpecialistSource).where(SpecialistSource.id.in_(src_ids))
        )
        for src in result.scalars().all():
            sources_lookup[src.id] = src.name or f"Source {src.id}"

    sources = []
    context_parts = []
    for d in docs:
        sid = d.get("source_id")
        name = sources_lookup.get(sid, f"Source {sid}")
        sources.append({"name": name})
        context_parts.append(f"[{name}]\n{d['document']}")
    context = "\n\n".join(context_parts)

    history_txt = "\n".join(f"{m['role']}: {m['content']}" for m in messages[:-1])
    personalities = [p.strip() for p in (agent.personality or "helpful").split(',') if p.strip()]
    agent_name = agent.name or "Specialist"

    prompts = await ensure_personality_prompts(personalities)
    tone = "\n".join(prompts.get(p, "") for p in personalities if prompts.get(p))
    personality = ", ".join(personalities) if personalities else "helpful"

    system_prompt = (
        "You are an expert assistant that consults a knowledge base.\n"
        +f"Agent name: {agent_name}\n"
        +f"Agent's personality: {personality}\n"
        +f"{tone}\n"
        + (f"The user you are assisting is named {user_nickname}. Always address them as {user_nickname}.\n" if user_nickname else "")
        +"Use the following context and chat history to answer the user's question.\n"
        +"Add HTML formatting like <p> or <strong> to make responses pleasant.\n"
        +"If no relevant information is found in the documents, inform the user."
    )

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

    builder = Graph()
    builder.add_node("chat", chain)
    builder.set_entry_point("chat")
    builder.set_finish_point("chat")
    graph = builder.compile()

    response = await graph.ainvoke({"input": query})
    answer = getattr(response, "content", str(response))

    return {"answer": answer, "sources": sources}
