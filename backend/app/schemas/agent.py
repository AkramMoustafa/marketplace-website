"""
agent.py  (schemas)
~~~~~~~~~~~~~~~~~~~
Pydantic schemas for the AI Sales Agent route.
"""
from __future__ import annotations

from typing import Optional
from pydantic import BaseModel, Field


class ProcessVehicleRequest(BaseModel):
    """Request body for POST /api/agent/process-vehicle."""

    vin: str = Field(..., min_length=17, max_length=17, description="17-character VIN")
    admin_price: Optional[float] = Field(
        default=None,
        ge=0,
        description="Optional admin-set price. When provided, overrides the AI-suggested price.",
    )
