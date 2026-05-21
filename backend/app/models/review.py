import uuid
import enum
from sqlalchemy import String, Integer, Text, Enum as SAEnum, ForeignKey, CheckConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base import Base, TimestampMixin, UUIDMixin


class ReviewStatus(str, enum.Enum):
    pending = "pending"
    approved = "approved"
    rejected = "rejected"


class Review(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "reviews"
    __table_args__ = (CheckConstraint("rating >= 1 AND rating <= 5", name="ck_reviews_rating"),)

    customer_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    vehicle_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("vehicles.id", ondelete="CASCADE"), nullable=True
    )

    rating: Mapped[int] = mapped_column(Integer, nullable=False)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    body: Mapped[str] = mapped_column(Text, nullable=False)
    status: Mapped[ReviewStatus] = mapped_column(
        SAEnum(ReviewStatus), default=ReviewStatus.pending, nullable=False
    )

    customer = relationship("User", back_populates="reviews")
    vehicle = relationship("Vehicle", back_populates="reviews")
