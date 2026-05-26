"""
generate_facebook_copy.py
~~~~~~~~~~~~~~~~~~~~~~~~~
Node 5 — Assembles a ready-to-paste Facebook Marketplace listing from the
accumulated agent state.  No external API call required.

Facebook does not provide a public posting API, so this node produces
formatted copy/paste text only.
"""
from __future__ import annotations

import logging

from .state import AgentState

log = logging.getLogger(__name__)


async def generate_facebook_copy(state: AgentState) -> AgentState:
    """Build Facebook Marketplace listing text from agent state."""
    errors: dict = dict(state.get("errors") or {})

    if errors.get("lookup_nhtsa"):
        return state

    make = state.get("make") or ""
    model = state.get("model") or ""
    year = state.get("year") or ""
    trim = state.get("trim") or ""
    engine = state.get("engine") or ""
    transmission = state.get("transmission") or ""
    fuel_type = state.get("fuel_type") or ""
    vin: str = state.get("vin") or ""
    price: float | None = state.get("suggested_price")
    title: str = state.get("listing_title") or " ".join(filter(None, [str(year), make, model, trim]))
    description: str = state.get("listing_description") or (
        f"Beautiful {year} {make} {model} now available at NOVA Motors."
    )
    selling_points: list[str] = state.get("selling_points") or []

    price_str = f"${price:,.0f}" if price and price > 0 else "Call for Price"

    lines: list[str] = [
        f"🚗 {title}",
        f"💰 {price_str}",
        f"📍 VIN: {vin}",
        "",
        # Truncate long descriptions to keep the post readable
        description[:600] + ("…" if len(description) > 600 else ""),
    ]

    specs: list[str] = []
    if engine:
        specs.append(f"Engine: {engine}")
    if transmission:
        specs.append(f"Transmission: {transmission}")
    if fuel_type:
        specs.append(f"Fuel: {fuel_type}")

    if specs:
        lines += ["", "📋 Specs:"] + [f"  {s}" for s in specs]

    if selling_points:
        lines += ["", "⭐ Key Features:"] + [f"  ✓ {p}" for p in selling_points[:5]]

    lines += [
        "",
        "📸 Additional photos available — just ask!",
        "📞 Call or message to schedule a test drive.",
        "#NOVAMotors #ForSale #UsedCar",
    ]

    facebook_copy = "\n".join(lines)
    log.info("[Facebook] Copy generated (%d chars)", len(facebook_copy))

    return {**state, "facebook_copy": facebook_copy, "errors": errors}
