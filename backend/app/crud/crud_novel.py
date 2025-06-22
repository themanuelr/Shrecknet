from sqlalchemy.ext.asyncio import AsyncSession
from app.models.model_agent import Agent
from app.api.api_agent import chat_with_agent
from langchain_openai import ChatOpenAI
from langchain_core.prompts import ChatPromptTemplate
from app.config import settings
import math

async def create_novel(
    session: AsyncSession,
    agent: Agent,
    text: str,
    instructions: str,
    example: str | None = None,
    helper_agent_ids: list[int] | None = None,
    progress_cb = None,
) -> str:
    """Generate a novel from a source text using an agent."""
    helper_agent_ids = helper_agent_ids or []
    words = text.split()
    chunks = []
    step = 2000
    overlap = 250
    if len(words) <= step:
        chunks = [" ".join(words)]
    else:
        for i in range(0, len(words), step):
            chunk_words = words[i : i + step]
            if i > 0:
                overlap_start = max(0, i - overlap)
                chunk_words = words[overlap_start : i + step]
            chunks.append(" ".join(chunk_words))

    style_prompt = ""
    if example:
        llm = ChatOpenAI(api_key=settings.openai_api_key or "sk-test", model=settings.open_ai_model)
        prompt = ChatPromptTemplate.from_messages([
            ("system", "Extract a short prompt describing the writing style."),
            ("user", "{text}"),
        ])
        chain = prompt | llm
        try:
            resp = await chain.ainvoke({"text": example})
            style_prompt = resp.content.strip()
        except Exception:
            style_prompt = ""

    final_sections = []
    summary = ""
    for idx, chunk in enumerate(chunks):
        if progress_cb:
            progress_cb(idx, len(chunks))
        base_prompt = (
            f"Follow these instructions when rewriting: {instructions}\n" +
            (f"Write in this style: {style_prompt}.\n" if style_prompt else "") +
            (f"Previous summary: {summary}\n" if summary else "")
        )
        messages = [
            {"role": "system", "content": base_prompt},
            {"role": "user", "content": chunk},
        ]
        resp = await chat_with_agent(session, agent.id, messages)
        rewritten = resp.get("answer", "")

        # ask helper agent for extra info if available
        if helper_agent_ids:
            helper_msgs = [
                {"role": "system", "content": "Provide additional world details for this text."},
                {"role": "user", "content": rewritten},
            ]
            helper_resp = await chat_with_agent(session, helper_agent_ids[0], helper_msgs)
            rewritten = rewritten + " " + helper_resp.get("answer", "")

        final_sections.append(rewritten)
        # quick summary for continuity using first sentence
        summary = rewritten.split(".")[0][:200]

    return "\n\n".join(final_sections)
