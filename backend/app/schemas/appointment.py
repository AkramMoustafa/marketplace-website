import uuid
from datetime import datetime
from pydantic import BaseModel
from app.models.appointment import ServiceType, AppointmentStatus


class AppointmentCreate(BaseModel):
    vehicle_id: uuid.UUID | None = None
    service_type: ServiceType
    appointment_date: datetime
    phone: str
    notes: str | None = None


class AppointmentUpdate(BaseModel):
    service_type: ServiceType | None = None
    appointment_date: datetime | None = None
    status: AppointmentStatus | None = None
    admin_notes: str | None = None


class AppointmentOut(BaseModel):
    model_config = {"from_attributes": True}

    id: uuid.UUID
    customer_id: uuid.UUID | None
    vehicle_id: uuid.UUID | None
    service_type: ServiceType
    appointment_date: datetime
    phone: str
    notes: str | None
    status: AppointmentStatus
    admin_notes: str | None
    created_at: datetime
    updated_at: datetime
