import os
from collections.abc import AsyncGenerator

from sqlalchemy.ext.asyncio import (
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)

from app.core.config import settings

engine_kwargs = {"echo": False, "future": True}

clean_db_url = settings.DATABASE_URL

# In serverless environments (Vercel, AWS Lambda), the root filesystem is read-only.
# If using SQLite default, redirect to /tmp so writes succeed.
if clean_db_url.startswith("sqlite") and (os.environ.get("VERCEL") or os.environ.get("AWS_LAMBDA_FUNCTION_NAME")):
    clean_db_url = "sqlite+aiosqlite:////tmp/flowforge.db"

# Handle SQLite pool settings if running against local SQLite file
if clean_db_url.startswith("sqlite"):
    engine_kwargs["connect_args"] = {"check_same_thread": False}

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
