import time
import uuid
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.session import get_db
from app.schemas.vehicle import VehicleOut, VehicleListOut, VehicleFilters
from app.services import vehicle_service
from app.utils.pagination import PaginationParams, PaginatedResponse, pagination_params
from app.models.vehicle import TransmissionType, FuelType, VehicleStatus
from decimal import Decimal

router = APIRouter(prefix="/api/vehicles", tags=["Vehicles"])

_featured_cache: dict = {"data": None, "expires": 0.0, "limit": 0}
_FEATURED_TTL = 60.0


@router.get("", response_model=PaginatedResponse)
async def list_vehicles(
    make: str | None = Query(None),
    model: str | None = Query(None),
    year_min: int | None = Query(None),
    year_max: int | None = Query(None),
    price_min: Decimal | None = Query(None),
    price_max: Decimal | None = Query(None),
    mileage_max: int | None = Query(None),
    transmission: TransmissionType | None = Query(None),
    fuel_type: FuelType | None = Query(None),
    status: VehicleStatus | None = Query(None),
    featured: bool | None = Query(None),
    search: str | None = Query(None),
    pagination: PaginationParams = Depends(pagination_params),
    db: AsyncSession = Depends(get_db),
):
    t0 = time.perf_counter()
    filters = VehicleFilters(
        make=make, model=model, year_min=year_min, year_max=year_max,
        price_min=price_min, price_max=price_max, mileage_max=mileage_max,
        transmission=transmission, fuel_type=fuel_type, status=status,
        featured=featured, search=search,
    )
    vehicles, total = await vehicle_service.list_vehicles(db, filters, pagination.offset, pagination.page_size)
    result = PaginatedResponse.build(
        items=[VehicleListOut.model_validate(v) for v in vehicles],
        total=total, page=pagination.page, page_size=pagination.page_size,
    )
    print(f"/api/vehicles: {(time.perf_counter()-t0)*1000:.1f}ms (page={pagination.page}, size={pagination.page_size})")
    return result


@router.get("/featured", response_model=list[VehicleListOut])
async def featured_vehicles(limit: int = Query(6, le=12), db: AsyncSession = Depends(get_db)):
    now = time.monotonic()
    if (
        _featured_cache["data"] is not None
        and now < _featured_cache["expires"]
        and _featured_cache["limit"] == limit
    ):
        print(f"/api/vehicles/featured: cache hit (limit={limit})")
        return _featured_cache["data"]

    t0 = time.perf_counter()
    vehicles = await vehicle_service.get_featured_vehicles(db, limit)
    result = [VehicleListOut.model_validate(v) for v in vehicles]
    print(f"/api/vehicles/featured: {(time.perf_counter()-t0)*1000:.1f}ms (cached for {_FEATURED_TTL:.0f}s)")

    _featured_cache["data"] = result
    _featured_cache["expires"] = now + _FEATURED_TTL
    _featured_cache["limit"] = limit
    return result


@router.get("/{vehicle_id}", response_model=VehicleOut)
async def get_vehicle(vehicle_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    print("🔥 DETAIL ROUTE ENTERED 🔥")

    

    t0 = time.perf_counter()

    vehicle = await vehicle_service.get_vehicle(db, vehicle_id)

    print("====== VEHICLE API DEBUG ======")
    print("id:", vehicle.id)
    print("title:", vehicle.title)
    print("stock_number:", vehicle.stock_number)
    print("engine:", vehicle.engine)
    print("drive:", vehicle.drive)
    print("fuel_economy:", vehicle.fuel_economy)
    print("features:", vehicle.features)
    print("===============================")

    print(f"/api/vehicles/{vehicle_id}: {(time.perf_counter()-t0)*1000:.1f}ms")

    response = VehicleOut.model_validate(vehicle)

    print("====== SERIALIZED RESPONSE ======")
    print(response.model_dump())
    print("=================================")

    return response