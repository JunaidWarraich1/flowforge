import logging

import app.models.execution  # noqa: F401
import app.models.user  # noqa: F401
import app.models.workflow  # noqa: F401
from app.db.base import Base
from app.db.session import engine

logger = logging.getLogger("flowforge.db")
_tables_initialized = False


async def init_db() -> None:
    global _tables_initialized
    if not _tables_initialized:
        try:
            async with engine.begin() as conn:
                await conn.run_sync(Base.metadata.create_all)
            _tables_initialized = True
        except Exception as e:
            logger.warning("Auto table initialization: %s", e)
