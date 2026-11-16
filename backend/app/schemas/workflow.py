import uuid
from datetime import datetime
from typing import Any

from pydantic import BaseModel, ConfigDict, Field, field_validator

from app.models.workflow import WorkflowStatus


class NodeData(BaseModel):
    id: str
    type: str
    position: dict[str, Any] | None = None
    data: dict[str, Any] | None = None


class EdgeData(BaseModel):
    id: str
    source: str
    target: str
    sourceHandle: str | None = None
    targetHandle: str | None = None
    label: str | None = None


class GraphData(BaseModel):
    nodes: list[dict[str, Any]] = Field(default_factory=list)
    edges: list[dict[str, Any]] = Field(default_factory=list)


class WorkflowCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=200)
    description: str | None = None
    graph: dict[str, Any] | None = None

    @field_validator("name")
    @classmethod
    def validate_name(cls, v: str) -> str:
        cleaned = v.strip()
        if not cleaned:
            raise ValueError("Workflow name cannot be blank or whitespace-only")
        return cleaned


class WorkflowUpdate(BaseModel):
    name: str | None = None
    description: str | None = None
    status: WorkflowStatus | None = None
    graph: dict[str, Any] | None = None

    @field_validator("name")
    @classmethod
    def validate_name_if_present(cls, v: str | None) -> str | None:
        if v is not None:
            cleaned = v.strip()
            if not cleaned:
                raise ValueError("Workflow name cannot be blank or whitespace-only")
            return cleaned
        return v


class WorkflowSummary(BaseModel):
    id: uuid.UUID
    name: str
    description: str | None = None
    status: WorkflowStatus
    version: int
    created_at: datetime
    updated_at: datetime
    node_count: int = 0

    model_config = ConfigDict(from_attributes=True)


class WorkflowResponse(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    name: str
    description: str | None = None
    status: WorkflowStatus
    graph: dict[str, Any]
    version: int
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class WorkflowListResponse(BaseModel):
    items: list[WorkflowSummary]
    total: int
    page: int
    pages: int
