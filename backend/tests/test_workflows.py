import uuid

import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import create_access_token, get_password_hash
from app.models.user import User, UserRole


@pytest.mark.asyncio
async def test_create_workflow(client: AsyncClient, auth_headers: dict):
    payload = {
        "name": "Customer Onboarding Workflow",
        "description": "Handles new customer setup",
        "graph": {
            "nodes": [
                {"id": "node_1", "type": "trigger", "data": {"config": {}}}
            ],
            "edges": [],
        },
    }
    response = await client.post("/api/v1/workflows", json=payload, headers=auth_headers)
    assert response.status_code == 201
    data = response.json()
    assert data["name"] == payload["name"]
    assert data["status"] == "draft"
    assert data["version"] == 1
    assert len(data["graph"]["nodes"]) == 1


@pytest.mark.asyncio
async def test_workflow_name_whitespace_validation(client: AsyncClient, auth_headers: dict):
    # Whitespace-only name must be rejected
    response = await client.post(
        "/api/v1/workflows",
        json={"name": "    ", "description": "Invalid"},
        headers=auth_headers,
    )
    assert response.status_code == 422


@pytest.mark.asyncio
async def test_get_workflow_by_id(client: AsyncClient, auth_headers: dict):
    create_resp = await client.post(
        "/api/v1/workflows",
        json={"name": "Fetch Test Workflow"},
        headers=auth_headers,
    )
    workflow_id = create_resp.json()["id"]

    get_resp = await client.get(f"/api/v1/workflows/{workflow_id}", headers=auth_headers)
    assert get_resp.status_code == 200
    assert get_resp.json()["id"] == workflow_id


@pytest.mark.asyncio
async def test_update_workflow_version_increment(client: AsyncClient, auth_headers: dict):
    create_resp = await client.post(
        "/api/v1/workflows",
        json={"name": "Version Test"},
        headers=auth_headers,
    )
    workflow_id = create_resp.json()["id"]
    assert create_resp.json()["version"] == 1

    # Update metadata only -> version unchanged
    upd1 = await client.put(
        f"/api/v1/workflows/{workflow_id}",
        json={"description": "Updated description"},
        headers=auth_headers,
    )
    assert upd1.status_code == 200
    assert upd1.json()["version"] == 1

    # Update graph -> version auto-increments
    upd2 = await client.put(
        f"/api/v1/workflows/{workflow_id}",
        json={"graph": {"nodes": [{"id": "n1", "type": "trigger"}], "edges": []}},
        headers=auth_headers,
    )
    assert upd2.status_code == 200
    assert upd2.json()["version"] == 2


@pytest.mark.asyncio
async def test_list_workflows_filter_and_search(client: AsyncClient, auth_headers: dict):
    # Create distinct workflows
    await client.post(
        "/api/v1/workflows",
        json={"name": "Alpha_100%_Report"},
        headers=auth_headers,
    )
    await client.post(
        "/api/v1/workflows",
        json={"name": "Beta_Processing"},
        headers=auth_headers,
    )

    # Search with SQL wildcards in input (e.g. % or _)
    resp_search = await client.get(
        "/api/v1/workflows?search=100%",
        headers=auth_headers,
    )
    assert resp_search.status_code == 200
    items = resp_search.json()["items"]
    assert any("Alpha_100%_Report" in item["name"] for item in items)


@pytest.mark.asyncio
async def test_workflow_ownership_isolation(
    client: AsyncClient, auth_headers: dict, db_session: AsyncSession
):
    # Create workflow under User 1
    create_resp = await client.post(
        "/api/v1/workflows",
        json={"name": "User1 Private Workflow"},
        headers=auth_headers,
    )
    wf_id = create_resp.json()["id"]

    # Create User 2 and get auth headers
    user2 = User(
        email=f"user2_{uuid.uuid4().hex[:6]}@example.com",
        full_name="User Two",
        hashed_password=get_password_hash("password123"),
        role=UserRole.USER,
    )
    db_session.add(user2)
    await db_session.commit()
    user2_token = create_access_token(subject=str(user2.id))
    user2_headers = {"Authorization": f"Bearer {user2_token}"}

    # User 2 attempting to view User 1's workflow
    resp_get = await client.get(f"/api/v1/workflows/{wf_id}", headers=user2_headers)
    assert resp_get.status_code == 404

    # User 2 attempting to update User 1's workflow
    resp_upd = await client.put(
        f"/api/v1/workflows/{wf_id}",
        json={"name": "Tampered Name"},
        headers=user2_headers,
    )
    assert resp_upd.status_code == 404

    # User 2 attempting to delete User 1's workflow
    resp_del = await client.delete(f"/api/v1/workflows/{wf_id}", headers=user2_headers)
    assert resp_del.status_code == 404


@pytest.mark.asyncio
async def test_admin_can_access_other_user_workflow(
    client: AsyncClient, auth_headers: dict, admin_headers: dict
):
    # Standard user creates workflow
    create_resp = await client.post(
        "/api/v1/workflows",
        json={"name": "Employee Workflow"},
        headers=auth_headers,
    )
    wf_id = create_resp.json()["id"]

    # Admin accesses the workflow
    admin_get = await client.get(f"/api/v1/workflows/{wf_id}", headers=admin_headers)
    assert admin_get.status_code == 200
    assert admin_get.json()["id"] == wf_id


@pytest.mark.asyncio
async def test_delete_workflow(client: AsyncClient, auth_headers: dict):
    create_resp = await client.post(
        "/api/v1/workflows",
        json={"name": "To Be Deleted"},
        headers=auth_headers,
    )
    wf_id = create_resp.json()["id"]

    del_resp = await client.delete(f"/api/v1/workflows/{wf_id}", headers=auth_headers)
    assert del_resp.status_code == 204

    get_again = await client.get(f"/api/v1/workflows/{wf_id}", headers=auth_headers)
    assert get_again.status_code == 404
