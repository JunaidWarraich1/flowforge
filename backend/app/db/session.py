import os
from collections.abc import AsyncGenerator
from urllib.parse import parse_qs, urlencode, urlparse, urlunparse

from sqlalchemy.ext.asyncio import (
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)

from app.core.config import settings

engine_kwargs = {"echo": False, "future": True}

raw_db_url = settings.DATABASE_URL

# In serverless environments (Vercel, AWS Lambda), the root filesystem is read-only.
# If using SQLite default, redirect to /tmp so writes succeed.
if raw_db_url.startswith("sqlite") and (os.environ.get("VERCEL") or os.environ.get("AWS_LAMBDA_FUNCTION_NAME")):
    clean_db_url = "sqlite+aiosqlite:////tmp/flowforge.db"
else:
    clean_db_url = raw_db_url

# Handle SQLite pool settings if running against local SQLite file
if clean_db_url.startswith("sqlite"):
    engine_kwargs["connect_args"] = {"check_same_thread": False}

# Normalize driver and query parameters for SQLAlchemy asyncpg (e.g. Neon PostgreSQL)
if clean_db_url.startswith("postgresql://"):
    clean_db_url = clean_db_url.replace("postgresql://", "postgresql+asyncpg://", 1)
elif clean_db_url.startswith("postgres://"):
    clean_db_url = clean_db_url.replace("postgres://", "postgresql+asyncpg://", 1)

parsed = urlparse(clean_db_url)
if "asyncpg" in parsed.scheme:
    query_params = parse_qs(parsed.query)
    # asyncpg does not accept channel_binding
    query_params.pop("channel_binding", None)
    # asyncpg requires ssl instead of sslmode
    if "sslmode" in query_params:
        query_params.pop("sslmode")
        query_params["ssl"] = ["require"]
    new_query = urlencode([(k, v[0]) for k, v in query_params.items()])
    clean_db_url = urlunparse(parsed._replace(query=new_query))

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
