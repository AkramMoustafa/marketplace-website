import uuid
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from fastapi import HTTPException, status
from app.models.appointment import ServiceAppointment, AppointmentStatus
from app.schemas.appointment import AppointmentCreate, AppointmentUpdate


async def create_appointment(
    db: AsyncSession, data: AppointmentCreate, customer_id: uuid.UUID | None = None
) -> ServiceAppointment:
    appt = ServiceAppointment(**data.model_dump(), customer_id=customer_id)
    if appt.service_type == ServiceType.test_drive:
        appt.status = AppointmentStatus.confirmed
    db.add(appt)
    await db.flush()
    await db.refresh(appt)
    return appt


async def get_appointment(db: AsyncSession, appt_id: uuid.UUID) -> ServiceAppointment:
    result = await db.execute(select(ServiceAppointment).where(ServiceAppointment.id == appt_id))
    appt = result.scalar_one_or_none()
    if not appt:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Appointment not found")
    return appt


async def list_appointments(
    db: AsyncSession,
    customer_id: uuid.UUID | None = None,
    appt_status: AppointmentStatus | None = None,
    skip: int = 0,
    limit: int = 20,
) -> tuple[list[ServiceAppointment], int]:
    query = select(ServiceAppointment)
    if customer_id:
        query = query.where(ServiceAppointment.customer_id == customer_id)
    if appt_status:
        query = query.where(ServiceAppointment.status == appt_status)

    total = (await db.execute(select(func.count()).select_from(query.subquery()))).scalar_one()
    result = await db.execute(
        query.order_by(ServiceAppointment.appointment_date.asc()).offset(skip).limit(limit)
    )
    return result.scalars().all(), total


async def update_appointment(
    db: AsyncSession, appt: ServiceAppointment, data: AppointmentUpdate
) -> ServiceAppointment:
    for field, value in data.model_dump(exclude_none=True).items():
        setattr(appt, field, value)
    await db.flush()
    await db.refresh(appt)
    return appt


async def cancel_appointment(db: AsyncSession, appt: ServiceAppointment) -> ServiceAppointment:
    appt.status = AppointmentStatus.cancelled
    await db.flush()
    await db.refresh(appt)
    return appt
