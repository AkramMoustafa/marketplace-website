import uuid
from datetime import datetime
from decimal import Decimal
from pydantic import BaseModel
from app.models.tradein import VehicleCondition, TradeInStatus


class TradeInCreate(BaseModel):
    phone: str
    make: str
    model: str
    year: int
    mileage: int
    color: str | None = None
    vin: str | None = None
    condition: VehicleCondition
    accident_history: bool = False
    features: str | None = None
    additional_notes: str | None = None
    asking_price: Decimal | None = None


class TradeInUpdate(BaseModel):
    status: TradeInStatus | None = None
    valuation_notes: str | None = None
    appraised_value: Decimal | None = None


class TradeInOut(BaseModel):
    model_config = {"from_attributes": True}

    id: uuid.UUID
    customer_id: uuid.UUID
    phone: str
    make: str
    model: str
    year: int
    mileage: int
    color: str | None
    vin: str | None
    condition: VehicleCondition
    accident_history: bool
    features: str | None
    additional_notes: str | None
    asking_price: Decimal | None
    valuation_notes: str | None
    appraised_value: Decimal | None
    status: TradeInStatus
    created_at: datetime
    updated_at: datetime
