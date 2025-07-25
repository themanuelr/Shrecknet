from sqlmodel import SQLModel
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import sessionmaker
from app.config import settings

DATABASE_URL = settings.database_url

engine = create_async_engine(DATABASE_URL, echo=True, future=True)
async_session_maker = sessionmaker(bind=engine, class_=AsyncSession, expire_on_commit=False)

async def init_db():
    async with engine.begin() as conn:
        await conn.run_sync(SQLModel.metadata.create_all)
        await conn.run_sync(_migrate)

def _migrate(conn):
    """Simple migration to add new columns without dropping data."""
    from sqlalchemy import inspect, text

    inspector = inspect(conn)
    columns = [c["name"] for c in inspector.get_columns("agent")]
    if "task" not in columns:
        conn.execute(text("ALTER TABLE agent ADD COLUMN task TEXT"))
    if "logo" not in columns:
        conn.execute(text("ALTER TABLE agent ADD COLUMN logo TEXT"))
    if "personality" not in columns:
        conn.execute(text("ALTER TABLE agent ADD COLUMN personality TEXT"))
    if "vector_db_update_date" not in columns:
        conn.execute(text("ALTER TABLE agent ADD COLUMN vector_db_update_date DATETIME"))
    if "specialist_update_date" not in columns:
        conn.execute(text("ALTER TABLE agent ADD COLUMN specialist_update_date DATETIME"))

    # -- Page table migrations --
    columns = [c["name"] for c in inspector.get_columns("page")]
    if "autogenerated_content" not in columns:
        conn.execute(text("ALTER TABLE page ADD COLUMN autogenerated_content TEXT"))
    if "updated_by_agent_id" not in columns:
        conn.execute(text("ALTER TABLE page ADD COLUMN updated_by_agent_id INTEGER REFERENCES agent(id)"))

    # -- SpecialistSource table --
    if "specialistsource" not in inspector.get_table_names():
        conn.execute(text(
            "CREATE TABLE specialistsource (id INTEGER PRIMARY KEY AUTOINCREMENT, agent_id INTEGER NOT NULL REFERENCES agent(id), name TEXT, type TEXT NOT NULL, path TEXT, url TEXT, added_at DATETIME NOT NULL)"
        ))
    else:
        columns = [c["name"] for c in inspector.get_columns("specialistsource")]
        if "name" not in columns:
            conn.execute(text("ALTER TABLE specialistsource ADD COLUMN name TEXT"))

async def get_session() -> AsyncSession:
    async with async_session_maker() as session:
        yield session
