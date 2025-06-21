from typing import Optional
from sqlmodel import SQLModel, Field
from datetime import datetime, timezone

class Agent(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str
    logo: Optional[str] = None
    personality: Optional[str] = None
    task: Optional[str] = None
    world_id: int = Field(foreign_key="gameworld.id")
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    vector_db_update_date: Optional[datetime] = None
    specialist_update_date: Optional[datetime] = None

