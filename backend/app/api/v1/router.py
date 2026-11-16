from fastapi import APIRouter

from app.api.v1.endpoints.auth import router as auth_router
from app.api.v1.endpoints.dashboard import router as dashboard_router
from app.api.v1.endpoints.executions import router as executions_router
from app.api.v1.endpoints.websocket import router as websocket_router
from app.api.v1.endpoints.workflows import router as workflows_router

api_router = APIRouter(prefix="/api/v1")

api_router.include_router(auth_router)
api_router.include_router(workflows_router)
api_router.include_router(executions_router)
api_router.include_router(dashboard_router)
api_router.include_router(websocket_router)
