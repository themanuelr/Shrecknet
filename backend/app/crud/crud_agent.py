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
    resp = client.chat.completions.create(model=openai_model, messages=chat_messages)
    return resp.choices[0].message.content

