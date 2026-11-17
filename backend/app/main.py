from collections.abc import AsyncGenerator
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware

from app.api.v1.router import api_router
from app.core.config import settings
from app.db.base import Base
from app.db.session import engine


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    # Initialize database tables on startup
    try:
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
    except Exception as e:
        import logging
        logging.getLogger("uvicorn").warning(f"Database startup sync: {e}")
    yield
    # Cleanup database engine on shutdown
    try:
        await engine.dispose()
    except Exception:
        pass


app = FastAPI(
    title=settings.APP_NAME,
    description="FlowForge Visual Workflow Automation Engine API",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS Middleware
origins = settings.BACKEND_CORS_ORIGINS
if not origins or "*" in origins:
    origins = ["*"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.middleware("http")
async def vercel_path_rewrite_middleware(request: Request, call_next):
    # Normalize Vercel serverless function path rewrites
    path = request.scope.get("path", "")
    if path.startswith("/api/index.py"):
        new_path = path[len("/api/index.py") :] or "/"
        request.scope["path"] = new_path
    elif path == "/api/index" or path == "/api":
        request.scope["path"] = "/"

    return await call_next(request)


@app.get("/", tags=["root"])
async def root() -> dict:
    return {
        "app": settings.APP_NAME,
        "status": "online",
        "docs": "/docs",
        "health": "/health",
        "version": "1.0.0",
    }
        "version": "1.0.0",
    }


@app.get("/health", tags=["health"])
async def health_check() -> dict:
    return {
        "status": "ok",
        "app": settings.APP_NAME,
        "environment": settings.ENVIRONMENT,
    }


app.include_router(api_router)
