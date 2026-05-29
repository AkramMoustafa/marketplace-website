import uuid
import enum
from datetime import datetime
from sqlalchemy import String, Text, Enum as SAEnum, ForeignKey, DateTime
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base import Base, TimestampMixin, UUIDMixin


class ServiceType(str, enum.Enum):
    oil_change = "oil_change"
    tire_rotation = "tire_rotation"
    brake_service = "brake_service"
    engine_diagnostic = "engine_diagnostic"
    transmission_service = "transmission_service"
    ac_service = "ac_service"
    general_inspection = "general_inspection"
    test_drive = "test_drive"
    other = "other"


class AppointmentStatus(str, enum.Enum):
    scheduled = "scheduled"
    confirmed = "confirmed"
    in_progress = "in_progress"
    completed = "completed"
    cancelled = "cancelled"
    no_show = "no_show"


class ServiceAppointment(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "service_appointments"

    customer_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )
    vehicle_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("vehicles.id", ondelete="SET NULL"), nullable=True
    )

    service_type: Mapped[ServiceType] = mapped_column(SAEnum(ServiceType), nullable=False)
    appointment_date: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    phone: Mapped[str] = mapped_column(String(20), nullable=False)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    status: Mapped[AppointmentStatus] = mapped_column(
        SAEnum(AppointmentStatus), default=AppointmentStatus.scheduled, nullable=False
    )
    admin_notes: Mapped[str | None] = mapped_column(Text, nullable=True)

    customer = relationship("User", back_populates="appointments")
    vehicle = relationship("Vehicle", back_populates="appointments")
