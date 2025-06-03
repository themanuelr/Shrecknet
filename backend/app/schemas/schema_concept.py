from typing import List, Optional, TYPE_CHECKING
from sqlmodel import SQLModel
from pydantic import BaseModel

if TYPE_CHECKING:
    from app.schemas.schema_characteristic import CharacteristicRead



class CharacteristicLinkCreate(BaseModel):
    characteristic_id: int
    order: int
    display_type: str

class ConceptBase(SQLModel):
    gameworld_id: int
    name: str
    description: Optional[str] = None
    logo: Optional[str] = None
    auto_generated: Optional[bool] = None
    auto_generated_prompt : Optional[str] = None
    group: Optional[str] = None
    display_on_world: bool = False

class ConceptCreate(ConceptBase):    
    characteristic_links: list[CharacteristicLinkCreate] = []

class ConceptUpdate(SQLModel):    
    name: Optional[str] = None
    description: Optional[str] = None
    characteristic_links: Optional[list[CharacteristicLinkCreate]] = None
    group: Optional[str] = None
    auto_generated_prompt : Optional[str] = None
    auto_generated: Optional[bool] = None
    display_on_world: Optional[bool] = None
    logo: Optional[str] = None

class ConceptRead(ConceptBase):
    id: int
    pages_count: Optional[int] = 0    
    characteristics: List["CharacteristicRead"] = []