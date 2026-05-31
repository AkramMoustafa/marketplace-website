"""
state.py
~~~~~~~~
Shared AgentState TypedDict for the NOVA Motors AI Sales Agent.

Phases
------
  Phase A – Vehicle Intelligence : vin → NHTSA specs + market research
  Phase B – Listing Generation   : user inputs → full listing package
  Phase C – Distribution         : vehicle_id (post-save) → eBay + Facebook + Website
"""
from __future__ import annotations

from typing import Optional
from typing_extensions import TypedDict


class AgentState(TypedDict, total=False):

    # ── Phase A input ─────────────────────────────────────────────────────────
    vin: str

    # ── Vehicle Intelligence (NHTSA decode) ──────────────────────────────────
    make: Optional[str]
    model: Optional[str]
    year: Optional[int]
    trim: Optional[str]
    engine: Optional[str]
    fuel_type: Optional[str]
    transmission: Optional[str]
    body_style: Optional[str]          # from NHTSA when available
    drive_type: Optional[str]          # from NHTSA when available
    nhtsa_raw: Optional[dict]

    # ── Market Research ───────────────────────────────────────────────────────
    market_price_range: Optional[str]  # e.g. "$28,000 – $36,000"
    selling_points: Optional[list]     # 5-6 concise selling points
    market_insights: Optional[str]     # 2-3 sentence market analysis paragraph
    suggested_features: Optional[list] # AI-suggested features for this trim (e.g. "Heated seats")

    # ── User Review Inputs (Phase A → Phase B bridge) ─────────────────────────
    mileage: Optional[int]
    asking_price: Optional[float]      # user override; takes precedence over AI price
    condition: Optional[str]           # excellent / good / fair / poor
    title_status: Optional[str]        # clean / rebuilt / salvage
    features: Optional[list]           # user-entered feature list
    service_history: Optional[str]
    notes: Optional[str]               # dealer notes

    # ── Generated Listing (Phase B) ───────────────────────────────────────────
    listing_title: Optional[str]
    listing_description: Optional[str]           # website / general
    suggested_price: Optional[float]
    key_features: Optional[list]                 # AI-generated feature tags for the vehicle
    facebook_copy: Optional[str]                 # ready-to-paste FB Marketplace text
    ebay_listing_description: Optional[str]      # eBay-specific description

    # ── Inventory ─────────────────────────────────────────────────────────────
    inventory_vehicle_id: Optional[str]          # set after save to inventory

    # ── Distribution (Phase C) ────────────────────────────────────────────────
    ebay_status: Optional[str]
    ebay_listing_id: Optional[str]
    ebay_message: Optional[str]
    distribution_status: Optional[dict]          # per-channel result summary

    # ── Backward-compat ───────────────────────────────────────────────────────
    admin_price: Optional[float]                 # legacy; prefer asking_price

    # ── Error tracking (node_name → message) ─────────────────────────────────
    errors: dict
