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
from datetime import datetime, timezone

from app.models.model_page import Page, PageCharacteristicValue
from app.models.model_concept import Concept
from app.models.model_characteristic import Characteristic
from app.models.model_agent import Agent
from app.config import settings


# Persistent client storing collections under ./vector_db. ``chromadb``
# expects a filesystem path. ``settings.vector_db_path`` already contains
# the default path, but the location can be overridden with the
# ``VECTOR_DB_PATH`` environment variable.  The previous implementation
# attempted to read an environment variable whose name was the path
# itself which resulted in ``None`` being passed to ``PersistentClient``
# and therefore created an in-memory database.  Use the provided setting
# directly and fall back to it if the environment variable is not set.
_db_path = os.getenv("VECTOR_DB_PATH", settings.vector_db_path)
_client = chromadb.PersistentClient(path=_db_path)


def _get_collection(world_id: int):
    name = f"world_{world_id}"
    kwargs = {"embedding_function": _embedding_fn} if _embedding_fn else {}
    return _client.get_or_create_collection(name, **kwargs)


async def add_page(session: AsyncSession, page_id: int):
    result = await session.execute(
        select(Page).where(Page.id == page_id)
    )
    page = result.scalar_one_or_none()

    print (f" --- API VECTORDB - Adding this page: {page}")

    if not page:
        return None

    # Load related concept
    concept = await session.get(Concept, page.concept_id)
    print (f" --- API VECTORDB - getting the concept of the page: {concept}")

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

    print (f" --- API VECTORDB - Adding this document: {document}")
    print (f" --- API VECTORDB - Adding this metadata: {metadata}")

    collection = _get_collection(page.gameworld_id)
    collection.add(documents=[document], ids=[str(page.id)], metadatas=[metadata])
    try:
        _client.persist()
    except AttributeError:
        # The lightweight test stub does not implement ``persist``
        pass

    print (f" --- API VECTORDB - Page added to the chromadb!")
    return True


async def rebuild_world(session: AsyncSession, world_id: int):
    name = f"world_{world_id}"
    try:
        _client.delete_collection(name)
        print (f" - API VECTORDB - Deleted the current collection!!")
        try:
            _client.persist()
        except AttributeError:
            pass
    except Exception:
        print (f" - API VECTORDB - Could not delete the current collection!")
        pass

    collection = _get_collection(world_id)

    print (f" - API VECTORDB - Collection: {collection}")

    result = await session.execute(select(Page.id).where(Page.gameworld_id == world_id))
    print (f" - API VECTORDB - Pages: {result}")
    page_ids = [row[0] for row in result.all()]
    for pid in page_ids:
        print (f" - API VECTORDB - Adding page: {pid}")
        await add_page(session, pid)

    try:
        _client.persist()
    except AttributeError:
        pass

    # update agents in this world with current time
    agent_result = await session.execute(select(Agent).where(Agent.world_id == world_id))
    agents = agent_result.scalars().all()
    now = datetime.now(timezone.utc)
    for agent in agents:
        agent.vector_db_update_date = now
    await session.commit()
    return len(page_ids)


def query_world(world_id: int, query: str, n_results: int = 5) -> List[Dict]:
    """Query the vector DB for documents related to the given query."""
    collection = _get_collection(world_id)
    res = collection.query(query_texts=[query], n_results=n_results)

    # ``chromadb`` has changed its return type across versions.  Older
    # versions return a ``dict`` while newer ones return a dataclass-like
    # object with attributes.  Support both formats and gracefully handle
    # unexpected shapes.
    documents = None
    metadatas = None

    if isinstance(res, dict):
        documents = res.get("documents")
        metadatas = res.get("metadatas")
    else:  # newer versions expose attributes
        documents = getattr(res, "documents", None)
        metadatas = getattr(res, "metadatas", None)

    if not documents or not metadatas:
        return []

    # Results may be wrapped in an extra list; unwrap if needed
    if isinstance(documents, list) and documents and isinstance(documents[0], list):
        documents = documents[0]
    if isinstance(metadatas, list) and metadatas and isinstance(metadatas[0], list):
        metadatas = metadatas[0]

    docs = []
    for doc, meta in zip(documents, metadatas):
        if isinstance(meta, dict):
            docs.append({"document": doc, **meta})
        else:
            docs.append({"document": doc})
    return docs
