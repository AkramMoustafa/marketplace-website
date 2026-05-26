from sqlalchemy import String, Text
from sqlalchemy.orm import Mapped, mapped_column
from app.db.base import Base, UUIDMixin, TimestampMixin


class ContactMessage(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "contact_messages"

    name:    Mapped[str]       = mapped_column(String(100), nullable=False)
    email:   Mapped[str]       = mapped_column(String(255), nullable=False)
    phone:   Mapped[str | None] = mapped_column(String(30),  nullable=True)
    subject: Mapped[str]       = mapped_column(String(200), nullable=False)
    message: Mapped[str]       = mapped_column(Text,        nullable=False)
    read:    Mapped[bool]      = mapped_column(default=False, nullable=False)
