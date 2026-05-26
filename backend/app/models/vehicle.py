import uuid
import enum
from datetime import datetime
from sqlalchemy import String, Integer, Numeric, Boolean, Text, Enum as SAEnum, ForeignKey, DateTime
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base import Base, TimestampMixin, UUIDMixin


class TransmissionType(str, enum.Enum):
    automatic = "automatic"
    manual = "manual"
    cvt = "cvt"
    dct = "dct"


class FuelType(str, enum.Enum):
    gasoline = "gasoline"
    diesel = "diesel"
    electric = "electric"
    hybrid = "hybrid"
    plug_in_hybrid = "plug_in_hybrid"


class VehicleStatus(str, enum.Enum):
    available = "available"
    sold = "sold"
    reserved = "reserved"
    pending = "pending"


class Vehicle(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "vehicles"

    title: Mapped[str] = mapped_column(String(255), nullable=False)
    make: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    model: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    year: Mapped[int] = mapped_column(Integer, nullable=False, index=True)
    mileage: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    price: Mapped[float] = mapped_column(Numeric(12, 2), nullable=False, index=True)
    transmission: Mapped[TransmissionType] = mapped_column(SAEnum(TransmissionType), nullable=False)
    fuel_type: Mapped[FuelType] = mapped_column(SAEnum(FuelType), nullable=False)
    vin: Mapped[str] = mapped_column(String(17), unique=True, nullable=False, index=True)
    images: Mapped[list] = mapped_column(JSONB, default=list, nullable=False)
    status: Mapped[VehicleStatus] = mapped_column(
        SAEnum(VehicleStatus), default=VehicleStatus.available, nullable=False, index=True
    )
    featured: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False, index=True)
    price_on_call: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    color: Mapped[str | None] = mapped_column(String(50), nullable=True)
    body_type: Mapped[str | None] = mapped_column(String(50), nullable=True)

    # ── Fields added by migration 0ac7127ea41c ────────────────────────
    stock_number: Mapped[str | None] = mapped_column(String(50),  nullable=True)
    engine:       Mapped[str | None] = mapped_column(String(100), nullable=True)
    drive:        Mapped[str | None] = mapped_column(String(50),  nullable=True)
    fuel_economy: Mapped[str | None] = mapped_column(String(50),  nullable=True)

    # ── Field added by migration e43af5f77663 ─────────────────────────
    features: Mapped[list | None] = mapped_column(JSONB, nullable=True)

    created_by: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )

    created_by_user = relationship("User", back_populates="vehicles")
    financing_requests = relationship("FinancingRequest", back_populates="vehicle")
    appointments = relationship("ServiceAppointment", back_populates="vehicle")
    reviews = relationship("Review", back_populates="vehicle", cascade="all, delete-orphan")

    @property
    def featured_image(self) -> str | None:
        """First image URL, used in review cards and search results."""
        return self.images[0] if self.images else None
