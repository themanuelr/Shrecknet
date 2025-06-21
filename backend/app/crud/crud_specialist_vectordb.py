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
    SimpleEmbeddings,
)

_embedding_fn = SimpleEmbeddings()

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
