import uuid
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.session import get_db
from app.schemas.appointment import AppointmentCreate, AppointmentOut
from app.services import appointment_service
from app.auth.dependencies import get_current_user
from app.models.user import User
from app.utils.pagination import PaginationParams, PaginatedResponse, pagination_params


router = APIRouter(prefix="/api/appointments", tags=["Appointments"])


@router.post("", response_model=AppointmentOut, status_code=status.HTTP_201_CREATED)
async def book_appointment(
    data: AppointmentCreate,
    db: AsyncSession = Depends(get_db),
):
    appt = await appointment_service.create_appointment(db, data)
    return AppointmentOut.model_validate(appt)


@router.get("/my", response_model=PaginatedResponse)
async def my_appointments(
    current: User = Depends(get_current_user),
    pagination: PaginationParams = Depends(pagination_params),
    db: AsyncSession = Depends(get_db),
):
    items, total = await appointment_service.list_appointments(
        db, customer_id=current.id, skip=pagination.offset, limit=pagination.page_size
    )
    return PaginatedResponse.build(
        items=[AppointmentOut.model_validate(i) for i in items],
        total=total, page=pagination.page, page_size=pagination.page_size,
    )


@router.get("/{appt_id}", response_model=AppointmentOut)
async def get_appointment(
    appt_id: uuid.UUID,
    current: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    appt = await appointment_service.get_appointment(db, appt_id)
    if appt.customer_id != current.id and current.role != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")
    return AppointmentOut.model_validate(appt)


@router.delete("/{appt_id}", status_code=status.HTTP_204_NO_CONTENT)
async def cancel_appointment(
    appt_id: uuid.UUID,
    current: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    appt = await appointment_service.get_appointment(db, appt_id)
    if appt.customer_id != current.id and current.role != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")
    await appointment_service.cancel_appointment(db, appt)
