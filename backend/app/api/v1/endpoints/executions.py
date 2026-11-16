import math
import uuid
from datetime import UTC, datetime

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.api.deps import get_current_user, get_db
from app.models.execution import Execution, ExecutionStatus
from app.models.user import User, UserRole
from app.models.workflow import Workflow
from app.schemas.execution import (
    ExecutionListResponse,
    ExecutionResponse,
    ExecutionSummary,
    NodeExecutionResponse,
)

router = APIRouter(prefix="/executions", tags=["executions"])


@router.get(
    "",
    response_model=ExecutionListResponse,
    summary="List workflow executions with filtering and pagination",
)
async def list_executions(
    workflow_id: uuid.UUID | None = Query(None, description="Filter by workflow ID"),
    status: ExecutionStatus | None = Query(None, description="Filter by execution status"),
    page: int = Query(1, ge=1, description="Page number"),
    limit: int = Query(20, ge=1, le=100, description="Items per page"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> ExecutionListResponse:
    query = (
        select(Execution, Workflow.name.label("workflow_name"))
        .join(Workflow, Execution.workflow_id == Workflow.id)
    )
    count_query = select(func.count(Execution.id)).join(
        Workflow, Execution.workflow_id == Workflow.id
    )

    if current_user.role != UserRole.ADMIN:
        query = query.where(Workflow.user_id == current_user.id)
        count_query = count_query.where(Workflow.user_id == current_user.id)

    if workflow_id is not None:
        query = query.where(Execution.workflow_id == workflow_id)
        count_query = count_query.where(Execution.workflow_id == workflow_id)

    if status is not None:
        query = query.where(Execution.status == status)
        count_query = count_query.where(Execution.status == status)

    total_result = await db.execute(count_query)
    total = total_result.scalar_one() or 0

    pages = math.ceil(total / limit) if total > 0 else 1
    offset = (page - 1) * limit

    query = query.order_by(Execution.created_at.desc()).offset(offset).limit(limit)
    result = await db.execute(query)
    rows = result.all()

    items = []
    for execution, wf_name in rows:
        duration_ms = None
        if execution.started_at and execution.finished_at:
            duration_ms = int(
                (execution.finished_at - execution.started_at).total_seconds() * 1000
            )

        items.append(
            ExecutionSummary(
                id=execution.id,
                workflow_id=execution.workflow_id,
                workflow_name=wf_name,
                status=execution.status,
                triggered_by=execution.triggered_by,
                started_at=execution.started_at,
                finished_at=execution.finished_at,
                duration_ms=duration_ms,
                error=execution.error,
                created_at=execution.created_at,
            )
        )

    return ExecutionListResponse(
        items=items,
        total=total,
        page=page,
        pages=pages,
    )


@router.get(
    "/{execution_id}",
    response_model=ExecutionResponse,
    summary="Get execution details and node step logs",
)
async def get_execution(
    execution_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> ExecutionResponse:
    stmt = (
        select(Execution)
        .options(selectinload(Execution.node_executions))
        .join(Workflow, Execution.workflow_id == Workflow.id)
        .where(Execution.id == execution_id)
    )

    if current_user.role != UserRole.ADMIN:
        stmt = stmt.where(Workflow.user_id == current_user.id)

    result = await db.execute(stmt)
    execution = result.scalar_one_or_none()

    if not execution:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Execution not found",
        )

    node_resps = [
        NodeExecutionResponse.model_validate(ne)
        for ne in execution.node_executions
    ]

    return ExecutionResponse(
        id=execution.id,
        workflow_id=execution.workflow_id,
        status=execution.status,
        triggered_by=execution.triggered_by,
        input_data=execution.input_data,
        started_at=execution.started_at,
        finished_at=execution.finished_at,
        error=execution.error,
        created_at=execution.created_at,
        node_executions=node_resps,
    )


@router.post(
    "/{execution_id}/cancel",
    response_model=ExecutionResponse,
    summary="Cancel an active execution",
)
async def cancel_execution(
    execution_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> ExecutionResponse:
    stmt = (
        select(Execution)
        .options(selectinload(Execution.node_executions))
        .join(Workflow, Execution.workflow_id == Workflow.id)
        .where(Execution.id == execution_id)
    )

    if current_user.role != UserRole.ADMIN:
        stmt = stmt.where(Workflow.user_id == current_user.id)

    result = await db.execute(stmt)
    execution = result.scalar_one_or_none()

    if not execution:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Execution not found",
        )

    # Terminal State Immutability: reject updates on finished or cancelled resources
    if execution.status in (
        ExecutionStatus.COMPLETED,
        ExecutionStatus.FAILED,
        ExecutionStatus.CANCELLED,
    ):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot cancel execution in terminal state '{execution.status.value}'.",
        )

    execution.status = ExecutionStatus.CANCELLED
    execution.finished_at = datetime.now(UTC)
    await db.commit()
    await db.refresh(execution)

    node_resps = [
        NodeExecutionResponse.model_validate(ne)
        for ne in execution.node_executions
    ]

    return ExecutionResponse(
        id=execution.id,
        workflow_id=execution.workflow_id,
        status=execution.status,
        triggered_by=execution.triggered_by,
        input_data=execution.input_data,
        started_at=execution.started_at,
        finished_at=execution.finished_at,
        error=execution.error,
        created_at=execution.created_at,
        node_executions=node_resps,
    )
