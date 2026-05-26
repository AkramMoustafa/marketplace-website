import pytest
from httpx import AsyncClient

pytestmark = pytest.mark.asyncio

ADMIN_HEADERS = {"x-admin-auth": "true"}

VEHICLE_PAYLOAD = {
    "title": "2023 BMW M3",
    "make": "BMW", "model": "M3", "year": 2023,
    "mileage": 5000, "price": "89500.00",
    "transmission": "automatic", "fuel_type": "gasoline",
    "vin": "WBS8M9C52P5A12345",
    "description": "Test vehicle", "featured": True,
}


async def test_list_vehicles_empty(client: AsyncClient):
    resp = await client.get("/api/vehicles")
    assert resp.status_code == 200
    data = resp.json()
    assert "items" in data
    assert "total" in data


async def test_create_vehicle_as_admin(client: AsyncClient):
    resp = await client.post(
        "/api/admin/vehicles",
        json=VEHICLE_PAYLOAD,
        headers=ADMIN_HEADERS,
    )
    assert resp.status_code == 201
    data = resp.json()
    assert data["vin"] == "WBS8M9C52P5A12345"
    return data["id"]


async def test_create_vehicle_without_auth(client: AsyncClient):
    resp = await client.post(
        "/api/admin/vehicles",
        json=VEHICLE_PAYLOAD,
    )
    assert resp.status_code == 401


async def test_get_vehicle(client: AsyncClient):
    create_resp = await client.post(
        "/api/admin/vehicles",
        json={**VEHICLE_PAYLOAD, "vin": "WBS8M9C52P5A99999"},
        headers=ADMIN_HEADERS,
    )
    vehicle_id = create_resp.json()["id"]
    resp = await client.get(f"/api/vehicles/{vehicle_id}")
    assert resp.status_code == 200
    assert resp.json()["id"] == vehicle_id


async def test_update_vehicle(client: AsyncClient):
    create_resp = await client.post(
        "/api/admin/vehicles",
        json={**VEHICLE_PAYLOAD, "vin": "WBS8M9C52P5A77777"},
        headers=ADMIN_HEADERS,
    )
    vehicle_id = create_resp.json()["id"]
    resp = await client.put(
        f"/api/admin/vehicles/{vehicle_id}",
        json={"price": "95000.00", "featured": False},
        headers=ADMIN_HEADERS,
    )
    assert resp.status_code == 200
    assert float(resp.json()["price"]) == 95000.0


async def test_featured_vehicles(client: AsyncClient):
    resp = await client.get("/api/vehicles/featured")
    assert resp.status_code == 200
    assert isinstance(resp.json(), list)
