"""
state.py
~~~~~~~~
Shared AgentState TypedDict for the NOVA Motors AI Sales Agent.

All fields are optional except ``vin`` and ``errors`` which are always
present in the initial state.  Nodes update only the fields they own.
"""
from __future__ import annotations

from typing import Optional
from typing_extensions import TypedDict


class AgentState(TypedDict, total=False):
    # ── Input ────────────────────────────────────────────────────────────────
    vin: str
    admin_price: Optional[float]

    # ── NHTSA lookup results ─────────────────────────────────────────────────
    make: Optional[str]
    model: Optional[str]
    year: Optional[int]
    trim: Optional[str]
    engine: Optional[str]
    fuel_type: Optional[str]
    transmission: Optional[str]
    nhtsa_raw: Optional[dict]

    # ── Market research ──────────────────────────────────────────────────────
    market_price_range: Optional[str]
    selling_points: Optional[list]

    # ── Generated listing ────────────────────────────────────────────────────
    listing_title: Optional[str]
    listing_description: Optional[str]
    suggested_price: Optional[float]

    # ── eBay ─────────────────────────────────────────────────────────────────
    ebay_status: Optional[str]
    ebay_listing_id: Optional[str]
    ebay_message: Optional[str]

    # ── Facebook ─────────────────────────────────────────────────────────────
    facebook_copy: Optional[str]

    # ── Error tracking (node_name → message) ─────────────────────────────────
    errors: dict
