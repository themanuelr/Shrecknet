from sqlalchemy.ext.asyncio import AsyncSession
from app.models.model_agent import Agent
from app.api.api_agent import chat_with_agent
from langchain_openai import ChatOpenAI
from langchain_core.prompts import ChatPromptTemplate
from app.config import settings


def split_into_arcs(text, min_words_per_arc=1000, max_arcs=5):
    words = text.split()
    n_words = len(words)

    if n_words <= min_words_per_arc:
        # Only one arc if text is small
        return [" ".join(words)]

    # Calculate number of arcs (never more than max_arcs)
    n_arcs = min((n_words + min_words_per_arc - 1) // min_words_per_arc, max_arcs)
    arc_sizes = [n_words // n_arcs + (1 if i < n_words % n_arcs else 0) for i in range(n_arcs)]

    arcs = []
    start = 0
    for size in arc_sizes:
        arcs.append(" ".join(words[start:start+size]))
        start += size
    return arcs


async def create_novel(
    session: AsyncSession,
    agent: Agent,
    text: str,
    instructions: str,
    example: str | None = None,  # Still included, but not used in this version
    helper_agent_ids: list[int] | None = None,
    progress_cb=None,
) -> str:
    """
    Generate a concise, structured novelization from transcript text.
    Output will be formatted, brief, and under 2000 words, with creative transitions/dialogue allowed.
    """

    # ----- Helper Agents -----
    helper_agent_ids = helper_agent_ids or []
    world_agent_id = helper_agent_ids[0] if helper_agent_ids else None
    critic_agent_id = helper_agent_ids[0] if len(helper_agent_ids) > 1 else None

    # ----- 1. Split into 1-4 arcs (each max 500 words) -----
    arcs = split_into_arcs(text, min_words_per_arc=1000, max_arcs=5)

    arc_novels = []
    arc_worlds = []
    arc_critic_notes = []

    # ----- 2. Process each arc: Novelize, World, Critic -----
    for idx, arc_text in enumerate(arcs):
        if progress_cb:
            progress_cb(idx, len(arcs) + 2)

        # --- Novelize arc, allow creative bridges/dialogue for flow ---
        novel_prompt = f"""
You are a talented fantasy novelist. Rewrite the following RPG transcript arc as a **brief, engaging, and flowing novel segment** (max 1000 words).
You are allowed to invent short dialogue lines or brief bridge scenes when needed to improve story flow and immersion, but do NOT contradict established events or character/world consistency.

- Write your answer in the same language as the transcript below.
- Format dialogue as in a novel (for example: — Gryx: What's happening here?).
- Keep it concise, focus on main events, character emotions, and dramatic transitions.
- You may add brief invented narration, dialogue, or transitions for flow, as long as they fit the characters and events.
- Do NOT repeat or invent entire scenes; only fill gaps for readability.
- Give the segment a clear beginning, middle, and end.
- Instructions: {instructions}
Transcript:
{arc_text}
"""

        novel_resp = await chat_with_agent(
            session, agent.id, [{"role": "system", "content": novel_prompt}]
        )
        novel_arc = novel_resp.get("answer", "").strip()
        arc_novels.append(novel_arc)

#         # --- World Info (optional per arc) ---
#         world_info = ""
#         if world_agent_id:
#             world_prompt = f"""
# Given this RPG transcript arc, provide world, lore, and character details that a novelist could use to enrich the story.
# If player-to-character mappings are given, use character names in all references.
# Instructions: {instructions}
# Arc text:
# {arc_text}
# """
#             world_resp = await chat_with_agent(
#                 session, world_agent_id, [{"role": "system", "content": world_prompt}]
#             )
#             world_info = world_resp.get("answer", "").strip()
#         arc_worlds.append(world_info)

        # --- Critic Notes (optional per arc, includes world info) ---
        critic_notes = ""
        if critic_agent_id:
            critic_prompt = f"""
You are a fantasy literary critic. Read this novelized arc and the world info.
Provide bullet-point feedback on story flow, character consistency, world accuracy, and narrative immersion.
Point out anything that contradicts the world, characters, or instructions. Suggest brief improvements if needed.
- Write your answer in the same language as the novelized arc below.
Novelized arc:
{novel_arc}
"""
            critic_resp = await chat_with_agent(
                session, critic_agent_id, [{"role": "system", "content": critic_prompt}]
            )
            critic_notes = critic_resp.get("answer", "").strip()
        arc_critic_notes.append(critic_notes)

    # ----- 3. Final Synthesis: Combine all arcs -----
    if progress_cb:
        progress_cb(len(arcs) + 1, len(arcs) + 2)

    arc_novels_joined = "\n\n".join(arc_novels)
    arc_critic_notes_joined = "\n\n".join(arc_critic_notes)

    final_writer_prompt = (
        f"""
You are a talented fantasy novelist. Combine and polish the following arcs into a single, seamless, concise fantasy novel chapter.
- Incorporate important world details where appropriate.
- Apply the critic's suggestions to improve narrative flow, character depth, and world consistency.
- Write your answer in the same language as the given arc novels below.
- You may invent brief dialogue lines or transitions if needed for story cohesion, as long as they do not contradict the story so far.
- The entire output must be **no more than 4000 words**.
- Eliminate repetition, awkward transitions, or extraneous detail.
- Make the final chapter emotionally engaging and easy to read.
- Format the output using valid HTML: wrap each paragraph in <p>. Use <h2>/<h3> for titles if relevant. Format dialogue as you would in a novel, with each line in its own <p> or <blockquote> if appropriate.
Novelized arcs:
{arc_novels_joined}

Critic notes for each arc:
{arc_critic_notes_joined}
"""
    )

    final_resp = await chat_with_agent(
        session, agent.id, [{"role": "system", "content": final_writer_prompt}]
    )
    draft = final_resp.get("answer", "").strip()

    if progress_cb:
        progress_cb(len(arcs) + 2, len(arcs) + 2)

    return draft