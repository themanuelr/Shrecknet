from typing import List, Optional, Dict
from datetime import datetime, timezone

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import delete

from app.models.model_page import Page, PageCharacteristicValue
from app.schemas.schema_page import PageCreate, PageUpdate
from app.schemas.schema_page_characteristic_value import PageCharacteristicValueCreate

# --- PAGE CRUD ---

async def create_page(session: AsyncSession, page: Page) -> Page:
    session.add(page)
    await session.commit()
    await session.flush()
    return page

async def get_page(session: AsyncSession, page_id: int) -> Optional[Page]:
    result = await session.execute(
        select(Page).where(Page.id == page_id)
    )
    return result.scalar_one_or_none()

async def get_pages(session: AsyncSession, *, gameworld_id: Optional[int] = None, concept_id: Optional[int] = None) -> List[Page]:
    query = select(Page)
    if gameworld_id:
        query = query.where(Page.gameworld_id == gameworld_id)
    if concept_id:
        query = query.where(Page.concept_id == concept_id)
    result = await session.execute(query)
    return result.scalars().all()

async def update_page(session: AsyncSession, page_id: int, updates: dict) -> Optional[Page]:
    db_page = await get_page(session, page_id)
    if not db_page:
        return None
    for k, v in updates.items():
        setattr(db_page, k, v)
    db_page.updated_at = datetime.now(timezone.utc)
    await session.commit()
    await session.flush()
    return db_page

async def delete_page(session: AsyncSession, page_id: int) -> bool:
    page = await get_page(session, page_id)
    if page:
        await session.delete(page)
        await session.commit()        
        await session.flush()
        return True
    else:
        return False

# --- PAGE CHARACTERISTIC VALUE CRUD ---

async def create_page_characteristic_value(session: AsyncSession, value_obj: PageCharacteristicValue) -> PageCharacteristicValue:
    session.add(value_obj)
    await session.commit()
    await session.flush()
    return value_obj

async def get_page_characteristic_values(session: AsyncSession, page_id: int) -> List[PageCharacteristicValue]:
    result = await session.execute(
        select(PageCharacteristicValue).where(PageCharacteristicValue.page_id == page_id)
    )
    return result.scalars().all()

async def get_pages_characteristic_values(
    session: AsyncSession, page_ids: List[int]
) -> Dict[int, List[PageCharacteristicValue]]:
    if not page_ids:
        return {}
    result = await session.execute(
        select(PageCharacteristicValue).where(PageCharacteristicValue.page_id.in_(page_ids))
    )
    all_values = result.scalars().all()
    values_by_page: Dict[int, List[PageCharacteristicValue]] = {}
    for val in all_values:
        values_by_page.setdefault(val.page_id, []).append(val)
    return values_by_page

async def delete_page_characteristic_values(session: AsyncSession, page_id: int) -> None:
    await session.execute(
        delete(PageCharacteristicValue).where(PageCharacteristicValue.page_id == page_id)
    )
    await session.commit()
    await session.flush()

# --- Optional: update individual value (not used in atomic pattern) ---

async def update_page_characteristic_value(session: AsyncSession, page_id: int, characteristic_id: int, value: List[str]):
    result = await session.execute(
        select(PageCharacteristicValue).where(
            PageCharacteristicValue.page_id == page_id,
            PageCharacteristicValue.characteristic_id == characteristic_id
        )
    )
    val = result.scalar_one_or_none()
    if val:
        val.value = value
        await session.commit()
        await session.flush()
    return val

async def delete_page_characteristic_value(session: AsyncSession, page_id: int, characteristic_id: int) -> None:
    await session.execute(
        delete(PageCharacteristicValue).where(
            PageCharacteristicValue.page_id == page_id,
            PageCharacteristicValue.characteristic_id == characteristic_id
        )
    )
    await session.commit()
    await session.flush()


async def delete_page_characteristic_values(session: AsyncSession, page_id: int) -> None:
    await session.execute(
        delete(PageCharacteristicValue).where(PageCharacteristicValue.page_id == page_id)
    )
    await session.commit()
    await session.flush()