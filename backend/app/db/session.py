from collections.abc import AsyncGenerator

from sqlalchemy.ext.asyncio import (
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)

from app.core.config import settings

engine_kwargs = {"echo": False, "future": True}

# Handle SQLite pool settings if running against local SQLite file
if settings.DATABASE_URL.startswith("sqlite"):
    engine_kwargs["connect_args"] = {"check_same_thread": False}

clean_db_url = settings.DATABASE_URL

# Automatically normalize driver for SQLAlchemy asyncpg
if clean_db_url.startswith("postgresql://"):
    clean_db_url = clean_db_url.replace("postgresql://", "postgresql+asyncpg://", 1)
elif clean_db_url.startswith("postgres://"):
    clean_db_url = clean_db_url.replace("postgres://", "postgresql+asyncpg://", 1)

# Automatically normalize sslmode parameter for asyncpg compatibility (e.g. Neon PostgreSQL)
if "sslmode=" in clean_db_url:
    clean_db_url = clean_db_url.replace("sslmode=", "ssl=")

engine = create_async_engine(
    clean_db_url,
    **engine_kwargs,
)

async_session_factory = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False,
)


async def get_db_session() -> AsyncGenerator[AsyncSession, None]:
    async with async_session_factory() as session:
        try:
            yield session
        finally:
            await session.close()
