from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from typing import List, Optional
from datetime import datetime, timezone

import os
from app.models.model_specialist_source import SpecialistSource
from app.models.model_agent import Agent

async def add_source(session: AsyncSession, source: SpecialistSource) -> SpecialistSource:

    print (f"SOURCE: {source.path}")
    # if source.type == "file" and source.path and not os.path.isabs(source.path):
    #     source.path = os.path.join("/app/uploads", source.path.lstrip("/"))
    session.add(source)
    await session.commit()
    await session.refresh(source)
    return source

async def get_sources(session: AsyncSession, agent_id: int) -> List[SpecialistSource]:
    result = await session.execute(select(SpecialistSource).where(SpecialistSource.agent_id == agent_id))
    return result.scalars().all()

async def get_source(session: AsyncSession, source_id: int) -> Optional[SpecialistSource]:
    return await session.get(SpecialistSource, source_id)

async def delete_source(session: AsyncSession, source_id: int) -> bool:
    obj = await session.get(SpecialistSource, source_id)
    if not obj:
        return False
    await session.delete(obj)
    await session.commit()
    return True
