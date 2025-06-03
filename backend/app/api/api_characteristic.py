from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List
from app.database import get_session
from app.models.model_user import User, UserRole
from app.models.model_characteristic import Characteristic, ConceptCharacteristicLink
from app.schemas.schema_characteristic import CharacteristicCreate, CharacteristicRead, CharacteristicUpdate
from app.crud.crud_characteristic import (
    create_characteristic, get_characteristics, get_characteristic,
    update_characteristic, delete_characteristic,
    add_concept_characteristic_link, remove_concept_characteristic_link, update_concept_characteristic_link_order, get_characteristics_for_concept, update_concept_characteristic_link
)
from app.dependencies import get_current_user, require_role
from sqlalchemy import select

CharacteristicRead.model_rebuild()

router = APIRouter(prefix="/characteristics", tags=["Characteristics"], dependencies=[Depends(get_current_user)])

# -- Characteristic CRUD

@router.post("/", response_model=CharacteristicRead)
async def create_characteristic_endpoint(
    char: CharacteristicCreate,
    user: User = Depends(require_role(UserRole.system_admin)),
    session: AsyncSession = Depends(get_session),
):
    char = Characteristic.model_validate(char)
    db_char = await create_characteristic(session, char)
    return db_char

@router.get("/", response_model=List[CharacteristicRead])
async def read_characteristics(
    gameworld_id: int,  # always required!
    session: AsyncSession = Depends(get_session),
):
    return await get_characteristics(session, gameworld_id)

@router.get("/{char_id}", response_model=CharacteristicRead)
async def read_characteristic(
    char_id: int,
    session: AsyncSession = Depends(get_session),
):
    db_char = await get_characteristic(session, char_id)
    if not db_char:
        raise HTTPException(status_code=404, detail="Characteristic not found")
    return db_char

@router.patch("/{char_id}", response_model=CharacteristicRead)
async def update_characteristic_endpoint(
    char_id: int,
    updates: CharacteristicUpdate,
    user: User = Depends(require_role(UserRole.system_admin)),
    session: AsyncSession = Depends(get_session),
):
    updated = await update_characteristic(session, char_id, updates.model_dump(exclude_unset=True))
    if not updated:
        raise HTTPException(status_code=404, detail="Characteristic not found")
    return updated

@router.delete("/{char_id}")
async def delete_characteristic_endpoint(
    char_id: int,
    user: User = Depends(require_role(UserRole.system_admin)),
    session: AsyncSession = Depends(get_session),
):
    success = await delete_characteristic(session, char_id)
    if not success:
        raise HTTPException(status_code=404, detail="Characteristic not found")
    return {"ok": True}

# -- ConceptCharacteristicLink management

@router.post("/link/")
async def add_link(
    concept_id: int,
    characteristic_id: int,
    order: int = None,
    display_type: str = None,
    user: User = Depends(require_role(UserRole.system_admin)),
    session: AsyncSession = Depends(get_session),
):
    link = await add_concept_characteristic_link(session, concept_id, characteristic_id, order, display_type)
    return {"ok": True, "link": {"concept_id": concept_id, "characteristic_id": characteristic_id, "order": order, "display_type": display_type}}

@router.patch("/link/")
async def update_link(
    concept_id: int,
    characteristic_id: int,
    order: int = None,
    display_type: str = None,
    user: User = Depends(require_role(UserRole.system_admin)),
    session: AsyncSession = Depends(get_session),
):
    link = await update_concept_characteristic_link(session, concept_id, characteristic_id, order, display_type)
    if not link:
        raise HTTPException(status_code=404, detail="Link not found")
    return {"ok": True}


@router.patch("/link/")
async def update_link_order(
    concept_id: int,
    characteristic_id: int,
    order: int,
    user: User = Depends(require_role(UserRole.system_admin)),
    session: AsyncSession = Depends(get_session),
):
    link = await update_concept_characteristic_link_order(session, concept_id, characteristic_id, order)
    if not link:
        raise HTTPException(status_code=404, detail="Link not found")
    return {"ok": True}

@router.delete("/link/")
async def remove_link(
    concept_id: int,
    characteristic_id: int,
    user: User = Depends(require_role(UserRole.system_admin)),
    session: AsyncSession = Depends(get_session),
):
    ok = await remove_concept_characteristic_link(session, concept_id, characteristic_id)
    if not ok:
        raise HTTPException(status_code=404, detail="Link not found")
    return {"ok": True}

# -- Get all characteristics for a concept (ordered)
@router.get("/concept/{concept_id}")
async def read_characteristics_for_concept(
    concept_id: int,
    session: AsyncSession = Depends(get_session),
):
    stmt = (
        select(ConceptCharacteristicLink, Characteristic)
        .join(Characteristic, ConceptCharacteristicLink.characteristic_id == Characteristic.id)
        .where(ConceptCharacteristicLink.concept_id == concept_id)
        .order_by(ConceptCharacteristicLink.order)
    )
    result = await session.execute(stmt)
    # Return both characteristic and link metadata (including display_type)
    return [
        {
            **row[1].dict(),
            "order": row[0].order,
            "display_type": row[0].display_type,
        }
        for row in result.all()
    ]
