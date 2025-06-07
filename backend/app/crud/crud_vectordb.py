import os
from typing import List, Dict

import chromadb
try:
    from chromadb.utils.embedding_functions import SentenceTransformerEmbeddingFunction
    _embedding_fn = SentenceTransformerEmbeddingFunction()
except Exception:
    _embedding_fn = None

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.models.model_page import Page, PageCharacteristicValue
from app.models.model_concept import Concept
from app.models.model_characteristic import Characteristic


# Persistent client storing collections under ./vector_db
_client = chromadb.PersistentClient(path=os.getenv("VECTOR_DB_PATH", "./vector_db"))


def _get_collection(world_id: int):
    name = f"world_{world_id}"
    kwargs = {"embedding_function": _embedding_fn} if _embedding_fn else {}
    return _client.get_or_create_collection(name, **kwargs)


async def add_page(session: AsyncSession, page_id: int):
    result = await session.execute(
        select(Page).where(Page.id == page_id)
    )
    page = result.scalar_one_or_none()
    if not page:
        return None

    # Load related concept
    concept = await session.get(Concept, page.concept_id)

    # Load characteristic values
    values = await session.execute(
        select(PageCharacteristicValue, Characteristic)
        .join(Characteristic, PageCharacteristicValue.characteristic_id == Characteristic.id)
        .where(PageCharacteristicValue.page_id == page.id)
    )
    char_texts = []
    for val, char in values.all():
        if val.value is None:
            continue
        val_str = ", ".join(val.value) if isinstance(val.value, list) else str(val.value)
        char_texts.append(f"{char.name}: {val_str}")

    doc_parts = [page.content or ""]
    if concept:
        doc_parts.append(concept.description or "")
    if char_texts:
        doc_parts.append("\n".join(char_texts))
    document = "\n".join(doc_parts)

    metadata = {
        "page_id": page.id,
        "gameworld_id": page.gameworld_id,
        "concept_id": page.concept_id,
    }

    collection = _get_collection(page.gameworld_id)
    collection.add(documents=[document], ids=[str(page.id)], metadatas=[metadata])
    return True


async def rebuild_world(session: AsyncSession, world_id: int):
    name = f"world_{world_id}"
    try:
        _client.delete_collection(name)
    except Exception:
        pass
    collection = _get_collection(world_id)

    result = await session.execute(select(Page.id).where(Page.gameworld_id == world_id))
    page_ids = [row[0] for row in result.all()]
    for pid in page_ids:
        await add_page(session, pid)
    return len(page_ids)


def query_world(world_id: int, query: str, n_results: int = 5) -> List[Dict]:
    collection = _get_collection(world_id)
    res = collection.query(query_texts=[query], n_results=n_results)
    docs = []
    for doc, meta in zip(res["documents"][0], res["metadatas"][0]):
        docs.append({"document": doc, **meta})
    return docs
