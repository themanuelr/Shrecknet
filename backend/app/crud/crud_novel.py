from sqlalchemy.ext.asyncio import AsyncSession
from app.models.model_agent import Agent
from app.crud.crud_agent import ensure_personality_prompts
from app.api.api_agent import chat_with_agent  # For RAG context fetching!
from app.config import settings

from langchain_openai import ChatOpenAI
from langchain_core.prompts import ChatPromptTemplate
from langgraph.graph import Graph


def split_into_arcs(text, min_words_per_arc=1000, max_arcs=5):
    words = text.split()
    n_words = len(words)
    if n_words <= min_words_per_arc:
        return [" ".join(words)]
    n_arcs = min((n_words + min_words_per_arc - 1) // min_words_per_arc, max_arcs)
    arc_sizes = [n_words // n_arcs + (1 if i < n_words % n_arcs else 0) for i in range(n_arcs)]
    arcs = []
    start = 0
    for size in arc_sizes:
        arcs.append(" ".join(words[start:start+size]))
        start += size
    return arcs

async def langchain_chat_completion(
    system_prompt: str,
    user_prompt: str,
    temperature: float = 0.7,
    max_tokens: int = 2048,
    
):
    llm = ChatOpenAI(
        api_key=settings.openai_api_key,
        model=settings.open_ai_model,
        temperature=temperature,
        max_tokens=max_tokens,
    )

    prompt = ChatPromptTemplate.from_messages([
        ("system", system_prompt),
        ("user", user_prompt),
    ])

    chain = prompt | llm

    builder = Graph()
    builder.add_node("chat", chain)
    builder.set_entry_point("chat")
    builder.set_finish_point("chat")
    graph = builder.compile()

    response = await graph.ainvoke({"input": ""})
    answer = getattr(response, "content", str(response))
    return answer.strip()

async def create_novel(
    session: AsyncSession,
    agent: Agent,         # The main writer (personality, name, etc.)
    text: str,
    instructions: str,
    example: str | None = None,     # unused
    helper_agent_ids: list[int] | None = None,  # For RAG
    progress_cb=None,    
) -> str:
    """
    Generate a novelized summary from transcript using LangChain LLM graph for all LLM calls,
    the in-db agent personality, and world context per arc.
    """
    helper_agent_ids = helper_agent_ids or []
    rag_agent_id = helper_agent_ids[0] if helper_agent_ids else None

    # 1. Prepare main agent personality/tone
    personalities = [p.strip() for p in (agent.personality or "helpful NPC").split(",") if p.strip()]
    all_tones = await ensure_personality_prompts(personalities)
    tone = "\n".join(all_tones.get(p, "") for p in personalities if all_tones.get(p))
    tone = tone or "You are a creative, helpful fantasy novelist."

    # 2. Chunk transcript
    arcs = split_into_arcs(text, min_words_per_arc=1000, max_arcs=5)
    arc_novels = []
    arc_critic_notes = []

    # 3. Process each arc
    for idx, arc_text in enumerate(arcs):
        if progress_cb:
            progress_cb(idx, len(arcs) + 2)

        # 3a. Fetch world context (RAG) using chat_with_agent and the RAG agent id
        arc_context = ""
        if rag_agent_id:
            context_prompt = f"""Given this RPG transcript fragment, extract and return a brief world/setting summary for each of the character names/roles, places, organizations or any important information you find on the context, and relevant background from your knowledge.
Be brief, do not repeat the transcript.
Instructions:
{instructions}
Transcript:
{arc_text}
"""
            rag_resp = await chat_with_agent(
                session, rag_agent_id, [{"role": "user", "content": context_prompt}]
            )
            arc_context = rag_resp.get("answer", "").strip()
        else:
            arc_context = ""

        # 3b. Writer agent: novelize this arc (LangChain LLM)
        novel_prompt = f"""
You are a talented fantasy novelist. Rewrite the following RPG transcript arc as a **brief, engaging, and flowing novel segment** (max 1000 words).
Use the context below to make the story immersive and accurate.

Context:
{arc_context if arc_context else '[No context provided]'}

Instructions:
{instructions}

- Write your answer in the same language as the transcript below.
- Format dialogue as in a novel (for example: — Gryx: What's happening here?).
- Keep it concise, focus on main events, character emotions, and dramatic transitions.
- You may add brief invented narration, dialogue, or transitions for flow, as long as they fit the characters and events.
- Do NOT repeat or invent entire scenes; only fill gaps for readability.
- Give the segment a clear beginning, middle, and end.

Transcript:
{arc_text}
"""
        novel_arc = await langchain_chat_completion(
            system_prompt=tone,
            user_prompt=novel_prompt,            
        )
        arc_novels.append(novel_arc)

        # 3c. Critic: feedback per arc (LangChain LLM)
        critic_system_prompt = "You are an experienced, constructive but critical fantasy literature reviewer."
        critic_prompt = f"""
You are a fantasy literary critic. Read this novelized arc and the context. Give bullet-point feedback on:
- story flow,
- character consistency,
- world accuracy,
- narrative immersion.
Point out anything that contradicts the world, characters, or instructions. Suggest brief improvements if needed.

Novelized arc:
{novel_arc}

Context:
{arc_context if arc_context else '[No context provided]'}
"""
        critic_notes = await langchain_chat_completion(
            system_prompt=critic_system_prompt,
            user_prompt=critic_prompt,            
            temperature=0.2,
            max_tokens=512,            
        )
        arc_critic_notes.append(critic_notes)

    # 4. Synthesize all arcs (main agent)
    if progress_cb:
        progress_cb(len(arcs) + 1, len(arcs) + 2)

    arc_novels_joined = "\n\n".join(arc_novels)
    arc_critic_notes_joined = "\n\n".join(arc_critic_notes)

    # Fetch world context for the whole thing
    full_context = ""
    if rag_agent_id:
        context_prompt = f"""Given the following transcript, return a brief world summary, main characters, and setting.
Transcript:
{text}
"""
        rag_resp = await chat_with_agent(
            session, rag_agent_id, [{"role": "user", "content": context_prompt}]
        )
        full_context = rag_resp.get("answer", "").strip()
    else:
        full_context = ""

    final_writer_prompt = f"""
You are a talented fantasy novelist. Combine and polish the following arcs into a single, seamless, concise fantasy novel chapter.

Context:
{full_context if full_context else '[No context provided]'}

Critic notes for each arc:
{arc_critic_notes_joined}

Novelized arcs:
{arc_novels_joined}

Instructions:
- Incorporate important world details where appropriate.
- Apply the critic's suggestions to improve narrative flow, character depth, and world consistency.
- You may invent brief dialogue lines or transitions if needed for story cohesion, as long as they do not contradict the story so far.
- The entire output must be **no more than 4000 words**.
- Eliminate repetition, awkward transitions, or extraneous detail.
- Make the final chapter emotionally engaging and easy to read.
- Format the output using valid HTML: wrap each paragraph in <p>. Use <h2>/<h3> for titles if relevant. Format dialogue as you would in a novel, with each line in its own <p> or <blockquote> if appropriate.
"""

    draft = await langchain_chat_completion(
        system_prompt=tone,
        user_prompt=final_writer_prompt,        
        max_tokens=4000,        
    )
    draft = draft.strip()

    if progress_cb:
        progress_cb(len(arcs) + 2, len(arcs) + 2)

    return draft
