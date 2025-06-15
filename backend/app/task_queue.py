import os
import asyncio
from celery import Celery

celery_app = Celery(
    'shrecknet',
    broker=os.getenv('CELERY_BROKER_URL', 'redis://localhost:6379/0'),
    backend=os.getenv('CELERY_RESULT_BACKEND', 'redis://localhost:6379/0'),
)

celery_app.conf.task_serializer = 'json'
celery_app.conf.result_serializer = 'json'
celery_app.conf.accept_content = ['json']
celery_app.conf.broker_connection_retry_on_startup = True

from app.crud.crud_page_links_update import (
    auto_crosslink_page_content,
    auto_crosslink_batch,
    remove_crosslinks_to_page,
    remove_page_refs_from_characteristics,
)

# Ensure all models are imported so SQLModel can resolve relationships
# Import all models so SQLModel is aware of every table when running in the
# Celery worker context. Without these imports SQLModel may not register the
# tables referenced by relationships, leading to NoReferencedTableError during
# flush/commit.
import app.models.model_concept  # noqa: F401
import app.models.model_gameworld  # noqa: F401
import app.models.model_user  # noqa: F401
import app.models.model_page  # noqa: F401
import app.models.model_characteristic  # noqa: F401

@celery_app.task
def task_auto_crosslink_page_content(page_id: int):
    asyncio.run(auto_crosslink_page_content(page_id))

@celery_app.task
def task_auto_crosslink_batch(page_id: int):
    asyncio.run(auto_crosslink_batch(page_id))

@celery_app.task
def task_remove_crosslinks_to_page(page_id: int):
    asyncio.run(remove_crosslinks_to_page(page_id))

@celery_app.task
def task_remove_page_refs_from_characteristics(page_id: int):
    asyncio.run(remove_page_refs_from_characteristics(page_id))

from app.crud.crud_page_analysis import analyze_pages_bulk
from app.api.api_agent import get_agent
from app.crud.crud_page import get_page
from app.database import async_session_maker
from app.config import settings
from app.crud import crud_vectordb
from datetime import datetime, timezone
import json
from pathlib import Path


@celery_app.task
def task_bulk_analyze(agent_id: int, page_ids: list[int], job_id: str):
    async def run():
        job_dir = Path(settings.bulk_job_dir)
        job_dir.mkdir(parents=True, exist_ok=True)
        job_path = job_dir / f"{job_id}.json"
        with open(job_path, "w") as f:
            json.dump({"status": "processing"}, f)

        async with async_session_maker() as session:
            agent = await get_agent(session, agent_id)
            pages = []
            for pid in page_ids:
                p = await get_page(session, pid)
                if p and p.gameworld_id == agent.world_id:
                    pages.append(p)

            suggestions = await analyze_pages_bulk(session, agent, pages)

        with open(job_path, "w") as f:
            json.dump({"status": "done", "suggestions": suggestions}, f)

    asyncio.run(run())


@celery_app.task
def task_rebuild_vectordb(agent_id: int, job_id: str):
    async def run():
        job_dir = Path(settings.vectordb_job_dir)
        job_dir.mkdir(parents=True, exist_ok=True)
        job_path = job_dir / f"{job_id}.json"
        start_time = datetime.now(timezone.utc).isoformat()
        with open(job_path, "w") as f:
            json.dump({
                "status": "processing",
                "agent_id": agent_id,
                "job_type": "update_vector_db",
                "start_time": start_time,
            }, f)

        async with async_session_maker() as session:
            agent = await get_agent(session, agent_id)
            if not agent:
                with open(job_path, "w") as ff:
                    json.dump({
                        "status": "error",
                        "error": "Agent not found",
                        "start_time": start_time,
                    }, ff)
                return

            count = await crud_vectordb.rebuild_world(session, agent.world_id)

        end_time = datetime.now(timezone.utc).isoformat()
        with open(job_path, "w") as f:
            json.dump({
                "status": "done",
                "agent_id": agent_id,
                "job_type": "update_vector_db",
                "pages_indexed": count,
                "start_time": start_time,
                "end_time": end_time,
            }, f)

    asyncio.run(run())
