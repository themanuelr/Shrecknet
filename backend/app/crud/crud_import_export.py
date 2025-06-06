from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from app.models.model_gameworld import GameWorld
from app.models.model_concept import Concept
from app.models.model_characteristic import Characteristic, ConceptCharacteristicLink
import json
from datetime import datetime, timezone

import os
import zipfile
import io
import tempfile
import requests

from fastapi import Response

def parse_datetime(dt):
    if dt is None:
        return None
    if isinstance(dt, datetime):
        return dt
    # Try to parse ISO format string
    try:
        # Handles both with and without timezone info
        return datetime.fromisoformat(dt)
    except Exception:
        try:
            # Sometimes input is just 'YYYY-MM-DD'
            return datetime.strptime(dt, "%Y-%m-%d")
        except Exception:
            return None  # fallback, or raise error
        

async def export_world_zip(session, world_id, frontend_base_url):
    world_json = await export_world(session, world_id)
    if not world_json:
        return None, False

    # Gather all image/logo paths to include
    files_to_include = set()
    for item in [world_json["world"]]:
        logo = item.get("logo")
        if logo: files_to_include.add(logo)
    for c in world_json["concepts"]:
        logo = c.get("logo")
        if logo: files_to_include.add(logo)
    for ch in world_json["characteristics"]:
        logo = ch.get("logo")
        if logo: files_to_include.add(logo)

    zip_buffer = io.BytesIO()
    with zipfile.ZipFile(zip_buffer, "w", zipfile.ZIP_DEFLATED) as zf:
        zf.writestr("world.json", json.dumps(world_json, indent=2, default=str))
        for rel_path in files_to_include:
            # Only try to fetch if looks like a relative web path
            if rel_path.startswith("/"):
                url = frontend_base_url.rstrip("/") + rel_path
                try:
                    resp = requests.get(url, timeout=8)
                    resp.raise_for_status()
                    # Store images under the "images/" folder in the ZIP. This
                    # keeps compatibility with the import helper that expects
                    # files inside an "images" directory. Uploaded assets are
                    # stored under "/uploads" in the frontend, so strip that
                    # prefix if present.
                    internal_path = rel_path.lstrip("/")
                    if internal_path.startswith("uploads/"):
                        internal_path = "images/" + internal_path[len("uploads/"):]
                    zf.writestr(internal_path, resp.content)
                    print(f"Included {url}")
                except Exception as e:
                    print(f"Could not fetch {url}: {e}")
            else:
                print(f"Skipping non-web path: {rel_path}")

    zip_buffer.seek(0)
    return zip_buffer.read(), True


async def export_world(session: AsyncSession, world_id: int):
    world = await session.get(GameWorld, world_id)
    if not world:
        return None

    # Fetch all characteristics for this world
    char_stmt = await session.execute(
        select(Characteristic).where(Characteristic.gameworld_id == world_id)
    )
    characteristics = char_stmt.scalars().all()

    # Fetch all concepts for this world
    concept_stmt = await session.execute(
        select(Concept).where(Concept.gameworld_id == world_id)
    )
    concepts = concept_stmt.scalars().all()

    # Fetch all ConceptCharacteristicLinks
    link_stmt = await session.execute(
        select(ConceptCharacteristicLink).where(
            ConceptCharacteristicLink.concept_id.in_([c.id for c in concepts])
        )
    )
    links = link_stmt.scalars().all()

    # Map concept_id to list of links
    concept_links_map = {}
    for link in links:
        lst = concept_links_map.setdefault(link.concept_id, [])
        lst.append({
            "characteristic_id": link.characteristic_id,
            "order": link.order,
            "display_type": link.display_type,
        })

    # Compose output structure for concepts
    concept_exports = []
    for c in concepts:
        c_dict = c.dict()
        c_dict["characteristics"] = sorted(
            concept_links_map.get(c.id, []),
            key=lambda x: x["order"] if x["order"] is not None else 0
        )
        concept_exports.append(c_dict)

    # Compose full world export
    world_json = {
        "world": world.dict(),
        "concepts": concept_exports,
        "characteristics": [ch.dict() for ch in characteristics]
    }
    return world_json


async def import_world_zip(session, file):
    # file: UploadFile from FastAPI
    with tempfile.TemporaryDirectory() as tmpdir:
        zip_path = os.path.join(tmpdir, "import.zip")
        with open(zip_path, "wb") as f:
            f.write(await file.read())
        with zipfile.ZipFile(zip_path, "r") as zf:
            zf.extractall(tmpdir)
            with open(os.path.join(tmpdir, "world.json"), "r") as jf:
                world_json = json.load(jf)
            for file_info in zf.infolist():
                if file_info.filename == "world.json":
                    continue
                dest_path = os.path.join("public", file_info.filename)
                os.makedirs(os.path.dirname(dest_path), exist_ok=True)
                src_path = os.path.join(tmpdir, file_info.filename)
                if os.path.isfile(src_path):
                    os.replace(src_path, dest_path)
    # Now import the world (your normal function)
    from app.crud.crud_import_export import import_world
    return await import_world(session, world_json)


async def import_world(session: AsyncSession, world_json: dict):
    # 1. Create world (without id)
    print (f"World JSON: {world_json}")
    world_data = world_json["world"]
    world_data.pop("id", None)
    # Fix date/datetime fields
    for field in ["created_at", "edited_at"]:
        if field in world_data:
            world_data[field] = parse_datetime(world_data[field]) or datetime.now(timezone.utc)
        else:
            world_data[field] = datetime.now(timezone.utc)
    new_world = GameWorld(**world_data)
    session.add(new_world)
    await session.flush()
    await session.refresh(new_world)

    # 2. Create characteristics (track old->new id)
    old_to_new_char_ids = {}
    for char in world_json["characteristics"]:
        old_id = char.pop("id", None)
        char["gameworld_id"] = new_world.id
        for field in ["created_at", "edited_at"]:
            if field in char:
                char[field] = parse_datetime(char[field]) or datetime.now(timezone.utc)
            else:
                char[field] = datetime.now(timezone.utc)
        c = Characteristic(**char)
        session.add(c)
        await session.flush()
        await session.refresh(c)
        old_to_new_char_ids[old_id] = c.id

    # 3. Create concepts (track old->new id)
    old_to_new_concept_ids = {}
    for concept in world_json["concepts"]:
        old_id = concept.pop("id", None)
        concept["gameworld_id"] = new_world.id
        concept_chars = concept.pop("characteristics", [])
        for field in ["created_at", "edited_at"]:
            if field in concept:
                concept[field] = parse_datetime(concept[field]) or datetime.now(timezone.utc)
            else:
                concept[field] = datetime.now(timezone.utc)
        c = Concept(**concept)
        session.add(c)
        await session.flush()
        await session.refresh(c)
        old_to_new_concept_ids[old_id] = c.id
        # 4. Link characteristics
        for ch in concept_chars:
            new_char_id = old_to_new_char_ids.get(ch["characteristic_id"])
            if new_char_id:
                link = ConceptCharacteristicLink(
                    concept_id=c.id,
                    characteristic_id=new_char_id,
                    order=ch.get("order"),
                    display_type=ch.get("display_type"),  # NEW
                )
                session.add(link)
    await session.commit()
    return new_world.id