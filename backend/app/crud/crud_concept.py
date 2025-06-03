from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload
from app.models.model_concept import Concept, ConceptCharacteristicLink
from sqlalchemy import func
from app.models.model_page import Page
from app.schemas.schema_concept import ConceptRead  # Import your schema

async def create_concept(session: AsyncSession, concept: Concept) -> Concept:
    session.add(concept)
    await session.commit()
    await session.refresh(concept)
    return concept

async def get_concepts(session: AsyncSession, gameworld_id: int = None, name: str = None, auto_generated: bool = None, group: str = None, display_on_world: bool = None):
    stmt = select(Concept).options(selectinload(Concept.characteristics))
    if gameworld_id:
        stmt = stmt.where(Concept.gameworld_id == gameworld_id)
    if name:
        stmt = stmt.where(Concept.name.ilike(f"%{name}%"))
    if auto_generated is not None:
        stmt = stmt.where(Concept.auto_generated == auto_generated)
    if group is not None:
        stmt = stmt.where(Concept.group == group)
    if display_on_world is not None:
        stmt = stmt.where(Concept.display_on_world == display_on_world)

    result = await session.execute(stmt)
    concepts = result.scalars().all()
    response = []
    for concept in concepts:
        page_count = await session.execute(
            select(func.count()).select_from(Page).where(Page.concept_id == concept.id)
        )
        response.append(
            ConceptRead.model_validate({
                **concept.__dict__,
                "id": concept.id,
                "gameworld_id": concept.gameworld_id,
                "name": concept.name,
                "description": concept.description,
                "logo": concept.logo,
                "auto_generated": concept.auto_generated,
                "characteristics": concept.characteristics,
                "pages_count": page_count.scalar(),
                "group": concept.group,
                "display_on_world": concept.display_on_world,   
                "auto_generated_prompt":concept.auto_generated_prompt

            })
        )
    return response


    # return result.scalars().all()

async def get_concept(session: AsyncSession, concept_id: int):
    result = await session.execute(
        select(Concept)
        .options(selectinload(Concept.characteristics))
        .where(Concept.id == concept_id)
    )
    return result.scalar_one_or_none()

async def update_concept(session: AsyncSession, concept_id: int, updates: dict):
    concept = await get_concept(session, concept_id)
    if not concept:
        return None
    for key, value in updates.items():
        setattr(concept, key, value)
    await session.commit()
    await session.refresh(concept)
    return concept

async def delete_concept(session: AsyncSession, concept_id: int):
    concept = await get_concept(session, concept_id)
    if not concept:
        return False
    await session.delete(concept)
    await session.commit()
    return True


async def list_unique_concept_groups(session: AsyncSession, gameworld_id: int = None):
    stmt = select(Concept.group).distinct().where(Concept.group.isnot(None))
    if gameworld_id:
        stmt = stmt.where(Concept.gameworld_id == gameworld_id)
    result = await session.execute(stmt)
    groups = [row[0] for row in result.fetchall() if row[0] is not None]
    return groups