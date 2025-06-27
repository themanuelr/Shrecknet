import os, json, io, zipfile, shutil, tempfile
from sqlmodel import SQLModel, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import model_agent, model_characteristic, model_concept, model_gameworld, model_page, model_specialist_source, model_user

MODELS = [
    model_user.User,
    model_gameworld.GameWorld,
    model_concept.Concept,
    model_characteristic.Characteristic,
    model_characteristic.ConceptCharacteristicLink,
    model_page.Page,
    model_page.PageCharacteristicValue,
    model_agent.Agent,
    model_specialist_source.SpecialistSource,
]

def _model_name(model):
    return model.__name__.lower() + 's'

async def export_backup_zip(session: AsyncSession, uploads_dir: str = 'uploads'):
    data = {}
    for model in MODELS:
        result = await session.execute(select(model))
        rows = result.scalars().all()
        data[_model_name(model)] = [r.dict() for r in rows]
    buffer = io.BytesIO()
    with zipfile.ZipFile(buffer, 'w', zipfile.ZIP_DEFLATED) as zf:
        zf.writestr('data.json', json.dumps(data, default=str))
        if os.path.isdir(uploads_dir):
            for root, _, files in os.walk(uploads_dir):
                for f in files:
                    full = os.path.join(root, f)
                    arcname = os.path.relpath(full, uploads_dir)
                    zf.write(full, os.path.join('uploads', arcname))
    buffer.seek(0)
    return buffer.read()

async def import_backup_zip(session: AsyncSession, file, uploads_dir: str = 'uploads'):
    with tempfile.TemporaryDirectory() as tmpdir:
        data_path = os.path.join(tmpdir, 'data.json')
        with zipfile.ZipFile(io.BytesIO(await file.read()), 'r') as zf:
            zf.extractall(tmpdir)
        with open(data_path, 'r') as f:
            data = json.load(f)
        extracted_uploads = os.path.join(tmpdir, 'uploads')
        if os.path.exists(uploads_dir):
            shutil.rmtree(uploads_dir)
        if os.path.exists(extracted_uploads):
            shutil.move(extracted_uploads, uploads_dir)
        # clear tables
        for model in MODELS[::-1]:
            await session.execute(model.__table__.delete())
        # insert rows
        for model in MODELS:
            entries = data.get(_model_name(model), [])
            for row in entries:
                obj = model(**row)
                session.add(obj)
        await session.commit()
