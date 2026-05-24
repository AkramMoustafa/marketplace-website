import asyncio
import json
import os
import time
import uuid
from fastapi import APIRouter, Depends, UploadFile, File, status, HTTPException, Query, Header
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, case
from app.db.session import get_db, AsyncSessionLocal
from app.models.vehicle import Vehicle, VehicleStatus
from app.models.financing import FinancingRequest, FinancingStatus
from app.models.tradein import TradeIn, TradeInStatus
from app.models.appointment import ServiceAppointment, AppointmentStatus
from app.models.review import Review, ReviewStatus
from app.schemas.vehicle import (
    VehicleCreate, VehicleUpdate, VehicleOut,
    VehicleAIPreviewRequest, VehicleAIPreviewResponse,
    VehicleAIImageAnalysisResponse,
)
from app.schemas.user import UserOut, UserAdminUpdate
from app.schemas.financing import FinancingRequestOut, FinancingRequestUpdate
from app.schemas.tradein import TradeInOut, TradeInUpdate
from app.schemas.appointment import AppointmentOut, AppointmentUpdate
from app.schemas.review import ReviewOut, ReviewUpdate
from app.services import (
    vehicle_service, user_service, financing_service,
    tradein_service, appointment_service, review_service,
)
from app.utils.pagination import PaginationParams, PaginatedResponse, pagination_params
from app.utils.file_upload import save_upload, delete_upload
from app.auth.password import hash_password, verify_password

router = APIRouter(prefix="/api/admin", tags=["Admin"])

_CONFIG_FILE = os.path.join(os.path.dirname(__file__), "..", "..", "..", "admin_config.json")
_CONFIG_FILE = os.path.normpath(_CONFIG_FILE)


def _read_config() -> dict:
    try:
        with open(_CONFIG_FILE, "r") as f:
            return json.load(f)
    except (FileNotFoundError, json.JSONDecodeError):
        return {}


def _write_config(config: dict) -> None:
    with open(_CONFIG_FILE, "w") as f:
        json.dump(config, f)


class AdminPasswordBody(BaseModel):
    password: str


class ImageReorderBody(BaseModel):
    images: list[str]


async def verify_admin_header(x_admin_auth: str | None = Header(default=None)) -> None:
    if x_admin_auth != "true":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Admin authentication required",
        )


# ── Setup / Login / Status (no auth) ──────────────────────────────────────────

@router.get("/status")
async def admin_status():
    config = _read_config()
    return {"configured": bool(config.get("hashed_password"))}


@router.post("/setup")
async def admin_setup(body: AdminPasswordBody):
    if not body.password:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Password required")
    config = _read_config()
    if config.get("hashed_password"):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Admin already configured")
    config["hashed_password"] = hash_password(body.password)
    _write_config(config)
    return {"success": True}


@router.post("/login")
async def admin_login(body: AdminPasswordBody):
    config = _read_config()
    hashed = config.get("hashed_password")
    if not hashed or not verify_password(body.password, hashed):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid password")
    return {"success": True}


# ── Dashboard helpers (each uses its own session so asyncio.gather runs them concurrently) ──

async def _dashboard_vehicle_stats() -> dict:
    async with AsyncSessionLocal() as s:
        t0 = time.perf_counter()
        row = (await s.execute(
            select(
                func.count().label("total"),
                func.sum(case((Vehicle.status == VehicleStatus.available, 1), else_=0)).label("available"),
                func.sum(case((Vehicle.status == VehicleStatus.sold, 1), else_=0)).label("sold"),
            ).select_from(Vehicle)
        )).one()
        print(f"  vehicle stats query: {(time.perf_counter()-t0)*1000:.1f}ms")
        return {"total": row.total or 0, "available": row.available or 0, "sold": row.sold or 0}


async def _dashboard_user_count() -> int:
    from app.models.user import User
    async with AsyncSessionLocal() as s:
        t0 = time.perf_counter()
        n = (await s.execute(select(func.count()).select_from(User))).scalar_one()
        print(f"  user count query: {(time.perf_counter()-t0)*1000:.1f}ms")
        return n


async def _dashboard_financing_stats() -> dict:
    async with AsyncSessionLocal() as s:
        t0 = time.perf_counter()
        row = (await s.execute(
            select(
                func.count().label("total"),
                func.sum(case((FinancingRequest.status == FinancingStatus.pending, 1), else_=0)).label("pending"),
            ).select_from(FinancingRequest)
        )).one()
        print(f"  financing stats query: {(time.perf_counter()-t0)*1000:.1f}ms")
        return {"total": row.total or 0, "pending": row.pending or 0}


async def _dashboard_tradein_count() -> int:
    async with AsyncSessionLocal() as s:
        t0 = time.perf_counter()
        n = (await s.execute(select(func.count()).select_from(TradeIn))).scalar_one()
        print(f"  tradein count query: {(time.perf_counter()-t0)*1000:.1f}ms")
        return n


async def _dashboard_appointment_count() -> int:
    async with AsyncSessionLocal() as s:
        t0 = time.perf_counter()
        n = (await s.execute(select(func.count()).select_from(ServiceAppointment))).scalar_one()
        print(f"  appointment count query: {(time.perf_counter()-t0)*1000:.1f}ms")
        return n


async def _dashboard_review_stats() -> dict:
    async with AsyncSessionLocal() as s:
        t0 = time.perf_counter()
        row = (await s.execute(
            select(
                func.count().label("total"),
                func.sum(case((Review.status == ReviewStatus.pending, 1), else_=0)).label("pending"),
            ).select_from(Review)
        )).one()
        print(f"  review stats query: {(time.perf_counter()-t0)*1000:.1f}ms")
        return {"total": row.total or 0, "pending": row.pending or 0}


_dashboard_cache: dict = {"data": None, "expires": 0.0}
_DASHBOARD_TTL = 30.0


# ── Dashboard ──────────────────────────────────────────────────────────────────

@router.get("/dashboard")
async def dashboard_stats(_: None = Depends(verify_admin_header)):
    now = time.monotonic()
    if _dashboard_cache["data"] is not None and now < _dashboard_cache["expires"]:
        print("/api/admin/dashboard: cache hit")
        return _dashboard_cache["data"]

    t0 = time.perf_counter()

    vehicles, total_users, financing, total_tradeins, total_appointments, reviews = (
        await asyncio.gather(
            _dashboard_vehicle_stats(),
            _dashboard_user_count(),
            _dashboard_financing_stats(),
            _dashboard_tradein_count(),
            _dashboard_appointment_count(),
            _dashboard_review_stats(),
        )
    )

    elapsed = (time.perf_counter() - t0) * 1000
    print(f"/api/admin/dashboard: {elapsed:.1f}ms (6 concurrent queries, cached for {_DASHBOARD_TTL:.0f}s)")

    result = {
        "vehicles": vehicles,
        "users": {"total": total_users},
        "financing": financing,
        "trade_ins": {"total": total_tradeins},
        "appointments": {"total": total_appointments},
        "reviews": reviews,
    }
    _dashboard_cache["data"] = result
    _dashboard_cache["expires"] = now + _DASHBOARD_TTL
    return result


# ── AI vehicle content preview ─────────────────────────────────────────────────
# NOTE: This route MUST be declared before /vehicles/{vehicle_id} so FastAPI
# does not try to parse "ai-preview" as a UUID path parameter.

@router.post("/vehicles/ai-preview", response_model=VehicleAIPreviewResponse)
async def ai_vehicle_preview(
    data: VehicleAIPreviewRequest,
    _: None = Depends(verify_admin_header),
) -> VehicleAIPreviewResponse:
    """Generate AI marketing content for a vehicle without persisting anything."""
    from app.services.ai_vehicle_service import generate_vehicle_content
    try:
        result = await generate_vehicle_content(data.model_dump())
        return VehicleAIPreviewResponse(**result)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail=str(exc))
    except Exception as exc:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail=f"AI generation failed: {exc}")


@router.post("/vehicles/ai-image-analyze", response_model=VehicleAIImageAnalysisResponse)
async def ai_image_analyze(
    file: UploadFile = File(...),
    _: None = Depends(verify_admin_header),
) -> VehicleAIImageAnalysisResponse:
    """
    Analyse a vehicle photograph with vision AI and return detected field values
    (make, model, year, colour, body type, suggested title).
    Nothing is persisted — the admin decides what to apply to the form.
    """
    from app.services.ai_vehicle_service import analyze_vehicle_image

    # Basic guard: images only, max 10 MB
    content_type = file.content_type or "image/jpeg"
    if not content_type.startswith("image/"):
        raise HTTPException(status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
                            detail="Only image files are accepted.")

    image_bytes = await file.read()
    if len(image_bytes) > 10 * 1024 * 1024:
        raise HTTPException(status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                            detail="Image must be under 10 MB.")

    try:
        result = await analyze_vehicle_image(image_bytes, content_type)
        return VehicleAIImageAnalysisResponse(**result)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail=str(exc))
    except Exception as exc:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail=f"AI analysis failed: {exc}")


# ── Vehicles ───────────────────────────────────────────────────────────────────

@router.post("/vehicles", response_model=VehicleOut, status_code=status.HTTP_201_CREATED)
async def create_vehicle(
    data: VehicleCreate,
    _: None = Depends(verify_admin_header),
    db: AsyncSession = Depends(get_db),
):
    vehicle = await vehicle_service.create_vehicle(db, data, None)
    return VehicleOut.model_validate(vehicle)


@router.put("/vehicles/{vehicle_id}", response_model=VehicleOut)
async def update_vehicle(
    vehicle_id: uuid.UUID,
    data: VehicleUpdate,
    _: None = Depends(verify_admin_header),
    db: AsyncSession = Depends(get_db),
):
    vehicle = await vehicle_service.get_vehicle(db, vehicle_id)
    updated = await vehicle_service.update_vehicle(db, vehicle, data)
    return VehicleOut.model_validate(updated)


@router.delete("/vehicles/{vehicle_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_vehicle(
    vehicle_id: uuid.UUID,
    _: None = Depends(verify_admin_header),
    db: AsyncSession = Depends(get_db),
):
    vehicle = await vehicle_service.get_vehicle(db, vehicle_id)
    await vehicle_service.delete_vehicle(db, vehicle)


@router.post("/vehicles/{vehicle_id}/images", response_model=VehicleOut)
async def upload_vehicle_image(
    vehicle_id: uuid.UUID,
    file: UploadFile = File(...),
    _: None = Depends(verify_admin_header),
    db: AsyncSession = Depends(get_db),
):
    vehicle = await vehicle_service.get_vehicle(db, vehicle_id)
    url = await save_upload(file, subfolder="vehicles")
    updated = await vehicle_service.add_vehicle_image(db, vehicle, url)
    return VehicleOut.model_validate(updated)


@router.put("/vehicles/{vehicle_id}/images/reorder", response_model=VehicleOut)
async def reorder_vehicle_images(
    vehicle_id: uuid.UUID,
    body: ImageReorderBody,
    _: None = Depends(verify_admin_header),
    db: AsyncSession = Depends(get_db),
):
    vehicle = await vehicle_service.get_vehicle(db, vehicle_id)
    if set(body.images) != set(vehicle.images or []):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Reorder list must contain the same images",
        )
    vehicle.images = body.images
    await db.flush()
    await db.refresh(vehicle)
    return VehicleOut.model_validate(vehicle)


@router.delete("/vehicles/{vehicle_id}/images", response_model=VehicleOut)
async def remove_vehicle_image(
    vehicle_id: uuid.UUID,
    image_url: str = Query(...),
    _: None = Depends(verify_admin_header),
    db: AsyncSession = Depends(get_db),
):
    vehicle = await vehicle_service.get_vehicle(db, vehicle_id)
    await delete_upload(image_url)
    updated = await vehicle_service.remove_vehicle_image(db, vehicle, image_url)
    return VehicleOut.model_validate(updated)


# ── Users ──────────────────────────────────────────────────────────────────────

@router.get("/users", response_model=PaginatedResponse)
async def list_users(
    _: None = Depends(verify_admin_header),
    pagination: PaginationParams = Depends(pagination_params),
    db: AsyncSession = Depends(get_db),
):
    items, total = await user_service.list_users(db, pagination.offset, pagination.page_size)
    return PaginatedResponse.build(
        items=[UserOut.model_validate(u) for u in items],
        total=total, page=pagination.page, page_size=pagination.page_size,
    )


@router.get("/users/{user_id}", response_model=UserOut)
async def get_user(
    user_id: uuid.UUID,
    _: None = Depends(verify_admin_header),
    db: AsyncSession = Depends(get_db),
):
    user = await user_service.get_user_by_id(db, user_id)
    return UserOut.model_validate(user)


@router.patch("/users/{user_id}", response_model=UserOut)
async def update_user(
    user_id: uuid.UUID,
    data: UserAdminUpdate,
    _: None = Depends(verify_admin_header),
    db: AsyncSession = Depends(get_db),
):
    user = await user_service.get_user_by_id(db, user_id)
    updated = await user_service.admin_update_user(db, user, data)
    return UserOut.model_validate(updated)


# ── Financing ──────────────────────────────────────────────────────────────────

@router.get("/financing", response_model=PaginatedResponse)
async def list_financing(
    financing_status: FinancingStatus | None = Query(None),
    _: None = Depends(verify_admin_header),
    pagination: PaginationParams = Depends(pagination_params),
    db: AsyncSession = Depends(get_db),
):
    items, total = await financing_service.list_financing_requests(
        db, financing_status=financing_status, skip=pagination.offset, limit=pagination.page_size
    )
    return PaginatedResponse.build(
        items=[FinancingRequestOut.model_validate(i) for i in items],
        total=total, page=pagination.page, page_size=pagination.page_size,
    )


@router.patch("/financing/{req_id}", response_model=FinancingRequestOut)
async def update_financing(
    req_id: uuid.UUID,
    data: FinancingRequestUpdate,
    _: None = Depends(verify_admin_header),
    db: AsyncSession = Depends(get_db),
):
    req = await financing_service.get_financing_request(db, req_id)
    updated = await financing_service.update_financing_request(db, req, data)
    return FinancingRequestOut.model_validate(updated)


# ── Trade-Ins ──────────────────────────────────────────────────────────────────

@router.get("/tradein", response_model=PaginatedResponse)
async def list_tradeins(
    trade_status: TradeInStatus | None = Query(None),
    _: None = Depends(verify_admin_header),
    pagination: PaginationParams = Depends(pagination_params),
    db: AsyncSession = Depends(get_db),
):
    items, total = await tradein_service.list_tradeins(
        db, trade_status=trade_status, skip=pagination.offset, limit=pagination.page_size
    )
    return PaginatedResponse.build(
        items=[TradeInOut.model_validate(i) for i in items],
        total=total, page=pagination.page, page_size=pagination.page_size,
    )


@router.patch("/tradein/{trade_id}", response_model=TradeInOut)
async def update_tradein(
    trade_id: uuid.UUID,
    data: TradeInUpdate,
    _: None = Depends(verify_admin_header),
    db: AsyncSession = Depends(get_db),
):
    trade = await tradein_service.get_tradein(db, trade_id)
    updated = await tradein_service.update_tradein(db, trade, data)
    return TradeInOut.model_validate(updated)


# ── Appointments ───────────────────────────────────────────────────────────────

@router.get("/appointments", response_model=PaginatedResponse)
async def list_appointments(
    appt_status: AppointmentStatus | None = Query(None),
    _: None = Depends(verify_admin_header),
    pagination: PaginationParams = Depends(pagination_params),
    db: AsyncSession = Depends(get_db),
):
    items, total = await appointment_service.list_appointments(
        db, appt_status=appt_status, skip=pagination.offset, limit=pagination.page_size
    )
    return PaginatedResponse.build(
        items=[AppointmentOut.model_validate(i) for i in items],
        total=total, page=pagination.page, page_size=pagination.page_size,
    )


@router.patch("/appointments/{appt_id}", response_model=AppointmentOut)
async def update_appointment(
    appt_id: uuid.UUID,
    data: AppointmentUpdate,
    _: None = Depends(verify_admin_header),
    db: AsyncSession = Depends(get_db),
):
    appt = await appointment_service.get_appointment(db, appt_id)
    updated = await appointment_service.update_appointment(db, appt, data)
    return AppointmentOut.model_validate(updated)


# ── Reviews ────────────────────────────────────────────────────────────────────

@router.get("/reviews", response_model=PaginatedResponse)
async def list_reviews(
    review_status: ReviewStatus | None = Query(None),
    _: None = Depends(verify_admin_header),
    pagination: PaginationParams = Depends(pagination_params),
    db: AsyncSession = Depends(get_db),
):
    items, total = await review_service.list_reviews(
        db, review_status=review_status, skip=pagination.offset, limit=pagination.page_size
    )
    return PaginatedResponse.build(
        items=[ReviewOut.model_validate(i) for i in items],
        total=total, page=pagination.page, page_size=pagination.page_size,
    )


@router.patch("/reviews/{review_id}", response_model=ReviewOut)
async def update_review(
    review_id: uuid.UUID,
    data: ReviewUpdate,
    _: None = Depends(verify_admin_header),
    db: AsyncSession = Depends(get_db),
):
    review = await review_service.get_review(db, review_id)
    updated = await review_service.update_review(db, review, data)
    return ReviewOut.model_validate(updated)


@router.delete("/reviews/{review_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_review(
    review_id: uuid.UUID,
    _: None = Depends(verify_admin_header),
    db: AsyncSession = Depends(get_db),
):
    review = await review_service.get_review(db, review_id)
    await review_service.delete_review(db, review)
