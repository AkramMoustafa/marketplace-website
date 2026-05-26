import pytest
from httpx import AsyncClient

pytestmark = pytest.mark.asyncio

ADMIN_HEADERS = {"x-admin-auth": "true"}


async def test_dashboard_admin(client: AsyncClient):
    resp = await client.get("/api/admin/dashboard", headers=ADMIN_HEADERS)
    assert resp.status_code == 200
    data = resp.json()
    assert "vehicles" in data
    assert "users" in data
    assert "financing" in data


async def test_dashboard_requires_auth(client: AsyncClient):
    resp = await client.get("/api/admin/dashboard")
    assert resp.status_code == 401


async def test_list_users(client: AsyncClient):
    resp = await client.get("/api/admin/users", headers=ADMIN_HEADERS)
    assert resp.status_code == 200
    assert "items" in resp.json()


async def test_admin_setup_and_login(client: AsyncClient):
    # Status should reflect whether admin is configured
    status_resp = await client.get("/api/admin/status")
    assert status_resp.status_code == 200

    # Setup (may already be configured from a prior test run)
    setup_resp = await client.post("/api/admin/setup", json={"password": "TestAdmin123!"})
    assert setup_resp.status_code in (200, 400)

    # Login with correct password (only if setup succeeded)
    if setup_resp.status_code == 200:
        login_resp = await client.post("/api/admin/login", json={"password": "TestAdmin123!"})
        assert login_resp.status_code == 200
        assert login_resp.json()["success"] is True

        wrong_resp = await client.post("/api/admin/login", json={"password": "wrongpass"})
        assert wrong_resp.status_code == 401


async def test_financing_flow(client: AsyncClient, user_token: str):
    payload = {
        "phone": "555-1234", "address": "123 Main St",
        "annual_income": "75000.00", "employment_status": "employed",
        "credit_score_range": "700-749", "down_payment": "5000.00",
    }
    create_resp = await client.post(
        "/api/financing", json=payload, headers={"Authorization": f"Bearer {user_token}"}
    )
    assert create_resp.status_code == 201
    req_id = create_resp.json()["id"]

    patch_resp = await client.patch(
        f"/api/admin/financing/{req_id}",
        json={"status": "approved", "admin_notes": "Looks good"},
        headers=ADMIN_HEADERS,
    )
    assert patch_resp.status_code == 200
    assert patch_resp.json()["status"] == "approved"


async def test_review_moderation(client: AsyncClient, user_token: str):
    create_resp = await client.post(
        "/api/reviews",
        json={"rating": 5, "title": "Great car!", "body": "Really loved the experience."},
        headers={"Authorization": f"Bearer {user_token}"},
    )
    assert create_resp.status_code == 201
    review_id = create_resp.json()["id"]
    assert create_resp.json()["status"] == "pending"

    public_resp = await client.get("/api/reviews")
    ids = [r["id"] for r in public_resp.json()["items"]]
    assert review_id not in ids

    approve_resp = await client.patch(
        f"/api/admin/reviews/{review_id}",
        json={"status": "approved"},
        headers=ADMIN_HEADERS,
    )
    assert approve_resp.status_code == 200

    public_resp2 = await client.get("/api/reviews")
    ids2 = [r["id"] for r in public_resp2.json()["items"]]
    assert review_id in ids2
