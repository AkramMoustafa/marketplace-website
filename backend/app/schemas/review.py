import uuid
from datetime import datetime
from pydantic import BaseModel, field_validator
from app.models.review import ReviewStatus


class VehicleInReview(BaseModel):
    """Embedded vehicle snapshot returned inside ReviewOut."""
    model_config = {"from_attributes": True}

    id: uuid.UUID
    title: str
    make: str
    model: str
    year: int
    featured_image: str | None = None


class ReviewCreate(BaseModel):
    vehicle_id: uuid.UUID | None = None
    rating: int
    title: str
    body: str

    @field_validator("rating")
    @classmethod
    def valid_rating(cls, v: int) -> int:
        if v < 1 or v > 5:
            raise ValueError("Rating must be between 1 and 5")
        return v


class ReviewUpdate(BaseModel):
    status: ReviewStatus | None = None


class ReviewOut(BaseModel):
    model_config = {"from_attributes": True}

    id: uuid.UUID
    customer_id: uuid.UUID | None = None
    vehicle_id: uuid.UUID | None = None
    rating: int
    title: str
    body: str
    status: ReviewStatus
    created_at: datetime
    updated_at: datetime
    vehicle: VehicleInReview | None = None
