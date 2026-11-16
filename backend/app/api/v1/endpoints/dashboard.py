
from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, get_db
from app.models.execution import Execution, ExecutionStatus
from app.models.user import User, UserRole
from app.models.workflow import Workflow, WorkflowStatus
from app.schemas.execution import DashboardStatsResponse, ExecutionSummary

router = APIRouter(prefix="/dashboard", tags=["dashboard"])


@router.get(
    "/stats",
    response_model=DashboardStatsResponse,
    summary="Get aggregated dashboard metrics and execution health",
)
async def get_dashboard_stats(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> DashboardStatsResponse:
    # 1. Total and Active workflows (role-scoped)
    wf_query = select(Workflow.id, Workflow.status)
    if current_user.role != UserRole.ADMIN:
        wf_query = wf_query.where(Workflow.user_id == current_user.id)

    wf_res = await db.execute(wf_query)
    wf_rows = wf_res.all()
    total_workflows = len(wf_rows)
    active_workflows = sum(1 for row in wf_rows if row.status == WorkflowStatus.ACTIVE)

    # 2. Executions metrics (role-scoped)
    exec_base = select(Execution, Workflow.name.label("workflow_name")).join(
        Workflow, Execution.workflow_id == Workflow.id
    )
    if current_user.role != UserRole.ADMIN:
        exec_base = exec_base.where(Workflow.user_id == current_user.id)

    exec_res = await db.execute(exec_base.order_by(Execution.created_at.desc()))
    exec_rows = exec_res.all()

    total_executions = len(exec_rows)
    successful_executions = sum(
        1 for ex, _ in exec_rows if ex.status == ExecutionStatus.COMPLETED
    )
    failed_executions = sum(
        1 for ex, _ in exec_rows if ex.status == ExecutionStatus.FAILED
    )

    # Calculate average execution time in ms for completed runs
    durations = []
    for ex, _ in exec_rows:
        if ex.status == ExecutionStatus.COMPLETED and ex.started_at and ex.finished_at:
            ms = (ex.finished_at - ex.started_at).total_seconds() * 1000
            durations.append(ms)

    avg_execution_time_ms = round(sum(durations) / len(durations), 2) if durations else 0.0

    # 3. Last 10 recent executions
    recent_executions: list[ExecutionSummary] = []
    for ex, wf_name in exec_rows[:10]:
        dur_ms = None
        if ex.started_at and ex.finished_at:
            dur_ms = int((ex.finished_at - ex.started_at).total_seconds() * 1000)

        recent_executions.append(
            ExecutionSummary(
                id=ex.id,
                workflow_id=ex.workflow_id,
                workflow_name=wf_name,
                status=ex.status,
                triggered_by=ex.triggered_by,
                started_at=ex.started_at,
                finished_at=ex.finished_at,
                duration_ms=dur_ms,
                error=ex.error,
                created_at=ex.created_at,
            )
        )

    return DashboardStatsResponse(
        total_workflows=total_workflows,
        active_workflows=active_workflows,
        total_executions=total_executions,
        successful_executions=successful_executions,
        failed_executions=failed_executions,
        avg_execution_time_ms=avg_execution_time_ms,
        recent_executions=recent_executions,
    )
