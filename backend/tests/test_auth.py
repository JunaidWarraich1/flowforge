import pytest
from httpx import AsyncClient

from app.models.user import User


@pytest.mark.asyncio
async def test_user_registration_success(client: AsyncClient):
    payload = {
        "email": "newuser@example.com",
        "full_name": "New User",
        "password": "validpassword123",
    }
    response = await client.post("/api/v1/auth/register", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert data["email"] == "newuser@example.com"
    assert data["full_name"] == "New User"
    assert data["role"] == "user"
    assert "password" not in data


@pytest.mark.asyncio
async def test_registration_forces_user_role(client: AsyncClient):
    payload = {
        "email": "escalation_attempt@example.com",
        "full_name": "Escalation Attempt",
        "password": "securepassword123",
        "role": "admin",
    }
    response = await client.post("/api/v1/auth/register", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert data["role"] == "user"


@pytest.mark.asyncio
async def test_registration_duplicate_email_fails(client: AsyncClient, test_user: User):
    payload = {
        "email": test_user.email,
        "full_name": "Duplicate User",
        "password": "password123",
    }
    response = await client.post("/api/v1/auth/register", json=payload)
    assert response.status_code == 400
    assert "already exists" in response.json()["detail"]


@pytest.mark.asyncio
async def test_registration_password_length_validation(client: AsyncClient):
    # Short password (< 6 chars)
    resp_short = await client.post(
        "/api/v1/auth/register",
        json={"email": "short@example.com", "full_name": "Short", "password": "123"},
    )
    assert resp_short.status_code == 422

    # Long password (> 72 chars)
    resp_long = await client.post(
        "/api/v1/auth/register",
        json={
            "email": "long@example.com",
            "full_name": "Long",
            "password": "a" * 73,
        },
    )
    assert resp_long.status_code == 422


@pytest.mark.asyncio
async def test_login_success(client: AsyncClient, test_user: User):
    payload = {"username": test_user.email, "password": "password123"}
    response = await client.post("/api/v1/auth/login", data=payload)
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert "refresh_token" in data
    assert data["token_type"] == "bearer"


@pytest.mark.asyncio
async def test_login_incorrect_password(client: AsyncClient, test_user: User):
    payload = {"username": test_user.email, "password": "wrongpassword"}
    response = await client.post("/api/v1/auth/login", data=payload)
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_login_nonexistent_user(client: AsyncClient):
    payload = {"username": "nonexistent@example.com", "password": "password123"}
    response = await client.post("/api/v1/auth/login", data=payload)
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_get_current_user_profile(client: AsyncClient, auth_headers: dict, test_user: User):
    response = await client.get("/api/v1/auth/me", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert data["email"] == test_user.email
    assert data["id"] == str(test_user.id)


@pytest.mark.asyncio
async def test_get_current_user_unauthorized(client: AsyncClient):
    response = await client.get("/api/v1/auth/me")
    assert response.status_code == 401
