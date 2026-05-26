"""
mapper.py
~~~~~~~~~
Converts NOVA Motors Vehicle ORM objects into standardised marketplace
payload dicts consumed by each publisher.

All field names and value transformations live here so publishers stay thin.
"""
from __future__ import annotations

from decimal import Decimal
from typing import TYPE_CHECKING, Any

if TYPE_CHECKING:
    from app.models.vehicle import Vehicle


# ─────────────────────────────────────────────────────────────────────────────
# eBay Motors
# ─────────────────────────────────────────────────────────────────────────────

def to_ebay_payload(vehicle: "Vehicle") -> dict[str, Any]:
    """Map a Vehicle to an eBay Motors-style listing payload.

    Covers the fields required by eBay's Inventory Item + Offer APIs.
    The title is capped at 80 characters (eBay limit).
    """
    price = float(vehicle.price) if isinstance(vehicle.price, Decimal) else float(vehicle.price or 0)

    title = vehicle.title[:80]

    description_parts: list[str] = []
    if vehicle.description:
        description_parts.append(vehicle.description)
    if vehicle.features:
        description_parts.append(
            "\n\nKey Features:\n" + "\n".join(f"• {f}" for f in vehicle.features)
        )
    description = (
        "\n".join(description_parts)
        if description_parts
        else f"{vehicle.year} {vehicle.make} {vehicle.model}"
    )

    payload: dict[str, Any] = {
        # Core listing fields
        "title": title,
        "sku": f"NOVA-{vehicle.vin}",
        "condition": "USED",
        "category_id": "6001",  # eBay Motors > Cars & Trucks
        # Pricing
        "price": price,
        "currency": "USD",
        # Vehicle specifics
        "vin": vehicle.vin,
        "year": vehicle.year,
        "make": vehicle.make,
        "model": vehicle.model,
        "mileage": vehicle.mileage,
        "body_type": vehicle.body_type,
        "color": vehicle.color,
        "engine": vehicle.engine,
        "drive": vehicle.drive,
        "transmission": vehicle.transmission.value if vehicle.transmission else None,
        "fuel_type": vehicle.fuel_type.value if vehicle.fuel_type else None,
        "stock_number": vehicle.stock_number,
        # Description & media
        "description": description,
        "image_urls": list(vehicle.images or []),
    }

    # Strip None values — eBay rejects unexpected nulls in some fields
    return {k: v for k, v in payload.items() if v is not None}


# ─────────────────────────────────────────────────────────────────────────────
# Facebook Marketplace
# ─────────────────────────────────────────────────────────────────────────────

def to_facebook_payload(vehicle: "Vehicle") -> dict[str, Any]:
    """Map a Vehicle to a Facebook Marketplace listing payload.

    Returns structured data plus a ready-to-paste text block.
    Facebook does not support automated posting, so no API call is made.
    """
    price = float(vehicle.price) if isinstance(vehicle.price, Decimal) else float(vehicle.price or 0)
    price_str = f"${price:,.0f}" if not vehicle.price_on_call else "Call for Price"

    # Build spec lines
    specs: list[str] = []
    if vehicle.engine:
        specs.append(f"Engine: {vehicle.engine}")
    if vehicle.transmission:
        specs.append(f"Transmission: {vehicle.transmission.value.title()}")
    if vehicle.drive:
        specs.append(f"Drive: {vehicle.drive}")
    if vehicle.fuel_type:
        specs.append(f"Fuel: {vehicle.fuel_type.value.replace('_', ' ').title()}")
    if vehicle.fuel_economy:
        specs.append(f"Fuel Economy: {vehicle.fuel_economy}")
    if vehicle.color:
        specs.append(f"Color: {vehicle.color}")
    if vehicle.body_type:
        specs.append(f"Body Type: {vehicle.body_type}")

    description = (
        vehicle.description
        or f"Beautiful {vehicle.year} {vehicle.make} {vehicle.model} now available at NOVA Motors."
    )

    features = list(vehicle.features or [])

    # ── Copy/paste block ─────────────────────────────────────────────────
    lines: list[str] = [
        f"🚗 {vehicle.title}",
        f"💰 {price_str}",
        f"📍 VIN: {vehicle.vin}",
        f"🛣️ Mileage: {vehicle.mileage:,} miles",
        "",
        description,
    ]
    if specs:
        lines += ["", "📋 Specs:"] + [f"  {s}" for s in specs]
    if features:
        lines += ["", "⭐ Features:"] + [f"  ✓ {f}" for f in features]
    lines += [
        "",
        "📸 See photos attached.",
        "📞 Contact NOVA Motors for more info or to schedule a test drive.",
        "#NOVAMotors #ForSale #UsedCar",
    ]

    return {
        "title": vehicle.title,
        "price": price_str,
        "description": description,
        "year": vehicle.year,
        "make": vehicle.make,
        "model": vehicle.model,
        "mileage": vehicle.mileage,
        "vin": vehicle.vin,
        "color": vehicle.color,
        "body_type": vehicle.body_type,
        "specs": specs,
        "features": features,
        "image_urls": list(vehicle.images or []),
        "copy_paste_text": "\n".join(lines),
    }
