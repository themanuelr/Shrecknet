from fastapi import APIRouter, Depends
from app.dependencies import get_current_user
from app.models.model_user import User
from app.crud.crud_agent import chat_with_agent
from pydantic import BaseModel
from typing import List, Literal

class ChatMessage(BaseModel):
    role: Literal["system", "user", "assistant"]
    content: str

class ChatRequest(BaseModel):
    messages: List[ChatMessage]

router = APIRouter(prefix="/agents", tags=["Agents"], dependencies=[Depends(get_current_user)])

@router.post("/{world_id}/chat")
async def chat(world_id: int, payload: ChatRequest, user: User = Depends(get_current_user)):
    msgs = [m.model_dump() for m in payload.messages]
    response = chat_with_agent(world_id, msgs)
    return {"response": response}

