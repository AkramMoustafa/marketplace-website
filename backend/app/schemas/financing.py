import uuid
from datetime import datetime
from decimal import Decimal
from pydantic import BaseModel
from app.models.financing import EmploymentStatus, CreditScoreRange, FinancingStatus


class FinancingRequestCreate(BaseModel):
    vehicle_id: uuid.UUID | None = None
    phone: str
    address: str
    annual_income: Decimal
    employment_status: EmploymentStatus
    employer_name: str | None = None
    years_employed: int | None = None
    credit_score_range: CreditScoreRange
    down_payment: Decimal = Decimal("0")
    monthly_budget: Decimal | None = None


class FinancingRequestUpdate(BaseModel):
    status: FinancingStatus | None = None
    admin_notes: str | None = None


class FinancingRequestOut(BaseModel):
    model_config = {"from_attributes": True}

    id: uuid.UUID
    customer_id: uuid.UUID
    vehicle_id: uuid.UUID | None
    phone: str
    address: str
    annual_income: Decimal
    employment_status: EmploymentStatus
    employer_name: str | None
    years_employed: int | None
    credit_score_range: CreditScoreRange
    down_payment: Decimal
    monthly_budget: Decimal | None
    status: FinancingStatus
    admin_notes: str | None
    created_at: datetime
    updated_at: datetime
