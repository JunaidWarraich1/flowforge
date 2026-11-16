import logging
import uuid

from fastapi import APIRouter, WebSocket, WebSocketDisconnect, status
from sqlalchemy import select

from app.core.security import decode_token
from app.db.session import async_session_factory
from app.models.execution import Execution
from app.models.user import User, UserRole
from app.models.workflow import Workflow
from app.services.engine.executor import ws_manager

logger = logging.getLogger("flowforge.websocket")
router = APIRouter(tags=["websocket"])


@router.websocket("/ws/executions/{execution_id}")
async def execution_websocket(
    websocket: WebSocket,
    execution_id: uuid.UUID,
) -> None:
    token = websocket.query_params.get("token")
    if not token:
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return

    try:
        payload = decode_token(token)
        user_id_raw = payload.get("sub")
        if not user_id_raw:
            await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
            return
        user_id = uuid.UUID(user_id_raw)
    except Exception:
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return

    # Verify user and execution ownership
    async with async_session_factory() as session:
        user_stmt = select(User).where(User.id == user_id)
        user_res = await session.execute(user_stmt)
        user = user_res.scalar_one_or_none()

        if not user:
            await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
            return

        exec_stmt = (
            select(Execution)
            .join(Workflow, Execution.workflow_id == Workflow.id)
            .where(Execution.id == execution_id)
        )
        if user.role != UserRole.ADMIN:
            exec_stmt = exec_stmt.where(Workflow.user_id == user.id)

        exec_res = await session.execute(exec_stmt)
        execution = exec_res.scalar_one_or_none()

        if not execution:
            await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
            return

    str_exec_id = str(execution_id)
    await ws_manager.connect(str_exec_id, websocket)

    try:
        # Keep connection open and process incoming messages (e.g. ping/heartbeat)
        while True:
            data = await websocket.receive_text()
            if data == "ping":
                await websocket.send_text("pong")
    except WebSocketDisconnect:
        ws_manager.disconnect(str_exec_id, websocket)
    except Exception as e:
        logger.warning(f"WebSocket connection error: {e}")
        ws_manager.disconnect(str_exec_id, websocket)
