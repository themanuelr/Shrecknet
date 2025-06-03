from typing import Optional
from sqlmodel import Field, SQLModel
from datetime import datetime, timezone

class GameWorld(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str
    system: str
    description: str
    logo: Optional[str] = None        
    content: Optional[str] = None

    created_by: int = Field(foreign_key="user.id")
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    edited_by: Optional[int] = Field(default=None, foreign_key="user.id")
    edited_at: Optional[datetime] = Field(default=None)