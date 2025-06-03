from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List, Optional

from app.database import get_session
from app.models.model_user import User, UserRole
from app.models.model_concept import Concept
from app.schemas.schema_concept import ConceptCreate, ConceptRead, ConceptUpdate
from app.schemas.schema_page import PageRead
from app.schemas.schema_characteristic import CharacteristicRead
from app.crud.crud_concept import (
    create_concept, get_concepts, get_concept, update_concept, delete_concept, list_unique_concept_groups
)
from app.crud.crud_characteristic import (
    add_concept_characteristic_link, remove_concept_characteristic_link
)
from app.dependencies import get_current_user, require_role

CharacteristicRead.model_rebuild()
ConceptRead.model_rebuild()


router = APIRouter(prefix="/concepts", tags=["Concepts"], dependencies=[Depends(get_current_user)])

@router.post("/", response_model=ConceptRead)
async def create_concept_endpoint(
    data: ConceptCreate,
    user: User = Depends(require_role(UserRole.world_builder)),
    session: AsyncSession = Depends(get_session),
):
    
    concept_dict = data.model_dump(exclude={"characteristic_links"})
    concept = Concept(**concept_dict, created_by_user_id=user.id)
    db_concept = await create_concept(session, concept)

    for link in data.characteristic_links:
        await add_concept_characteristic_link(
            session,
            db_concept.id,
            link.characteristic_id,
            order=link.order,
            display_type=link.display_type,
        )
    await session.commit()

    db_concept = await get_concept(session, db_concept.id)
    return db_concept

@router.get("/", response_model=List[ConceptRead])
async def read_concepts(
    gameworld_id: Optional[int] = None,
    name: Optional[str] = None,
    auto_generated: Optional[bool] = None,
    group: Optional[str] = None,
    display_on_world: Optional[bool] = None,
    session: AsyncSession = Depends(get_session),
):
    return await get_concepts(session, gameworld_id, name, auto_generated, group, display_on_world)

@router.get("/{concept_id}", response_model=ConceptRead)
async def read_concept(
    concept_id: int,
    session: AsyncSession = Depends(get_session),
):
    db_concept = await get_concept(session, concept_id)
    if not db_concept:
        raise HTTPException(status_code=404, detail="Concept not found")
    return db_concept

# @router.patch("/{concept_id}", response_model=ConceptRead)
# async def update_concept_endpoint(
#     concept_id: int,
#     updates: ConceptUpdate,
#     user: User = Depends(require_role(UserRole.system_admin)),
#     session: AsyncSession = Depends(get_session),
# ):
#     updates = updates.model_dump(exclude_unset=True)
#     char_ids = None
    
#     if  "characteristic_ids" in updates.keys():        
#         char_ids = updates["characteristic_ids"]        
#         del updates['characteristic_ids']
                
#         # updates_without_char = updates.remove
    
#     # 1. Update the concept fields
#     db_concept = await update_concept(session, concept_id, updates)
#     if not db_concept:
#         raise HTTPException(status_code=404, detail="Concept not found")
#     # 2. Update characteristics if provided
    
#     if char_ids is not None:
#         # Remove all links for this concept
#         for char in db_concept.characteristics[:]:
#             await remove_concept_characteristic_link(session, concept_id, char.id)
#             session.flush()                      
        
#         db_concept = await get_concept(session, concept_id)
        
#         # Add new links
#         for idx, char_id in enumerate(char_ids):
#             await add_concept_characteristic_link(session, concept_id, char_id, order=idx)        
#         # Now reload concept with relationships eager-loaded
#         session.flush()
        
#         session.expire(db_concept, ["characteristics"])
#         db_concept = await get_concept(session, concept_id)

#         # db_concept = await get_concept(session, concept_id)  # Must use selectinload
#         print("AFTER DELETE, characteristics:", db_concept.characteristics) 
                    
#     return db_concept


@router.patch("/{concept_id}", response_model=ConceptRead)
async def update_concept_endpoint(
    concept_id: int,
    updates: ConceptUpdate,
    user: User = Depends(require_role(UserRole.world_builder)),
    session: AsyncSession = Depends(get_session),
):
    

    update_dict = updates.model_dump(exclude_unset=True, exclude={"characteristic_links"})
    db_concept = await update_concept(session, concept_id, update_dict)
    if not db_concept:
        raise HTTPException(status_code=404, detail="Concept not found")

    # Remove and re-add links if provided
    if updates.characteristic_links is not None:
        # Remove all old links
        for char in db_concept.characteristics[:]:
            await remove_concept_characteristic_link(session, concept_id, char.id)
            await session.flush()
        # Add new links
        for link in updates.characteristic_links:
            await add_concept_characteristic_link(
                session,
                concept_id,
                link.characteristic_id,
                order=link.order,
                display_type=link.display_type,
            )
        await session.commit()
        session.expire(db_concept, ["characteristics"])
        db_concept = await get_concept(session, concept_id)

    return db_concept


    # updates = updates.model_dump(exclude_unset=True)
    # char_ids = None

    # if "characteristic_ids" in updates.keys():
    #     char_ids = updates["characteristic_ids"]
    #     del updates["characteristic_ids"]

    # # 1. Update the concept fields (including group/display_on_world)
    # db_concept = await update_concept(session, concept_id, updates)
    # if not db_concept:
    #     raise HTTPException(status_code=404, detail="Concept not found")

    # # 2. Update characteristics if provided
    # if char_ids is not None:
    #     # Remove all existing links for this concept
    #     for char in db_concept.characteristics[:]:
    #         await remove_concept_characteristic_link(session, concept_id, char.id)
    #         await session.flush()  # Ensure DB flush after delete

    #     # Add new links in given order
    #     for idx, char_id in enumerate(char_ids):
    #         await add_concept_characteristic_link(session, concept_id, char_id, order=idx)
    #     await session.flush()

    #     # Expire and reload to ensure latest relationship data
    #     session.expire(db_concept, ["characteristics"])
    #     db_concept = await get_concept(session, concept_id)

    # return db_concept


@router.delete("/{concept_id}")
async def delete_concept_endpoint(
    concept_id: int,
    user: User = Depends(require_role(UserRole.system_admin)),
    session: AsyncSession = Depends(get_session),
):
    success = await delete_concept(session, concept_id)
    if not success:
        raise HTTPException(status_code=404, detail="Concept not found")
    return {"ok": True}

@router.get("/groups/", response_model=List[str])
async def read_concept_groups(
    gameworld_id: Optional[int] = None,
    session: AsyncSession = Depends(get_session),
):
    return await list_unique_concept_groups(session, gameworld_id)    