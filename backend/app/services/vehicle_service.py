import time
import uuid
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, or_, and_
from fastapi import HTTPException, status
from app.models.vehicle import Vehicle, VehicleStatus
from app.schemas.vehicle import VehicleCreate, VehicleUpdate, VehicleFilters


async def create_vehicle(db: AsyncSession, data: VehicleCreate, created_by: uuid.UUID | None) -> Vehicle:
    vin_exists = await db.execute(select(Vehicle).where(Vehicle.vin == data.vin))
    if vin_exists.scalar_one_or_none():
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="VIN already exists")
    vehicle = Vehicle(**data.model_dump(), created_by=created_by, images=[])
    db.add(vehicle)
    await db.flush()
    await db.refresh(vehicle)
    return vehicle


async def get_vehicle(db: AsyncSession, vehicle_id: uuid.UUID) -> Vehicle:
    result = await db.execute(
        select(Vehicle).where(Vehicle.id == vehicle_id)
    )

    vehicle = result.scalar_one_or_none()

    if not vehicle:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Vehicle not found"
        )

    print("=== VEHICLE DEBUG ===")
    print("stock_number:", vehicle.stock_number)
    print("engine:", vehicle.engine)
    print("drive:", vehicle.drive)
    print("fuel_economy:", vehicle.fuel_economy)
    print("features:", vehicle.features)

    return vehicle


async def list_vehicles(
    db: AsyncSession,
    filters: VehicleFilters,
    skip: int = 0,
    limit: int = 20,
) -> tuple[list[Vehicle], int]:
    query = select(Vehicle)
    conditions = []

    if filters.make:
        conditions.append(Vehicle.make.ilike(f"%{filters.make}%"))
    if filters.model:
        conditions.append(Vehicle.model.ilike(f"%{filters.model}%"))
    if filters.year_min:
        conditions.append(Vehicle.year >= filters.year_min)
    if filters.year_max:
        conditions.append(Vehicle.year <= filters.year_max)
    if filters.price_min is not None:
        conditions.append(Vehicle.price >= filters.price_min)
    if filters.price_max is not None:
        conditions.append(Vehicle.price <= filters.price_max)
    if filters.mileage_max is not None:
        conditions.append(Vehicle.mileage <= filters.mileage_max)
    if filters.transmission:
        conditions.append(Vehicle.transmission == filters.transmission)
    if filters.fuel_type:
        conditions.append(Vehicle.fuel_type == filters.fuel_type)
    if filters.status:
        conditions.append(Vehicle.status == filters.status)
    if filters.featured is not None:
        conditions.append(Vehicle.featured == filters.featured)
    if filters.search:
        term = f"%{filters.search}%"
        conditions.append(
            or_(
                Vehicle.title.ilike(term),
                Vehicle.make.ilike(term),
                Vehicle.model.ilike(term),
                Vehicle.description.ilike(term),
            )
        )

    if conditions:
        query = query.where(and_(*conditions))

    t0 = time.perf_counter()
    count_query = select(func.count()).select_from(query.subquery())
    total_result = await db.execute(count_query)
    total = total_result.scalar_one()
    print(f"  list_vehicles count query: {(time.perf_counter()-t0)*1000:.1f}ms, total={total}")

    t1 = time.perf_counter()
    result = await db.execute(
        query.order_by(Vehicle.featured.desc(), Vehicle.created_at.desc()).offset(skip).limit(limit)
    )
    rows = result.scalars().all()
    print(f"  list_vehicles data query: {(time.perf_counter()-t1)*1000:.1f}ms, returned={len(rows)}")
    return rows, total


async def update_vehicle(db: AsyncSession, vehicle: Vehicle, data: VehicleUpdate) -> Vehicle:
    for field, value in data.model_dump(exclude_none=True).items():
        setattr(vehicle, field, value)
    await db.flush()
    await db.refresh(vehicle)
    return vehicle


async def add_vehicle_image(db: AsyncSession, vehicle: Vehicle, url: str) -> Vehicle:
    images = list(vehicle.images or [])
    images.append(url)
    vehicle.images = images
    await db.flush()
    await db.refresh(vehicle)
    return vehicle


async def remove_vehicle_image(db: AsyncSession, vehicle: Vehicle, url: str) -> Vehicle:
    images = [img for img in (vehicle.images or []) if img != url]
    vehicle.images = images
    await db.flush()
    await db.refresh(vehicle)
    return vehicle


async def delete_vehicle(db: AsyncSession, vehicle: Vehicle) -> None:
    await db.delete(vehicle)
    await db.flush()


async def get_featured_vehicles(db: AsyncSession, limit: int = 6) -> list[Vehicle]:
    t0 = time.perf_counter()
    result = await db.execute(
        select(Vehicle)
        .where(Vehicle.featured == True, Vehicle.status == VehicleStatus.available)
        .order_by(Vehicle.created_at.desc())
        .limit(limit)
    )
    rows = result.scalars().all()
    print(f"  get_featured_vehicles query: {(time.perf_counter()-t0)*1000:.1f}ms, returned={len(rows)}")
    return rows
