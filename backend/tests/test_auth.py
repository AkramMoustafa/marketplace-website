import pytest
from httpx import AsyncClient

pytestmark = pytest.mark.asyncio


async def test_register(client: AsyncClient):
    resp = await client.post("/api/auth/register", json={
        "name": "Test User", "email": "new@test.com", "password": "Secret123!"
    })
    assert resp.status_code == 201
    data = resp.json()
    assert data["email"] == "new@test.com"
    assert data["role"] == "customer"


async def test_register_duplicate(client: AsyncClient):
    payload = {"name": "Dup", "email": "dup@test.com", "password": "Secret123!"}
    await client.post("/api/auth/register", json=payload)
    resp = await client.post("/api/auth/register", json=payload)
    assert resp.status_code == 409


async def test_login(client: AsyncClient):
    await client.post("/api/auth/register", json={
        "name": "Login User", "email": "login@test.com", "password": "Secret123!"
    })
    resp = await client.post("/api/auth/login", data={"username": "login@test.com", "password": "Secret123!"})
    assert resp.status_code == 200
    assert "access_token" in resp.json()


async def test_login_wrong_password(client: AsyncClient):
    await client.post("/api/auth/register", json={
        "name": "WP", "email": "wp@test.com", "password": "Correct123!"
    })
    resp = await client.post("/api/auth/login", data={"username": "wp@test.com", "password": "Wrong"})
    assert resp.status_code == 401


async def test_me(client: AsyncClient, user_token: str):
    resp = await client.get("/api/auth/me", headers={"Authorization": f"Bearer {user_token}"})
    assert resp.status_code == 200
    assert "email" in resp.json()


async def test_me_unauthenticated(client: AsyncClient):
    resp = await client.get("/api/auth/me")
    assert resp.status_code == 401
