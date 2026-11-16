import asyncio

import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.execution import Execution, ExecutionStatus
from app.models.user import User
from app.models.workflow import Workflow, WorkflowStatus


@pytest.mark.asyncio
async def test_trigger_execution(client: AsyncClient, auth_headers: dict):
    wf_resp = await client.post(
        "/api/v1/workflows",
        json={
            "name": "Pipeline Run Test",
            "graph": {
                "nodes": [
                    {
                        "id": "node_trigger",
                        "type": "trigger",
                        "data": {"config": {"trigger_type": "manual"}},
                    }
                ],
                "edges": [],
            },
        },
        headers=auth_headers,
    )
    wf_id = wf_resp.json()["id"]

    exec_resp = await client.post(
        f"/api/v1/workflows/{wf_id}/execute",
        json={"input_data": {"user_id": 42}},
        headers=auth_headers,
    )
    assert exec_resp.status_code == 201
    data = exec_resp.json()
    assert data["workflow_id"] == wf_id
    assert data["status"] in ("pending", "running", "completed")
    await asyncio.sleep(0.2)


@pytest.mark.asyncio
async def test_list_and_get_executions(client: AsyncClient, auth_headers: dict):
    wf_resp = await client.post(
        "/api/v1/workflows",
        json={"name": "Execution List Test"},
        headers=auth_headers,
    )
    wf_id = wf_resp.json()["id"]

    exec_resp = await client.post(
        f"/api/v1/workflows/{wf_id}/execute",
        json={"input_data": {"test": True}},
        headers=auth_headers,
    )
    exec_id = exec_resp.json()["id"]
    await asyncio.sleep(0.2)

    # List executions
    list_resp = await client.get("/api/v1/executions", headers=auth_headers)
    assert list_resp.status_code == 200
    items = list_resp.json()["items"]
    assert any(item["id"] == exec_id for item in items)

    # Get single execution detail
    detail_resp = await client.get(f"/api/v1/executions/{exec_id}", headers=auth_headers)
    assert detail_resp.status_code == 200
    assert detail_resp.json()["id"] == exec_id
    assert "node_executions" in detail_resp.json()


@pytest.mark.asyncio
async def test_cancel_execution_and_terminal_state_immutability(
    client: AsyncClient, auth_headers: dict, db_session: AsyncSession, test_user: User
):
    # Setup workflow and execution directly
    wf = Workflow(
        user_id=test_user.id,
        name="Cancellation Test WF",
        status=WorkflowStatus.ACTIVE,
    )
    db_session.add(wf)
    await db_session.commit()

    # Active execution (PENDING)
    active_exec = Execution(
        workflow_id=wf.id,
        status=ExecutionStatus.PENDING,
        triggered_by="manual",
    )
    db_session.add(active_exec)
    await db_session.commit()

    cancel_resp = await client.post(
        f"/api/v1/executions/{active_exec.id}/cancel",
        headers=auth_headers,
    )
    assert cancel_resp.status_code == 200
    assert cancel_resp.json()["status"] == "cancelled"

    # Terminal state immutability: cancelling again must return 400
    repeat_cancel = await client.post(
        f"/api/v1/executions/{active_exec.id}/cancel",
        headers=auth_headers,
    )
    assert repeat_cancel.status_code == 400
    assert "terminal state" in repeat_cancel.json()["detail"].lower()


@pytest.mark.asyncio
async def test_dashboard_stats_endpoint(client: AsyncClient, auth_headers: dict):
    resp = await client.get("/api/v1/dashboard/stats", headers=auth_headers)
    assert resp.status_code == 200
    data = resp.json()
    assert "total_workflows" in data
    assert "active_workflows" in data
    assert "total_executions" in data
    assert "successful_executions" in data
    assert "failed_executions" in data
    assert "avg_execution_time_ms" in data
    assert "recent_executions" in data
    assert isinstance(data["recent_executions"], list)
