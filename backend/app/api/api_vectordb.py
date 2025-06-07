from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_session
from app.crud import crud_vectordb

router = APIRouter(prefix="/vectordb", tags=["VectorDB"])


@router.post("/{world_id}/rebuild")
async def rebuild_world_vector(world_id: int, session: AsyncSession = Depends(get_session)):
    count = await crud_vectordb.rebuild_world(session, world_id)
    return {"pages_indexed": count}


@router.post("/{world_id}/add_page/{page_id}")
async def add_page(world_id: int, page_id: int, session: AsyncSession = Depends(get_session)):
    ok = await crud_vectordb.add_page(session, page_id)
    if not ok:
        raise HTTPException(status_code=404, detail="Page not found")
    return {"indexed": True}


@router.get("/{world_id}/search")
async def search_world(world_id: int, q: str = Query(..., alias="query"), n: int = 5):
    results = crud_vectordb.query_world(world_id, q, n_results=n)
    return results
