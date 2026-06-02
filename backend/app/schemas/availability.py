from datetime import datetime
from pydantic import BaseModel
from typing import List


class AvailabilitySettingsOut(BaseModel):
    model_config = {"from_attributes": True}

    days_of_week: List[int]
    open_time: str
    close_time: str
    slot_duration_minutes: int
    is_active: bool
    updated_at: datetime


class AvailabilitySettingsUpdate(BaseModel):
    days_of_week: List[int] | None = None
    open_time: str | None = None
    close_time: str | None = None
    slot_duration_minutes: int | None = None
    is_active: bool | None = None
