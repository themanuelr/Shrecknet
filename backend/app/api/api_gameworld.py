from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List
from datetime import datetime, timezone
# from app.auth import fastapi_users

from app.database import get_session
from app.models.model_gameworld import GameWorld
from app.models.model_user import User, UserRole
from app.schemas.schema_gameworld import GameWorldCreate, GameWorldRead, GameWorldUpdate
from app.crud.crud_gameworld import (
    create_gameworld, get_gameworlds, get_gameworld, 
    update_gameworld, delete_gameworld
)

from app.dependencies import get_current_user, require_role


router = APIRouter(prefix="/gameworlds", tags=["GameWorlds"],  dependencies=[Depends(get_current_user)])

@router.post("/", response_model=GameWorldRead)
async def create_gameworld_endpoint(    
    gameworld: GameWorldCreate,
    user: User = Depends(require_role(UserRole.world_builder)),     
    session: AsyncSession = Depends(get_session),    
):
    
    db_gameworld = GameWorld(
        **gameworld.model_dump(),
        created_by=user.id,
        created_at=datetime.now(timezone.utc),
        edited_by=user.id,
        edited_at=datetime.now(timezone.utc)
    )

    # Set audit fields
    # db_gameworld = GameWorld.model_validate(gameworld)
    # db_gameworld.created_by = user.id 
    # db_gameworld.created_at = datetime.now(timezone.utc)
    # db_gameworld.edited_by = user.id
    # db_gameworld.edited_at =datetime.now(timezone.utc)
    return await create_gameworld(session, db_gameworld)

@router.get("/", response_model=List[GameWorldRead])
async def read_gameworlds(
    session: AsyncSession = Depends(get_session),
):
    """Get all game worlds."""
    return await get_gameworlds(session)

@router.get("/{gameworld_id}", response_model=GameWorldRead)
async def read_gameworld(
    gameworld_id: int,
    session: AsyncSession = Depends(get_session),
):
    """Get a specific game world by its ID."""
    db_gameworld = await get_gameworld(session, gameworld_id)
    if not db_gameworld:
        raise HTTPException(status_code=404, detail="Game world not found")
    return db_gameworld

@router.patch("/{gameworld_id}", response_model=GameWorldRead)
async def update_gameworld_endpoint(
    gameworld_id: int,
    updates: GameWorldUpdate,
    session: AsyncSession = Depends(get_session),
    user: User = Depends(require_role(UserRole.world_builder)),  
):
    # updated = await update_gameworld(session, gameworld_id, updates.model_dump(exclude_unset=True))

    updated = await update_gameworld(
        session,
        gameworld_id,
        updates.model_dump(exclude_unset=True),
        edited_by=user.id  # pass user id to the CRUD
    )

    if not updated:
        raise HTTPException(status_code=404, detail="Game world not found")
    return updated

@router.delete("/{gameworld_id}")
async def delete_gameworld_endpoint(
    gameworld_id: int,
    session: AsyncSession = Depends(get_session),
    user: User = Depends(require_role(UserRole.world_builder)),  
):
    """Delete a game world."""
    success = await delete_gameworld(session, gameworld_id)
    if not success:
        raise HTTPException(status_code=404, detail="Game world not found")
    return {"ok": True}