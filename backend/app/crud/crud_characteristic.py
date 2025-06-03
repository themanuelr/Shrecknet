from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload
from sqlalchemy import and_
from app.models.model_characteristic import Characteristic, ConceptCharacteristicLink

async def create_characteristic(session: AsyncSession, characteristic: Characteristic) -> Characteristic:
    session.add(characteristic)
    await session.commit()
    await session.refresh(characteristic)
    return characteristic

async def get_characteristics(session: AsyncSession, gameworld_id: int = None):
    stmt = select(Characteristic)
    if gameworld_id:
        stmt = stmt.where(Characteristic.gameworld_id == gameworld_id)
    result = await session.execute(stmt)
    return result.scalars().all()

async def get_characteristic(session: AsyncSession, characteristic_id: int):
    return await session.get(Characteristic, characteristic_id)

async def update_characteristic(session: AsyncSession, characteristic_id: int, updates: dict):
    characteristic = await get_characteristic(session, characteristic_id)
    if not characteristic:
        return None
    for key, value in updates.items():
        setattr(characteristic, key, value)
    await session.commit()
    await session.refresh(characteristic)
    return characteristic

async def delete_characteristic(session: AsyncSession, characteristic_id: int):
    characteristic = await get_characteristic(session, characteristic_id)
    if not characteristic:
        return False
    await session.delete(characteristic)
    await session.commit()
    return True

# --- Link management ---

async def add_concept_characteristic_link(session: AsyncSession, concept_id: int, characteristic_id: int, order: int = None, display_type: str = None):
    link = ConceptCharacteristicLink(concept_id=concept_id, characteristic_id=characteristic_id, order=order, display_type=display_type)
    session.add(link)
    await session.commit()
    return link

async def remove_concept_characteristic_link(session: AsyncSession, concept_id: int, characteristic_id: int):
    link = await session.get(ConceptCharacteristicLink, (concept_id, characteristic_id))
    if not link:
        return False
    await session.delete(link)
    await session.commit()
    return True

async def update_concept_characteristic_link(
    session: AsyncSession, concept_id: int, characteristic_id: int,
    order: Optional[int] = None, display_type: Optional[str] = None
):
    link = await session.get(ConceptCharacteristicLink, (concept_id, characteristic_id))
    if not link:
        return False
    if order is not None:
        link.order = order
    if display_type is not None:
        link.display_type = display_type
    await session.commit()
    return link

async def get_characteristics_for_concept(session: AsyncSession, concept_id: int):
    # Return all characteristics for a concept, ordered by link.order
    stmt = (
        select(ConceptCharacteristicLink, Characteristic)
        .join(Characteristic, ConceptCharacteristicLink.characteristic_id == Characteristic.id)
        .where(ConceptCharacteristicLink.concept_id == concept_id)
        .order_by(ConceptCharacteristicLink.order)
    )
    result = await session.execute(stmt)
    return [row[1] for row in result.all()]


async def update_concept_characteristic_link(
    session,
    concept_id: int,
    characteristic_id: int,
    order: int = None,
    display_type: str = None
):
    link = await session.get(ConceptCharacteristicLink, (concept_id, characteristic_id))
    if not link:
        return None
    if order is not None:
        link.order = order
    if display_type is not None:
        link.display_type = display_type
    await session.commit()
    await session.refresh(link)
    return link


async def update_concept_characteristic_link_order(
    session,
    concept_id: int,
    characteristic_id: int,
    order: int
):
    link = await session.get(ConceptCharacteristicLink, (concept_id, characteristic_id))
    if not link:
        return None
    link.order = order
    await session.commit()
    await session.refresh(link)
    return link