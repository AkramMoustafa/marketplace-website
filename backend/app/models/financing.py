import uuid
import enum
from sqlalchemy import String, Integer, Numeric, Text, Enum as SAEnum, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base import Base, TimestampMixin, UUIDMixin


class EmploymentStatus(str, enum.Enum):
    employed = "employed"
    self_employed = "self_employed"
    retired = "retired"
    unemployed = "unemployed"


class CreditScoreRange(str, enum.Enum):
    excellent = "750+"
    good = "700-749"
    fair = "650-699"
    poor = "600-649"
    bad = "below_600"


class FinancingStatus(str, enum.Enum):
    pending = "pending"
    in_review = "in_review"
    approved = "approved"
    rejected = "rejected"
    cancelled = "cancelled"


class FinancingRequest(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "financing_requests"

    customer_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    vehicle_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("vehicles.id", ondelete="SET NULL"), nullable=True
    )

    # Customer info
    phone: Mapped[str] = mapped_column(String(20), nullable=False)
    address: Mapped[str] = mapped_column(String(255), nullable=False)

    # Financial info
    annual_income: Mapped[float] = mapped_column(Numeric(12, 2), nullable=False)
    employment_status: Mapped[EmploymentStatus] = mapped_column(SAEnum(EmploymentStatus), nullable=False)
    employer_name: Mapped[str | None] = mapped_column(String(120), nullable=True)
    years_employed: Mapped[int | None] = mapped_column(Integer, nullable=True)
    credit_score_range: Mapped[CreditScoreRange] = mapped_column(SAEnum(CreditScoreRange), nullable=False)
    down_payment: Mapped[float] = mapped_column(Numeric(12, 2), nullable=False, default=0)
    monthly_budget: Mapped[float | None] = mapped_column(Numeric(12, 2), nullable=True)

    status: Mapped[FinancingStatus] = mapped_column(
        SAEnum(FinancingStatus), default=FinancingStatus.pending, nullable=False
    )
    admin_notes: Mapped[str | None] = mapped_column(Text, nullable=True)

    customer = relationship("User", back_populates="financing_requests")
    vehicle = relationship("Vehicle", back_populates="financing_requests")
