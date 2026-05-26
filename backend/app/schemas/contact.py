import uuid
from datetime import datetime
from pydantic import BaseModel, field_validator


class ContactMessageCreate(BaseModel):
    name:    str
    email:   str
    phone:   str | None = None
    subject: str
    message: str

    @field_validator("name")
    @classmethod
    def name_not_empty(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("Name is required")
        return v.strip()

    @field_validator("email")
    @classmethod
    def email_not_empty(cls, v: str) -> str:
        if not v.strip() or "@" not in v:
            raise ValueError("A valid email address is required")
        return v.strip().lower()

    @field_validator("subject")
    @classmethod
    def subject_not_empty(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("Subject is required")
        return v.strip()

    @field_validator("message")
    @classmethod
    def message_not_empty(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("Message is required")
        return v.strip()


class ContactMessageOut(BaseModel):
    model_config = {"from_attributes": True}

    id:         uuid.UUID
    name:       str
    email:      str
    phone:      str | None
    subject:    str
    message:    str
    read:       bool
    created_at: datetime
