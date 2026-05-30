"""
agent.py  (schemas)
~~~~~~~~~~~~~~~~~~~
Pydantic request/response schemas for the AI Sales Agent routes.
"""
from __future__ import annotations

from typing import Optional
from pydantic import BaseModel, Field


# ── Phase A — Vehicle Intelligence ───────────────────────────────────────────

class PhaseARequest(BaseModel):
    """POST /api/agent/vehicle-intelligence"""
    vin: str = Field(..., min_length=17, max_length=17, description="17-character VIN")


# ── Phase B — Listing Generation ─────────────────────────────────────────────

class PhaseBRequest(BaseModel):
    """POST /api/agent/generate-listing — carries Phase A output + user review inputs."""

    # Passed through from Phase A
    vin: str = Field(..., min_length=17, max_length=17)
    make: Optional[str] = None
    model: Optional[str] = None
    year: Optional[int] = None
    trim: Optional[str] = None
    engine: Optional[str] = None
    fuel_type: Optional[str] = None
    transmission: Optional[str] = None
    body_style: Optional[str] = None
    drive_type: Optional[str] = None
    market_price_range: Optional[str] = None
    selling_points: Optional[list[str]] = None
    market_insights: Optional[str] = None

    # User review inputs
    mileage: Optional[int] = Field(default=None, ge=0)
    asking_price: Optional[float] = Field(default=None, ge=0)
    condition: Optional[str] = None          # excellent / good / fair / poor
    title_status: Optional[str] = None       # clean / rebuilt / salvage
    features: Optional[list[str]] = None
    service_history: Optional[str] = None
    notes: Optional[str] = None


# ── Phase C — Distribution ────────────────────────────────────────────────────

class PhaseCRequest(BaseModel):
    """POST /api/agent/distribute — requires vehicle to be saved to inventory first."""

    vehicle_id: str = Field(..., description="Inventory vehicle ID (UUID) — must exist before distributing")
    vin: str = Field(..., min_length=17, max_length=17)

    # Passed through from Phase B
    make: Optional[str] = None
    model: Optional[str] = None
    year: Optional[int] = None
    listing_title: Optional[str] = None
    listing_description: Optional[str] = None
    facebook_copy: Optional[str] = None
    ebay_listing_description: Optional[str] = None
    suggested_price: Optional[float] = None


# ── Legacy — kept for backward compatibility ──────────────────────────────────

class ProcessVehicleRequest(BaseModel):
    """Request body for legacy POST /api/agent/process-vehicle."""
    vin: str = Field(..., min_length=17, max_length=17, description="17-character VIN")
    admin_price: Optional[float] = Field(
        default=None,
        ge=0,
        description="Optional admin-set price override.",
    )
