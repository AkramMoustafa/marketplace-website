from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.db.session import get_db
from app.models.availability import AvailabilitySettings
from app.schemas.availability import AvailabilitySettingsOut, AvailabilitySettingsUpdate
from app.auth.dependencies import get_current_admin

router = APIRouter(prefix="/api/availability", tags=["Availability"])


async def _get_or_create(db: AsyncSession) -> AvailabilitySettings:
    result = await db.execute(select(AvailabilitySettings).limit(1))
    row = result.scalar_one_or_none()
    if not row:
        row = AvailabilitySettings()
        db.add(row)
        await db.flush()
        await db.refresh(row)
    return row


@router.get("", response_model=AvailabilitySettingsOut)
async def get_availability(db: AsyncSession = Depends(get_db)):
    return await _get_or_create(db)


@router.put("", response_model=AvailabilitySettingsOut)
async def update_availability(
    data: AvailabilitySettingsUpdate,
    db: AsyncSession = Depends(get_db),
    _: str = Depends(get_current_admin),
):
    row = await _get_or_create(db)
    for field, value in data.model_dump(exclude_none=True).items():
        setattr(row, field, value)
    await db.flush()
    await db.refresh(row)
    return row
