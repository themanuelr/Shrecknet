from sqlalchemy.ext.asyncio import AsyncSession
from app.models.model_agent import Agent
from app.api.api_agent import chat_with_agent
from langchain_openai import ChatOpenAI
from langchain_core.prompts import ChatPromptTemplate
from app.config import settings

async def create_novel(
    session: AsyncSession,
    agent: Agent,
    text: str,
    instructions: str,
    example: str | None = None,
    helper_agent_ids: list[int] | None = None,
    progress_cb=None,
) -> str:
    """
    Generate a novel from transcript text and instructions using one or more AI agents.
    """

    helper_agent_ids = helper_agent_ids or []
    world_agent_id = helper_agent_ids[0] if helper_agent_ids else None
    critic_agent_id = helper_agent_ids[0] if helper_agent_ids else None

    words = text.split()
    chunks = []
    step = 5000  # ou ajuste conforme necessário
    chunks = [" ".join(words[i:i+step]) for i in range(0, len(words), step)]
    
    # step = 2000
    # overlap = 250
    # if len(words) <= step:
    #     chunks = [" ".join(words)]
    # else:
    #     for i in range(0, len(words), step):
    #         chunk_words = words[i : i + step]
    #         if i > 0:
    #             overlap_start = max(0, i - overlap)
    #             chunk_words = words[overlap_start : i + step]
    #         chunks.append(" ".join(chunk_words))

    grouped_chunks = [chunks[i : i + 3] for i in range(0, len(chunks), 3)]

    # Extract writing style prompt if example is provided
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
        group_text = "\n\n".join(group)

        # --- Get world/lore info first ---
        world_info = ""
        if world_agent_id:
            helper_content = (
                "Given the following transcript, provide relevant world, lore, and character details that a novelist could use to enrich the scene.\n"
                "If any mapping of player names to character names is provided, use those character names for all references.\n"                
                f"{'Instructions: ' + instructions if instructions else ''}"
            )
            helper_msgs = [
                {"role": "system", "content": helper_content},
                {"role": "user", "content": group_text},
            ]
            helper_resp = await chat_with_agent(session, world_agent_id, helper_msgs)
            world_info = helper_resp.get("answer", "")

        prev_summary = " ".join(summaries[-3:])

        # --- Main Rewrite Prompt ---
        base_prompt = (
            "You are a talented fantasy novelist. Your task is to transform an RPG session transcript into an immersive book chapter.\n"
            "Follow the instructions below for world, tone, and characters.\n"
            "Rules:\n"
            "...(your previous prompt blocks)...\n"
            "- You may invent brief narration, transitions, or lines of dialogue to connect events or make the story flow more smoothly. Any invented content must fit the established characters and events, and should not contradict what actually happened.\n"
            "- Incorporate this background/world info as appropriate: " + (world_info if world_info else "") + "\n"
            "- Avoid all repetition: do NOT repeat scenes, phrases, or ideas from previous sections (see previous summary below).\n"
            "- At the end, add a block beginning with 'Summary:' and write a concise 1-3 sentence summary of this section for use in the next chunk.\n"
            f"{'Map the following players to characters, and follow these instructions: ' + instructions if instructions else ''}\n"
            f"{'Emulate this style: ' + style_prompt if style_prompt else ''}\n"
            f"{'Refer to this previous summary to maintain flow and avoid repetition: ' + prev_summary if prev_summary else ''}\n"
            "Here is the transcript for this section:\n"
            f"{group_text}\n"
        )

        messages = [
            {"role": "system", "content": base_prompt},
            {"role": "user", "content": group_text},
        ]
        resp = await chat_with_agent(session, agent.id, messages)
        output = resp.get("answer", "")
        # Parse output
        if "\nSummary:" in output:
            rewritten, summary = output.split("\nSummary:", 1)
            rewritten = rewritten.strip()
            summary = summary.strip()
        else:
            rewritten = output
            summary = ""

        final_sections.append(rewritten)
        summaries.append(summary[:250])

    draft = "\n\n".join(final_sections)
    full_summary = "\n".join(summaries)

    # Critic pass for suggestions
    critic_notes = ""
    if critic_agent_id is not None:
        critic_prompt = (
            "You are a literary critic. Read the following chapter draft and provide bullet-point suggestions to improve it as a published fantasy novel.\n"
            "Focus on narrative flow, pacing, character development, emotional resonance, avoiding repetition, and creating an immersive experience for the reader. "
            "Point out any awkward transitions, flat dialogue, or places where more character thoughts or vivid description would help. "
            "Be detailed but concise."
        )
        critic_messages = [
            {"role": "system", "content": critic_prompt},
            {"role": "user", "content": full_summary},
        ]
        critic_resp = await chat_with_agent(session, critic_agent_id, critic_messages)
        critic_notes = critic_resp.get("answer", "")

    # Second rewrite incorporating critic suggestions
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
        rewrite_prompt = (
            "Apply the following critic notes and instructions as you rewrite this chapter draft into a seamless, engaging, and polished book chapter. "
            "Incorporate the suggestions to enhance character depth, natural dialogue, emotional impact, and world immersion. "
            "Maintain narrative continuity and eliminate repetition or awkward phrasing. "
            f"{instructions}\n"
            f"{'Emulate this style: ' + style_prompt if style_prompt else ''}\n"
            f"{'Critic notes: ' + critic_notes if critic_notes else ''}\n"
            f"{'Refer to this previous summary for continuity: ' + summary if summary else ''}\n"
            "Rewrite the following text:"
        )
        messages = [
            {"role": "system", "content": rewrite_prompt},
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
        summary_text = rewritten.split(".")[:2]
        summary = ".".join(summary_text)[:250]

    return "\n\n".join(final_sections2)
