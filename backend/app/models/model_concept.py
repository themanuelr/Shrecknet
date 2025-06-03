# model_concept.py
from typing import Optional, List
from sqlmodel import SQLModel, Field, Relationship, JSON
from sqlalchemy import Column
from app.models.model_characteristic import ConceptCharacteristicLink

class Concept(SQLModel, table=True):
    
    id: Optional[int] = Field(default=None, primary_key=True)
    gameworld_id: int = Field(foreign_key="gameworld.id")
    name: str
    group: Optional[str] = None
    display_on_world: bool = False
    logo: Optional[str] = None
    auto_generated: Optional[bool] = None
    description: Optional[str] = None
    auto_generated_prompt : Optional[str] = None

    
    characteristics: List["Characteristic"] = Relationship(
        back_populates="concepts", link_model=ConceptCharacteristicLink
    )
        
    allowed_roles: List[str] = Field(default_factory=lambda: ["system admin"], sa_column=Column(JSON))
    created_by_user_id: Optional[int] = Field(foreign_key="user.id")