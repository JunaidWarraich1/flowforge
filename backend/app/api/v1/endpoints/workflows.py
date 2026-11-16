import asyncio
import math
import uuid

from fastapi import APIRouter, Depends, HTTPException, Query, Response, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, get_db
from app.models.execution import Execution, ExecutionStatus
from app.models.user import User, UserRole
from app.models.workflow import Workflow, WorkflowStatus
from app.schemas.execution import ExecutionCreate, ExecutionResponse
from app.schemas.workflow import (
    WorkflowCreate,
    WorkflowListResponse,
    WorkflowResponse,
    WorkflowSummary,
    WorkflowUpdate,
)
from app.services.engine.executor import WorkflowExecutor

router = APIRouter(prefix="/workflows", tags=["workflows"])


def escape_like_expression(term: str) -> str:
    """Safely escape SQL LIKE wildcards."""
    return (
        term.replace("\\", "\\\\")
        .replace("%", "\\%")
        .replace("_", "\\_")
    )


@router.get(
    "",
    response_model=WorkflowListResponse,
    summary="List workflows with filtering and pagination",
)
async def list_workflows(
    status: WorkflowStatus | None = Query(None, description="Filter by workflow status"),
    search: str | None = Query(None, description="Search workflow name"),
    page: int = Query(1, ge=1, description="Page number"),
    limit: int = Query(20, ge=1, le=100, description="Items per page"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> WorkflowListResponse:
    query = select(Workflow)
    count_query = select(func.count(Workflow.id))

    # User isolation: regular users only see their workflows
    if current_user.role != UserRole.ADMIN:
        query = query.where(Workflow.user_id == current_user.id)
        count_query = count_query.where(Workflow.user_id == current_user.id)

    if status is not None:
        query = query.where(Workflow.status == status)
        count_query = count_query.where(Workflow.status == status)

    if search:
        escaped_search = escape_like_expression(search.strip())
        query = query.where(Workflow.name.ilike(f"%{escaped_search}%", escape="\\"))
        count_query = count_query.where(Workflow.name.ilike(f"%{escaped_search}%", escape="\\"))

    total_result = await db.execute(count_query)
    total = total_result.scalar_one() or 0

    pages = math.ceil(total / limit) if total > 0 else 1
    offset = (page - 1) * limit

    query = query.order_by(Workflow.updated_at.desc()).offset(offset).limit(limit)
    result = await db.execute(query)
    workflows = result.scalars().all()

    items = []
    for wf in workflows:
        nodes = (wf.graph or {}).get("nodes", []) if isinstance(wf.graph, dict) else []
        node_count = len(nodes)
        items.append(
            WorkflowSummary(
                id=wf.id,
                name=wf.name,
                description=wf.description,
                status=wf.status,
                version=wf.version,
                created_at=wf.created_at,
                updated_at=wf.updated_at,
                node_count=node_count,
            )
        )

    return WorkflowListResponse(
        items=items,
        total=total,
        page=page,
        pages=pages,
    )


@router.post(
    "",
    response_model=WorkflowResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new workflow",
)
async def create_workflow(
    workflow_in: WorkflowCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> Workflow:
    workflow = Workflow(
        user_id=current_user.id,
        name=workflow_in.name,
        description=workflow_in.description,
        graph=workflow_in.graph or {"nodes": [], "edges": []},
        status=WorkflowStatus.DRAFT,
        version=1,
    )
    db.add(workflow)
    await db.commit()
    await db.refresh(workflow)
    return workflow


@router.get(
    "/{workflow_id}",
    response_model=WorkflowResponse,
    summary="Get workflow details including graph canvas",
)
async def get_workflow(
    workflow_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> Workflow:
    stmt = select(Workflow).where(Workflow.id == workflow_id)
    if current_user.role != UserRole.ADMIN:
        stmt = stmt.where(Workflow.user_id == current_user.id)

    result = await db.execute(stmt)
    workflow = result.scalar_one_or_none()

    if not workflow:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Workflow not found",
        )
    return workflow


@router.put(
    "/{workflow_id}",
    response_model=WorkflowResponse,
    summary="Update workflow metadata or graph",
)
async def update_workflow(
    workflow_id: uuid.UUID,
    workflow_in: WorkflowUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> Workflow:
    stmt = select(Workflow).where(Workflow.id == workflow_id)
    if current_user.role != UserRole.ADMIN:
        stmt = stmt.where(Workflow.user_id == current_user.id)

    result = await db.execute(stmt)
    workflow = result.scalar_one_or_none()

    if not workflow:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Workflow not found",
        )

    if workflow_in.name is not None:
        workflow.name = workflow_in.name

    if workflow_in.description is not None:
        workflow.description = workflow_in.description

    if workflow_in.status is not None:
        workflow.status = workflow_in.status

    if workflow_in.graph is not None:
        workflow.graph = workflow_in.graph
        workflow.version += 1

    await db.commit()
    await db.refresh(workflow)
    return workflow


@router.delete(
    "/{workflow_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete a workflow and all associated executions",
)
async def delete_workflow(
    workflow_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> Response:
    stmt = select(Workflow).where(Workflow.id == workflow_id)
    if current_user.role != UserRole.ADMIN:
        stmt = stmt.where(Workflow.user_id == current_user.id)

    result = await db.execute(stmt)
    workflow = result.scalar_one_or_none()

    if not workflow:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Workflow not found",
        )

    await db.delete(workflow)
    await db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.post(
    "/{workflow_id}/execute",
    response_model=ExecutionResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Trigger execution of a workflow",
)
async def execute_workflow(
    workflow_id: uuid.UUID,
    exec_in: ExecutionCreate | None = None,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> Execution:
    stmt = select(Workflow).where(Workflow.id == workflow_id)
    if current_user.role != UserRole.ADMIN:
        stmt = stmt.where(Workflow.user_id == current_user.id)

    result = await db.execute(stmt)
    workflow = result.scalar_one_or_none()

    if not workflow:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Workflow not found",
        )

    input_payload = exec_in.input_data if exec_in else {}

    execution = Execution(
        workflow_id=workflow.id,
        status=ExecutionStatus.PENDING,
        triggered_by="manual",
        input_data=input_payload,
    )
    db.add(execution)
    await db.commit()
    await db.refresh(execution)

    # Launch execution asynchronously in background
    executor = WorkflowExecutor(execution_id=execution.id)
    asyncio.create_task(executor.run())

    # Return initial execution state
    return execution
