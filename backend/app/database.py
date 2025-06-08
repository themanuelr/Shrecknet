# from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
# from sqlalchemy.orm import sessionmaker

# DATABASE_URL = "sqlite+aiosqlite:///./test.db"

# engine = create_async_engine(DATABASE_URL, echo=True)
# async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

# async def get_session() -> AsyncSession:    
#     async with async_session() as session:
#         yield session


from sqlmodel import SQLModel, create_engine
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import sessionmaker
from app.config import settings

DATABASE_URL = settings.database_url

engine = create_async_engine(DATABASE_URL, echo=True, future=True)
async_session_maker = sessionmaker(
    bind=engine, class_=AsyncSession, expire_on_commit=False
)

async def init_db():
    async with engine.begin() as conn:
        await conn.run_sync(SQLModel.metadata.create_all)
        await conn.run_sync(_migrate)

def _migrate(conn):
    """Simple migration to add new columns without dropping data."""
    from sqlalchemy import inspect
    inspector = inspect(conn)
    columns = [c['name'] for c in inspector.get_columns('agent')]
    if 'vector_db_update_date' not in columns:
        conn.execute('ALTER TABLE agent ADD COLUMN vector_db_update_date DATETIME')

async def get_session() -> AsyncSession:
    async with async_session_maker() as session:
        yield session   