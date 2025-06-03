from typing import Optional, List
from sqlmodel import SQLModel, Field, Relationship

class ConceptCharacteristicLink(SQLModel, table=True):
    concept_id: int = Field(foreign_key="concept.id", primary_key=True)
    characteristic_id: int = Field(foreign_key="characteristic.id", primary_key=True)
    order: Optional[int] = None
    display_type: Optional[str] = None  # "title", "header", "body"

class Characteristic(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    gameworld_id: int = Field(foreign_key="gameworld.id")
    name: str
    type: str  # "string", "int", "page_ref", etc
    is_list: bool = Field(default=False)
    logo: Optional[str] = None
    ref_concept_id: Optional[int] = Field(default=None, foreign_key="concept.id")
    # -- Relationships
    concepts: List["Concept"] = Relationship(
        back_populates="characteristics", link_model=ConceptCharacteristicLink
    )
