from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select
from app.models.model_gameworld import GameWorld
from datetime import datetime, timezone

async def create_gameworld(session: AsyncSession, gameworld: GameWorld) -> GameWorld:
    session.add(gameworld)
    await session.commit()
    await session.refresh(gameworld)
    return gameworld

async def get_gameworlds(session: AsyncSession):
    result = await session.execute(select(GameWorld))
    return result.scalars().all()

async def get_gameworld(session: AsyncSession, gameworld_id: int):
    return await session.get(GameWorld, gameworld_id)

async def update_gameworld(session: AsyncSession, gameworld_id: int, updates: dict, edited_by:int ):
    gameworld = await session.get(GameWorld, gameworld_id)    
    if not gameworld:
        return None

    gameworld.edited_by = edited_by
    gameworld.edited_at = datetime.now(timezone.utc) 

    for key, value in updates.items():
        setattr(gameworld, key, value)    
           

    await session.commit()
    await session.refresh(gameworld)
    return gameworld

async def delete_gameworld(session: AsyncSession, gameworld_id: int):
    gameworld = await session.get(GameWorld, gameworld_id)
    if not gameworld:
        return False
    await session.delete(gameworld)
    await session.commit()
    return True