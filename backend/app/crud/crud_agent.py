import openai
from app.config import settings
from app.crud import crud_vectordb

openai.api_key = settings.openai_api_key


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
    resp = openai.ChatCompletion.create(model="gpt-3.5-turbo", messages=chat_messages)
    return resp["choices"][0]["message"]["content"]

