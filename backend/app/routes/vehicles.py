import re
import time
import uuid
from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel, field_validator
from sqlalchemy import or_, select
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.session import get_db
from app.models.vehicle import Vehicle, TransmissionType, FuelType, VehicleStatus
from app.models.contact import ContactMessage
from app.schemas.vehicle import VehicleOut, VehicleListOut, VehicleSearchOut, VehicleFilters
from app.schemas.contact import ContactMessageOut
from app.services import vehicle_service
from app.utils.pagination import PaginationParams, PaginatedResponse, pagination_params
from decimal import Decimal


class VehicleInquiryCreate(BaseModel):
    name: str
    email: str
    phone: str | None = None
    message: str

    @field_validator("name")
    @classmethod
    def name_not_empty(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("Name is required")
        return v.strip()

    @field_validator("email")
    @classmethod
    def email_valid(cls, v: str) -> str:
        if not v.strip() or "@" not in v:
            raise ValueError("A valid email address is required")
        return v.strip().lower()

    @field_validator("message")
    @classmethod
    def message_not_empty(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("Message is required")
        return v.strip()

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


@router.get("/search", response_model=list[VehicleSearchOut])
async def search_vehicles(
    q: str = Query(""),
    limit: int = Query(10, le=20),
    db: AsyncSession = Depends(get_db),
):
    """
    Typeahead search across make / model / title.
    Also matches by year when the query contains a 4-digit year (e.g. "2022 BMW").
    Returns only non-sold vehicles, newest first.
    """
    q = q.strip()
    if not q:
        return []

    term = f"%{q}%"
    conditions = [
        Vehicle.make.ilike(term),
        Vehicle.model.ilike(term),
        Vehicle.title.ilike(term),
    ]

    # Optional year match when query contains a 4-digit year
    year_match = re.search(r"\b(19|20)\d{2}\b", q)
    if year_match:
        conditions.append(Vehicle.year == int(year_match.group()))

    result = await db.execute(
        select(Vehicle)
        .where(or_(*conditions))
        .where(Vehicle.status != VehicleStatus.sold)
        .order_by(Vehicle.year.desc(), Vehicle.make.asc())
        .limit(limit)
    )
    vehicles = result.scalars().all()
    return [VehicleSearchOut.model_validate(v) for v in vehicles]


@router.get("/{vehicle_id}", response_model=VehicleOut)
async def get_vehicle(vehicle_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    t0 = time.perf_counter()
    vehicle = await vehicle_service.get_vehicle(db, vehicle_id)
    print(f"/api/vehicles/{vehicle_id}: {(time.perf_counter()-t0)*1000:.1f}ms")
    return VehicleOut.model_validate(vehicle)


@router.get("/{vehicle_id}/similar", response_model=list[VehicleListOut])
async def get_similar_vehicles(
    vehicle_id: uuid.UUID,
    limit: int = Query(4, le=8),
    db: AsyncSession = Depends(get_db),
):
    """Return available vehicles similar to the given one (same make first, then others)."""
    from sqlalchemy import not_
    vehicle = await vehicle_service.get_vehicle(db, vehicle_id)

    same_make = (await db.execute(
        select(Vehicle)
        .where(
            Vehicle.id != vehicle_id,
            Vehicle.make.ilike(vehicle.make),
            Vehicle.status == VehicleStatus.available,
        )
        .order_by(Vehicle.featured.desc(), Vehicle.created_at.desc())
        .limit(limit)
    )).scalars().all()

    results = list(same_make)
    if len(results) < limit:
        exclude_ids = [vehicle_id] + [v.id for v in results]
        filler = (await db.execute(
            select(Vehicle)
            .where(
                not_(Vehicle.id.in_(exclude_ids)),
                Vehicle.status == VehicleStatus.available,
            )
            .order_by(Vehicle.featured.desc(), Vehicle.created_at.desc())
            .limit(limit - len(results))
        )).scalars().all()
        results += list(filler)

    return [VehicleListOut.model_validate(v) for v in results]


@router.post("/{vehicle_id}/inquiry", response_model=ContactMessageOut, status_code=status.HTTP_201_CREATED)
async def submit_vehicle_inquiry(
    vehicle_id: uuid.UUID,
    data: VehicleInquiryCreate,
    db: AsyncSession = Depends(get_db),
):
    """Public endpoint — no auth required. Stores a dealer inquiry for a specific vehicle."""
    vehicle = await vehicle_service.get_vehicle(db, vehicle_id)
    subject = f"Vehicle Inquiry – {vehicle.title}"
    msg = ContactMessage(
        name=data.name,
        email=data.email,
        phone=data.phone,
        subject=subject,
        message=data.message,
    )
    db.add(msg)
    await db.flush()
    await db.refresh(msg)
    return ContactMessageOut.model_validate(msg)