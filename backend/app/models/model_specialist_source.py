from typing import Optional
from sqlmodel import SQLModel, Field
from datetime import datetime, timezone

class SpecialistSource(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    agent_id: int = Field(foreign_key="agent.id")
    type: str  # 'file' or 'link'
    path: Optional[str] = None
    url: Optional[str] = None
    added_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
