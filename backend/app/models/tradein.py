import uuid
import enum
from sqlalchemy import String, Integer, Numeric, Boolean, Text, Enum as SAEnum, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base import Base, TimestampMixin, UUIDMixin


class VehicleCondition(str, enum.Enum):
    excellent = "excellent"
    good = "good"
    fair = "fair"
    poor = "poor"


class TradeInStatus(str, enum.Enum):
    pending = "pending"
    under_review = "under_review"
    appraised = "appraised"
    accepted = "accepted"
    rejected = "rejected"


class TradeIn(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "trade_ins"

    customer_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )

    # Customer contact
    phone: Mapped[str] = mapped_column(String(20), nullable=False)

    # Vehicle details
    make: Mapped[str] = mapped_column(String(100), nullable=False)
    model: Mapped[str] = mapped_column(String(100), nullable=False)
    year: Mapped[int] = mapped_column(Integer, nullable=False)
    mileage: Mapped[int] = mapped_column(Integer, nullable=False)
    color: Mapped[str | None] = mapped_column(String(50), nullable=True)
    vin: Mapped[str | None] = mapped_column(String(17), nullable=True)
    condition: Mapped[VehicleCondition] = mapped_column(SAEnum(VehicleCondition), nullable=False)
    accident_history: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    features: Mapped[str | None] = mapped_column(Text, nullable=True)
    additional_notes: Mapped[str | None] = mapped_column(Text, nullable=True)

    # Asking / valuation
    asking_price: Mapped[float | None] = mapped_column(Numeric(12, 2), nullable=True)
    valuation_notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    appraised_value: Mapped[float | None] = mapped_column(Numeric(12, 2), nullable=True)

    status: Mapped[TradeInStatus] = mapped_column(
        SAEnum(TradeInStatus), default=TradeInStatus.pending, nullable=False
    )

    customer = relationship("User", back_populates="trade_ins")
