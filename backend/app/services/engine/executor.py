import logging
import time
import uuid
from datetime import UTC, datetime
from typing import Any

from fastapi import WebSocket
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker

import app.db.session as db_session_module
from app.models.execution import (
    Execution,
    ExecutionStatus,
    NodeExecution,
    NodeExecutionStatus,
)
from app.models.workflow import Workflow
from app.services.engine.graph import WorkflowGraph
from app.services.engine.nodes import get_node_handler

logger = logging.getLogger("flowforge.engine.executor")


class ConnectionManager:
    """Manages active WebSocket connections per execution."""

    def __init__(self) -> None:
        self.active_connections: dict[str, set[WebSocket]] = {}

    async def connect(self, execution_id: str, websocket: WebSocket) -> None:
        await websocket.accept()
        if execution_id not in self.active_connections:
            self.active_connections[execution_id] = set()
        self.active_connections[execution_id].add(websocket)

    def disconnect(self, execution_id: str, websocket: WebSocket) -> None:
        if execution_id in self.active_connections:
            self.active_connections[execution_id].discard(websocket)
            if not self.active_connections[execution_id]:
                del self.active_connections[execution_id]

    async def broadcast(self, execution_id: str, message: dict[str, Any]) -> None:
        if execution_id not in self.active_connections:
            return
        dead_connections = set()
        for websocket in list(self.active_connections[execution_id]):
            try:
                await websocket.send_json(message)
            except Exception:
                dead_connections.add(websocket)

        for dead in dead_connections:
            self.disconnect(execution_id, dead)


ws_manager = ConnectionManager()


class WorkflowExecutor:
    def __init__(
        self,
        execution_id: uuid.UUID,
        session_factory: async_sessionmaker[AsyncSession] | None = None,
    ) -> None:
        self.execution_id = execution_id
        self.session_factory = session_factory or db_session_module.async_session_factory
        self.str_execution_id = str(execution_id)

    async def run(self) -> None:
        """Main execution loop for a workflow execution."""
        async with self.session_factory() as session:
            stmt = (
                select(Execution)
                .where(Execution.id == self.execution_id)
            )
            result = await session.execute(stmt)
            execution = result.scalar_one_or_none()

            if not execution:
                logger.error(f"Execution {self.execution_id} not found")
                return

            # Check if execution was already cancelled or terminal
            if execution.status in (
                ExecutionStatus.COMPLETED,
                ExecutionStatus.FAILED,
                ExecutionStatus.CANCELLED,
            ):
                return

            # Fetch associated workflow
            wf_stmt = select(Workflow).where(Workflow.id == execution.workflow_id)
            wf_result = await session.execute(wf_stmt)
            workflow = wf_result.scalar_one_or_none()

            if not workflow:
                execution.status = ExecutionStatus.FAILED
                execution.error = "Associated workflow was not found"
                execution.finished_at = datetime.now(UTC)
                await session.commit()
                await ws_manager.broadcast(
                    self.str_execution_id,
                    {
                        "type": "execution_status",
                        "data": {"status": "failed", "error": execution.error},
                    },
                )
                return

            # Start execution
            now_utc = datetime.now(UTC)
            execution.status = ExecutionStatus.RUNNING
            execution.started_at = now_utc
            await session.commit()

            await ws_manager.broadcast(
                self.str_execution_id,
                {
                    "type": "execution_status",
                    "data": {
                        "status": "running",
                        "started_at": now_utc.isoformat(),
                    },
                },
            )

        # Parse graph
        graph = WorkflowGraph(workflow.graph)
        try:
            if graph.detect_cycles():
                raise ValueError("Workflow graph contains cycles and cannot be executed")
        except Exception as e:
            await self._fail_execution(str(e))
            return

        nodes = graph.nodes
        if not nodes:
            await self._complete_execution()
            return

        # Prepare execution state
        node_outputs: dict[str, dict[str, Any]] = {}
        active_branches: dict[str, str] = {}  # node_id -> chosen branch ("true" / "false")
        skipped_nodes: set[str] = set()

        initial_input = execution.input_data or {}
        topological_order = graph.get_topological_order()

        for node_id in topological_order:
            node_def = nodes[node_id]
            node_type = node_def.get("type", "unknown")
            node_data = node_def.get("data", {}) or {}
            node_config = node_data.get("config", {}) or {}

            # Determine if this node should be skipped due to condition branching
            parent_edges = []
            for parent_id in graph.get_parent_ids(node_id):
                for edge in graph.get_outgoing_edges(parent_id):
                    if str(edge.get("target")) == node_id:
                        parent_edges.append(edge)

            # Check if any parent edge is active
            if parent_edges:
                has_active_parent = False
                for edge in parent_edges:
                    src = str(edge.get("source"))
                    src_handle = edge.get("sourceHandle")
                    if src in skipped_nodes:
                        continue
                    if src in active_branches and src_handle:
                        # Edge requires specific branch matching
                        if active_branches[src] == src_handle:
                            has_active_parent = True
                            break
                    else:
                        has_active_parent = True
                        break

                if not has_active_parent:
                    skipped_nodes.add(node_id)
                    await self._record_node_skipped(node_id, node_type)
                    continue

            # Compute input for this node
            parent_ids = graph.get_parent_ids(node_id)
            if not parent_ids:
                # Root or Trigger node gets execution initial input
                node_input = dict(initial_input)
            else:
                # Merge outputs of all non-skipped parents
                node_input = {}
                for pid in parent_ids:
                    if pid in node_outputs:
                        node_input.update(node_outputs[pid])

            # Execute node
            node_exec_id = await self._record_node_started(node_id, node_type, node_input)
            start_time = time.perf_counter()

            try:
                handler = get_node_handler(node_type)
                output = await handler.execute(node_input, node_config)
                duration_ms = int((time.perf_counter() - start_time) * 1000)

                node_outputs[node_id] = output

                if node_type == "condition":
                    active_branches[node_id] = output.get("branch", "true")

                await self._record_node_completed(
                    node_exec_id, node_id, output, duration_ms
                )
            except Exception as e:
                duration_ms = int((time.perf_counter() - start_time) * 1000)
                logger.exception(f"Error executing node {node_id} ({node_type}): {e}")
                await self._record_node_failed(
                    node_exec_id, node_id, str(e), duration_ms
                )
                await self._fail_execution(f"Node '{node_id}' failed: {e}")
                return

        await self._complete_execution()

    async def _record_node_started(
        self, node_id: str, node_type: str, input_data: dict[str, Any]
    ) -> uuid.UUID:
        now_utc = datetime.now(UTC)
        async with self.session_factory() as session:
            node_exec = NodeExecution(
                execution_id=self.execution_id,
                node_id=node_id,
                node_type=node_type,
                status=NodeExecutionStatus.RUNNING,
                input_data=input_data,
                started_at=now_utc,
            )
            session.add(node_exec)
            await session.commit()
            await session.refresh(node_exec)
            node_exec_id = node_exec.id

        await ws_manager.broadcast(
            self.str_execution_id,
            {
                "type": "node_status",
                "data": {
                    "node_id": node_id,
                    "status": "running",
                    "input_data": input_data,
                    "started_at": now_utc.isoformat(),
                },
            },
        )
        return node_exec_id

    async def _record_node_completed(
        self,
        node_exec_id: uuid.UUID,
        node_id: str,
        output_data: dict[str, Any],
        duration_ms: int,
    ) -> None:
        now_utc = datetime.now(UTC)
        async with self.session_factory() as session:
            stmt = select(NodeExecution).where(NodeExecution.id == node_exec_id)
            res = await session.execute(stmt)
            node_exec = res.scalar_one_or_none()
            if node_exec:
                node_exec.status = NodeExecutionStatus.COMPLETED
                node_exec.output_data = output_data
                node_exec.finished_at = now_utc
                node_exec.duration_ms = duration_ms
                await session.commit()

        await ws_manager.broadcast(
            self.str_execution_id,
            {
                "type": "node_status",
                "data": {
                    "node_id": node_id,
                    "status": "completed",
                    "output_data": output_data,
                    "duration_ms": duration_ms,
                    "finished_at": now_utc.isoformat(),
                },
            },
        )

    async def _record_node_failed(
        self,
        node_exec_id: uuid.UUID,
        node_id: str,
        error_msg: str,
        duration_ms: int,
    ) -> None:
        now_utc = datetime.now(UTC)
        async with self.session_factory() as session:
            stmt = select(NodeExecution).where(NodeExecution.id == node_exec_id)
            res = await session.execute(stmt)
            node_exec = res.scalar_one_or_none()
            if node_exec:
                node_exec.status = NodeExecutionStatus.FAILED
                node_exec.error = error_msg
                node_exec.finished_at = now_utc
                node_exec.duration_ms = duration_ms
                await session.commit()

        await ws_manager.broadcast(
            self.str_execution_id,
            {
                "type": "node_status",
                "data": {
                    "node_id": node_id,
                    "status": "failed",
                    "error": error_msg,
                    "duration_ms": duration_ms,
                    "finished_at": now_utc.isoformat(),
                },
            },
        )

    async def _record_node_skipped(self, node_id: str, node_type: str) -> None:
        now_utc = datetime.now(UTC)
        async with self.session_factory() as session:
            node_exec = NodeExecution(
                execution_id=self.execution_id,
                node_id=node_id,
                node_type=node_type,
                status=NodeExecutionStatus.SKIPPED,
                started_at=now_utc,
                finished_at=now_utc,
                duration_ms=0,
            )
            session.add(node_exec)
            await session.commit()

        await ws_manager.broadcast(
            self.str_execution_id,
            {
                "type": "node_status",
                "data": {
                    "node_id": node_id,
                    "status": "skipped",
                    "finished_at": now_utc.isoformat(),
                },
            },
        )

    async def _fail_execution(self, error_msg: str) -> None:
        now_utc = datetime.now(UTC)
        async with self.session_factory() as session:
            stmt = select(Execution).where(Execution.id == self.execution_id)
            res = await session.execute(stmt)
            execution = res.scalar_one_or_none()
            if execution:
                execution.status = ExecutionStatus.FAILED
                execution.error = error_msg
                execution.finished_at = now_utc
                await session.commit()

        await ws_manager.broadcast(
            self.str_execution_id,
            {
                "type": "execution_complete",
                "data": {
                    "status": "failed",
                    "error": error_msg,
                    "finished_at": now_utc.isoformat(),
                },
            },
        )

    async def _complete_execution(self) -> None:
        now_utc = datetime.now(UTC)
        async with self.session_factory() as session:
            stmt = select(Execution).where(Execution.id == self.execution_id)
            res = await session.execute(stmt)
            execution = res.scalar_one_or_none()
            if execution:
                execution.status = ExecutionStatus.COMPLETED
                execution.finished_at = now_utc
                await session.commit()

        await ws_manager.broadcast(
            self.str_execution_id,
            {
                "type": "execution_complete",
                "data": {
                    "status": "completed",
                    "finished_at": now_utc.isoformat(),
                },
            },
        )
