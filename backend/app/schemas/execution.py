import uuid
from datetime import datetime
from typing import Any

from pydantic import BaseModel, ConfigDict

from app.models.execution import ExecutionStatus, NodeExecutionStatus


class ExecutionCreate(BaseModel):
    input_data: dict[str, Any] | None = None


class NodeExecutionResponse(BaseModel):
    id: uuid.UUID
    execution_id: uuid.UUID
    node_id: str
    node_type: str
    status: NodeExecutionStatus
    input_data: dict[str, Any] | None = None
    output_data: dict[str, Any] | None = None
    started_at: datetime | None = None
    finished_at: datetime | None = None
    duration_ms: int | None = None
    error: str | None = None

    model_config = ConfigDict(from_attributes=True)


class ExecutionSummary(BaseModel):
    id: uuid.UUID
    workflow_id: uuid.UUID
    workflow_name: str | None = None
    status: ExecutionStatus
    triggered_by: str
    started_at: datetime | None = None
    finished_at: datetime | None = None
    duration_ms: int | None = None
    error: str | None = None
    created_at: datetime | None = None

    model_config = ConfigDict(from_attributes=True)


class ExecutionResponse(BaseModel):
    id: uuid.UUID
    workflow_id: uuid.UUID
    status: ExecutionStatus
    triggered_by: str
    input_data: dict[str, Any] | None = None
    started_at: datetime | None = None
    finished_at: datetime | None = None
    error: str | None = None
    created_at: datetime | None = None
    node_executions: list[NodeExecutionResponse] = []

    model_config = ConfigDict(from_attributes=True)


class ExecutionListResponse(BaseModel):
    items: list[ExecutionSummary]
    total: int
    page: int
    pages: int


class DashboardStatsResponse(BaseModel):
    total_workflows: int
    active_workflows: int
    total_executions: int
    successful_executions: int
    failed_executions: int
    avg_execution_time_ms: float
    recent_executions: list[ExecutionSummary]
