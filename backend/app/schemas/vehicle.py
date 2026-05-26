import uuid
from datetime import datetime
from decimal import Decimal
from pydantic import BaseModel, field_validator
from app.models.vehicle import TransmissionType, FuelType, VehicleStatus


class VehicleCreate(BaseModel):
    title: str
    make: str
    model: str
    year: int
    mileage: int = 0
    price: Decimal
    transmission: TransmissionType
    fuel_type: FuelType
    vin: str
    description: str | None = None
    color: str | None = None
    body_type: str | None = None
    stock_number: str | None = None
    engine: str | None = None
    drive: str | None = None
    fuel_economy: str | None = None
    features: list[str] | None = None
    featured: bool = False
    price_on_call: bool = False
    status: VehicleStatus = VehicleStatus.available

    @field_validator("year")
    @classmethod
    def valid_year(cls, v: int) -> int:
        if v < 1900 or v > datetime.now().year + 2:
            raise ValueError("Invalid vehicle year")
        return v

    @field_validator("vin")
    @classmethod
    def valid_vin(cls, v: str) -> str:
        if len(v) != 17:
            raise ValueError("VIN must be exactly 17 characters")
        return v.upper()

    @field_validator("price")
    @classmethod
    def positive_price(cls, v: Decimal) -> Decimal:
        if v <= 0:
            raise ValueError("Price must be positive")
        return v


class VehicleUpdate(BaseModel):
    title: str | None = None
    make: str | None = None
    model: str | None = None
    year: int | None = None
    mileage: int | None = None
    price: Decimal | None = None
    transmission: TransmissionType | None = None
    fuel_type: FuelType | None = None
    description: str | None = None
    color: str | None = None
    body_type: str | None = None
    stock_number: str | None = None
    engine: str | None = None
    drive: str | None = None
    fuel_economy: str | None = None
    features: list[str] | None = None
    featured: bool | None = None
    price_on_call: bool | None = None
    status: VehicleStatus | None = None


class VehicleOut(BaseModel):
    model_config = {"from_attributes": True}

    id: uuid.UUID
    title: str
    make: str
    model: str
    year: int
    mileage: int
    price: Decimal
    transmission: TransmissionType
    fuel_type: FuelType
    vin: str
    images: list[str]
    status: VehicleStatus
    featured: bool
    price_on_call: bool
    description: str | None
    color: str | None
    body_type: str | None
    stock_number: str | None
    engine: str | None
    drive: str | None
    fuel_economy: str | None
    features: list[str] | None
    created_at: datetime
    updated_at: datetime


class VehicleListOut(BaseModel):
    model_config = {"from_attributes": True}

    id: uuid.UUID
    title: str
    make: str
    model: str
    year: int
    mileage: int
    price: Decimal
    transmission: TransmissionType
    fuel_type: FuelType
    images: list[str]
    status: VehicleStatus
    featured: bool
    price_on_call: bool
    color: str | None
    stock_number: str | None = None
    engine: str | None = None
    drive: str | None = None
    fuel_economy: str | None = None
    features: list[str] | None = None


class VehicleAIPreviewRequest(BaseModel):
    """Payload sent to the AI content-preview endpoint."""
    title: str = ""
    make: str = ""
    model: str = ""
    year: int = 0
    engine: str = ""
    drive: str = ""
    fuel_economy: str = ""
    mileage: int = 0
    color: str = ""
    body_type: str = ""
    transmission: str = ""
    features: list[str] = []


class VehicleAIPreviewResponse(BaseModel):
    """AI-generated marketing content returned to the admin UI."""
    description: str
    highlights: list[str]
    seo_title: str
    meta_description: str


class VehicleAIImageAnalysisResponse(BaseModel):
    """Vehicle details detected from a photograph by the vision AI."""
    make:            str | None = None
    model:           str | None = None
    year:            int | None = None
    color:           str | None = None
    body_type:       str | None = None
    title:           str | None = None
    confidence_note: str | None = None


class VehicleSearchOut(BaseModel):
    """Lightweight vehicle shape returned by the /search endpoint."""
    model_config = {"from_attributes": True}

    id: uuid.UUID
    title: str
    make: str
    model: str
    year: int
    featured_image: str | None = None


class VehicleFilters(BaseModel):
    make: str | None = None
    model: str | None = None
    year_min: int | None = None
    year_max: int | None = None
    price_min: Decimal | None = None
    price_max: Decimal | None = None
    mileage_max: int | None = None
    transmission: TransmissionType | None = None
    fuel_type: FuelType | None = None
    status: VehicleStatus | None = None
    featured: bool | None = None
    search: str | None = None
