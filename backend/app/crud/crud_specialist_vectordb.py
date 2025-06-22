import os
from typing import List
from datetime import datetime, timezone

from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain.docstore.document import Document
from langchain_chroma import Chroma
import requests
from pdfminer.high_level import extract_text as pdf_extract_text

from app.models.model_specialist_source import SpecialistSource
from app.models.model_agent import Agent
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.crud.crud_vectordb import (
    get_chroma_client,
    _delete_collection,
    _embedding_fn,
)


_text_splitter = RecursiveCharacterTextSplitter(
    chunk_size=300,
    chunk_overlap=50,
    length_function=lambda txt: len(txt.split()),
)


def _get_collection(agent_id: int) -> Chroma:
    name = f"specialist_{agent_id}"
    client = get_chroma_client()
    return Chroma(
        client=client,
        collection_name=name,
        embedding_function=_embedding_fn,
    )


def _load_source(src: SpecialistSource) -> str:
    if src.type == "file" and src.path:
        if src.path.lower().endswith(".pdf"):
            try:
                return pdf_extract_text(src.path)
            except Exception:
                return ""
        try:
            with open(src.path, "r", encoding="utf-8") as f:
                return f.read()
        except Exception:
            return ""
    if src.type == "link" and src.url:
        try:
            resp = requests.get(src.url, timeout=10)
            resp.raise_for_status()
            return resp.text
        except Exception:
            return ""
    return ""


async def rebuild_agent(session: AsyncSession, agent_id: int) -> int:
    result = await session.execute(
        select(SpecialistSource).where(SpecialistSource.agent_id == agent_id)
    )
    sources = result.scalars().all()
    collection = _get_collection(agent_id)
    _delete_collection(f"specialist_{agent_id}", collection)

    docs: List[Document] = []
    for src in sources:
        text = _load_source(src)
        if not text:
            continue
        split_docs = _text_splitter.create_documents([text])
        for i, d in enumerate(split_docs):
            d.metadata["source_id"] = src.id
            d.metadata["chunk_index"] = i
            docs.append(d)
    if docs:
        collection.add_documents(docs)

    agent = await session.get(Agent, agent_id)
    if agent:
        agent.specialist_update_date = datetime.now(timezone.utc)
        await session.commit()
    return len(docs)


def export_agent_vectordb(agent_id: int) -> dict:
    """Export the vector database for an agent as a serializable dict."""
    collection = _get_collection(agent_id)
    # `ids` are always returned by Chroma's ``get`` method and should not be
    # passed in the ``include`` list. Newer versions of Chroma raise a
    # ``ValueError`` when ``ids`` is included, which resulted in 500 errors when
    # exporting a vector database. We only request the optional fields that are
    # allowed and rely on the default behaviour to include the document IDs.
    data = collection.get(include=["documents", "metadatas", "embeddings"])
    return {
        "documents": data.get("documents", []),
        "metadatas": data.get("metadatas", []),
        "embeddings": data.get("embeddings", []),
        "ids": data.get("ids", []),
    }


async def import_agent_vectordb(session: AsyncSession, agent_id: int, data: dict) -> int:
    """Import vector DB data for an agent, replacing existing data."""
    docs = data.get("documents") or []
    metas = data.get("metadatas") or []
    embeds = data.get("embeddings") or []
    ids = data.get("ids") or None

    collection = _get_collection(agent_id)
    _delete_collection(f"specialist_{agent_id}", collection)

    if docs:
        collection._collection.add(
            ids=ids,
            embeddings=embeds,
            documents=docs,
            metadatas=metas,
        )

    agent = await session.get(Agent, agent_id)
    if agent:
        agent.specialist_update_date = datetime.now(timezone.utc)
        await session.commit()
    return len(docs)



def query_agent(agent_id: int, query: str, n_results: int = 5) -> List[dict]:
    """Query the specialist vector DB for relevant documents."""
    collection = _get_collection(agent_id)
    retrieved = collection.max_marginal_relevance_search(query, k=n_results * 4)

    sources: dict[int, dict] = {}
    for doc in retrieved:
        meta = doc.metadata or {}
        sid = meta.get("source_id")
        if sid is None:
            continue
        entry = sources.setdefault(
            sid,
            {"document_parts": [], "metadata": {k: v for k, v in meta.items() if k != "chunk_index"}},
        )
        entry["document_parts"].append((meta.get("chunk_index", 0), doc.page_content))

    results: List[dict] = []
    for src in sources.values():
        parts = sorted(src["document_parts"], key=lambda x: x[0])
        full_doc = " ".join(p[1] for p in parts)
        results.append({"document": full_doc, **src["metadata"]})

    return results[:n_results]

async def rebuild_agent_with_progress(
    session: AsyncSession,
    agent_id: int,
    progress_callback,
) -> int:
    """Rebuild agent vector DB with progress callback."""
    result = await session.execute(
        select(SpecialistSource).where(SpecialistSource.agent_id == agent_id)
    )
    sources = result.scalars().all()
    collection = _get_collection(agent_id)
    _delete_collection(f"specialist_{agent_id}", collection)

    docs: List[Document] = []
    total = len(sources)
    for idx, src in enumerate(sources, start=1):
        if progress_callback:
            progress_callback(f"reading document {src.name} {idx}/{total}")
        text = _load_source(src)
        if not text:
            continue
        if progress_callback:
            progress_callback(f"creating chunks of document {src.name} {idx}/{total}")
        split_docs = _text_splitter.create_documents([text])
        for i, d in enumerate(split_docs):
            d.metadata["source_id"] = src.id
            d.metadata["chunk_index"] = i
            docs.append(d)
    if docs:
        if progress_callback:
            progress_callback(f"embedding documents {len(docs)}")
        collection.add_documents(docs)

    agent = await session.get(Agent, agent_id)
    if agent:
        agent.specialist_update_date = datetime.now(timezone.utc)
        await session.commit()
    return len(docs)

