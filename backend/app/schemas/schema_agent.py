from pydantic import BaseModel
from datetime import datetime
from typing import Optional

class AgentCreate(BaseModel):
    name: str
    logo: Optional[str] = None
    personality: Optional[str] = None
    task: Optional[str] = None
    world_id: int

class AgentRead(AgentCreate):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        orm_mode = True

class AgentUpdate(BaseModel):
    name: Optional[str] = None
    logo: Optional[str] = None
    personality: Optional[str] = None
    task: Optional[str] = None
    world_id: Optional[int] = None

