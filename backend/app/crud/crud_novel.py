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
    progress_cb=None,
) -> str:
    """Generate a novel from a source text using an agent."""
    helper_agent_ids = helper_agent_ids or []
    world_agent_id = helper_agent_ids[0] if helper_agent_ids else None
    critic_agent_id = helper_agent_ids[1] if len(helper_agent_ids) > 1 else None

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

    # group raw chunks in sets of three for a more coherent rewrite
    grouped_chunks = [
        chunks[i : i + 3] for i in range(0, len(chunks), 3)
    ]

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
    summaries = []
    total_pass1 = len(grouped_chunks)
    for idx, group in enumerate(grouped_chunks):
        if progress_cb:
            progress_cb(idx, total_pass1)

        prev_summary = " ".join(summaries[-3:])
        group_text = "\n\n".join(group)

        base_prompt = (
            f"Follow these instructions when rewriting as a narrative book chapter: {instructions}\n"
            "Use a poetic and character-driven narrative focusing on actions, fears and passions.\n"
            + (f"Write in this style: {style_prompt}.\n" if style_prompt else "")
            + (f"Previous summary: {prev_summary}\n" if prev_summary else "")
        )

        messages = [
            {"role": "system", "content": base_prompt},
            {"role": "user", "content": group_text},
        ]
        resp = await chat_with_agent(session, agent.id, messages)
        rewritten = resp.get("answer", "")

        # ask helper agent for extra info if available
        if world_agent_id:
            helper_msgs = [
                {"role": "system", "content": "Provide additional world details for this text."},
                {"role": "user", "content": rewritten},
            ]
            helper_resp = await chat_with_agent(session, world_agent_id, helper_msgs)
            rewritten = rewritten + " " + helper_resp.get("answer", "")

        final_sections.append(rewritten)
        summaries.append(rewritten.split(".")[0][:200])

    draft = "\n\n".join(final_sections)
    full_summary = " ".join(summaries)

    # critic pass for overall suggestions
    critic_notes = ""
    if critic_agent_id is not None:
        critic_prompt = (
            "You are a literary critic. Read the following chapter summary and provide bullet point suggestions to make it concise and compelling."
        )
        critic_messages = [
            {"role": "system", "content": critic_prompt},
            {"role": "user", "content": full_summary},
        ]
        critic_resp = await chat_with_agent(session, critic_agent_id, critic_messages)
        critic_notes = critic_resp.get("answer", "")

    # second rewrite incorporating critic suggestions
    words2 = draft.split()
    rewrite_chunks = []
    step2 = 1000
    overlap2 = 100
    if len(words2) <= step2:
        rewrite_chunks = [" ".join(words2)]
    else:
        for i in range(0, len(words2), step2):
            chunk_words = words2[i : i + step2]
            if i > 0:
                overlap_start = max(0, i - overlap2)
                chunk_words = words2[overlap_start : i + step2]
            rewrite_chunks.append(" ".join(chunk_words))

    final_sections2 = []
    summary = ""
    total = total_pass1 + len(rewrite_chunks)
    for idx, chunk in enumerate(rewrite_chunks):
        if progress_cb:
            progress_cb(total_pass1 + idx, total)
        base_prompt = (
            f"Apply these critic notes when rewriting: {critic_notes}\n"
            f"{instructions}\n"
            "Write as a cohesive short book chapter with proper pace and length. Use narrative and poetic language focused on characters.\n"
            + (f"Write in this style: {style_prompt}.\n" if style_prompt else "")
            + (f"Previous summary: {summary}\n" if summary else "")
        )
        messages = [
            {"role": "system", "content": base_prompt},
            {"role": "user", "content": chunk},
        ]
        resp = await chat_with_agent(session, agent.id, messages)
        rewritten = resp.get("answer", "")

        if world_agent_id:
            helper_msgs = [
                {"role": "system", "content": "Provide additional world details for this text."},
                {"role": "user", "content": rewritten},
            ]
            helper_resp = await chat_with_agent(session, world_agent_id, helper_msgs)
            rewritten = rewritten + " " + helper_resp.get("answer", "")

        final_sections2.append(rewritten)
        summary = rewritten.split(".")[0][:200]

    return "\n\n".join(final_sections2)
