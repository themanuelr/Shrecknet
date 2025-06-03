from typing import Optional
from pydantic import BaseModel
from datetime import datetime

class GameWorldCreate(BaseModel):
    name: str
    system: str
    description: str
    logo: Optional[str] = None
    content: Optional[str] = None

    # created_by: int
    # created_at: datetime
    # edited_by: Optional[int]
    # edited_at: Optional[datetime]      

class GameWorldRead(GameWorldCreate):
    id: int
    
    content: Optional[str]
    created_by: int
    created_at: datetime
    edited_by: Optional[int]
    edited_at: Optional[datetime]    

class GameWorldUpdate(BaseModel):
    name: Optional[str] = None
    system: Optional[str] = None
    description: Optional[str] = None
    logo: Optional[str] = None
    content: Optional[str] = None

    # created_by: int
    # created_at: datetime
    edited_by: Optional[int] = None
    edited_at: Optional[datetime] = None
    