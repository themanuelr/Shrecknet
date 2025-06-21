from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class SpecialistSourceCreate(BaseModel):
    name: Optional[str] = None
    type: str
    path: Optional[str] = None
    url: Optional[str] = None

class SpecialistSourceRead(SpecialistSourceCreate):
    id: int
    agent_id: int
    added_at: datetime

    class Config:
        orm_mode = True
