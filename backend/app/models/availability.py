from sqlalchemy import String, Integer, Boolean, JSON
from sqlalchemy.orm import Mapped, mapped_column
from app.db.base import Base, TimestampMixin, UUIDMixin


class AvailabilitySettings(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "availability_settings"

    # JSON array of ints: 0=Mon … 6=Sun
    days_of_week: Mapped[list] = mapped_column(JSON, nullable=False, default=lambda: [1, 2, 3, 4, 5])
    open_time: Mapped[str] = mapped_column(String(5), nullable=False, default="09:00")
    close_time: Mapped[str] = mapped_column(String(5), nullable=False, default="18:00")
    slot_duration_minutes: Mapped[int] = mapped_column(Integer, nullable=False, default=60)
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
