from typing import Optional
from sqlmodel import SQLModel



class CharacteristicBase(SQLModel):
    gameworld_id: int
    name: str
    type: str
    is_list: bool = False
    logo: Optional[str] = None
    ref_concept_id: Optional[int] = None
    display_type: Optional[str] = None  # "title", "header", "body"    



class CharacteristicCreate(CharacteristicBase):
    pass

class CharacteristicUpdate(SQLModel):
    name: Optional[str] = None
    type: Optional[str] = None
    is_list: Optional[bool] = None
    logo: Optional[str] = None
    ref_concept_id: Optional[int] = None

class CharacteristicRead(CharacteristicBase):
    id: int

class ConceptCharacteristicLinkUpdate(SQLModel):
    order: Optional[int] = None
    display_type: Optional[str] = None    
