"""
distribute.py
~~~~~~~~~~~~~
Phase C — Distribution Agent.

Publishes an approved, inventory-saved listing to external channels.
Implemented as three sequential tool functions called by the route handler:

  distribute_ebay(state)     — eBay Motors (mock or production)
  distribute_facebook(state) — Facebook Marketplace copy confirmation
  distribute_website(state)  — Website inventory live confirmation

Architecture note: This is intentionally one agent with multiple publishing
tools rather than separate pipeline nodes, so new channels can be added
without changing the graph structure.

INVARIANT: inventory_vehicle_id MUST be set before calling any tool.
"""
from __future__ import annotations

import logging

from app.config.settings import get_settings
from app.services.marketplaces.ebay import (
    EbayAPIClient,
    EbayAPIError,
    EbayConfigError,
    build_inventory_item_payload,
    build_offer_payload,
)
from .state import AgentState

log = logging.getLogger(__name__)

_EBAY_CATEGORY_CARS = "6001"  # eBay Motors > Cars & Trucks


def _require_vehicle_id(state: AgentState, errors: dict, tool: str) -> bool:
    """Return False and record error if inventory_vehicle_id is missing."""
    if not state.get("inventory_vehicle_id"):
        errors[tool] = (
            "inventory_vehicle_id is not set. "
            "Vehicle must be saved to inventory before distributing."
        )
        return False
    return True


async def distribute_ebay(state: AgentState) -> AgentState:
    """Publish listing to eBay Motors (mock or production)."""
    errors: dict = dict(state.get("errors") or {})

    if not _require_vehicle_id(state, errors, "distribute_ebay"):
        return {**state, "errors": errors}

    settings = get_settings()
    vin: str = state.get("vin") or ""
    vehicle_id: str = state.get("inventory_vehicle_id") or ""
    title: str = state.get("listing_title") or f"Vehicle VIN {vin}"

    if settings.EBAY_MOCK_MODE:
        listing_id = f"MOCK-{vin[:8].upper()}-{vehicle_id[:6].upper()}"
        log.info("[eBay MOCK] Listing ID: %s for '%s'", listing_id, title)

        dist: dict = dict(state.get("distribution_status") or {})
        dist["ebay"] = f"mock_published:{listing_id}"

        return {
            **state,
            "ebay_status": "mock_published",
            "ebay_listing_id": listing_id,
            "ebay_message": (
                "Mock mode active — no real eBay API call was made. "
                "Set EBAY_MOCK_MODE=false once developer approval is complete."
            ),
            "distribution_status": dist,
            "errors": errors,
        }

    # ── Real eBay Inventory API ───────────────────────────────────────────────

    if not settings.EBAY_USER_TOKEN:
        dist = dict(state.get("distribution_status") or {})
        dist["ebay"] = "needs_user_token"
        log.warning(
            "[eBay PROD] EBAY_USER_TOKEN not set — cannot publish VIN %s. "
            "Obtain a user token from developer.ebay.com → App Keys → User Tokens "
            "(required scopes: sell.inventory  sell.account)",
            vin,
        )
        return {
            **state,
            "ebay_status": "needs_user_token",
            "ebay_listing_id": None,
            "ebay_message": (
                "EBAY_USER_TOKEN is not configured. "
                "Obtain a user token from developer.ebay.com → Application Keys → "
                "your app → User Tokens (scopes: sell.inventory  sell.account) "
                "and set it in backend/.env."
            ),
            "distribution_status": dist,
            "errors": errors,
        }

    # Build SKU and payloads from agent state
    sku = f"NOVA-{vin}" if vin else f"NOVA-{vehicle_id}"

    make: str = state.get("make") or ""
    model: str = state.get("model") or ""
    year = state.get("year") or 0
    trim: str = state.get("trim") or ""
    mileage: int | None = state.get("mileage")
    features: list = state.get("features") or []

    # Price: user asking_price takes precedence over AI suggested_price
    price_raw = state.get("asking_price") or state.get("suggested_price") or 0.0
    price = float(price_raw)

    # Build description for inventory item
    ebay_desc: str = state.get("ebay_listing_description") or state.get("listing_description") or title
    if features:
        ebay_desc += "\n\nKey Features:\n" + "\n".join(f"• {f}" for f in features)

    inventory_payload = build_inventory_item_payload(
        title=title,
        description=ebay_desc,
        make=make,
        model=model,
        year=year,
        vin=vin,
        mileage=mileage,
    )

    client = EbayAPIClient()

    try:
        policies = await client.fetch_policies()
    except (EbayAPIError, EbayConfigError) as exc:
        log.error("[eBay PROD] Policy fetch failed for VIN %s: %s", vin, exc)
        dist = dict(state.get("distribution_status") or {})
        dist["ebay"] = "policy_error"
        errors["distribute_ebay"] = f"Policy fetch failed: {exc}"
        return {
            **state,
            "ebay_status": "policy_error",
            "ebay_listing_id": None,
            "ebay_message": f"eBay policy fetch failed: {exc}",
            "distribution_status": dist,
            "errors": errors,
        }

    offer_payload = build_offer_payload(
        sku=sku,
        price=price,
        category_id=_EBAY_CATEGORY_CARS,
        marketplace_id=settings.EBAY_MARKETPLACE_ID,
        fulfillment_policy_id=policies["fulfillment_id"],
        payment_policy_id=policies["payment_id"],
        return_policy_id=policies["return_id"],
        listing_description=ebay_desc,
    )

    try:
        result = await client.publish_listing(sku, inventory_payload, offer_payload)
    except EbayAPIError as exc:
        log.error("[eBay PROD] Publish failed (HTTP %s) for VIN %s: %s", exc.status_code, vin, exc)
        dist = dict(state.get("distribution_status") or {})
        dist["ebay"] = "failed"
        errors["distribute_ebay"] = str(exc)
        return {
            **state,
            "ebay_status": "failed",
            "ebay_listing_id": None,
            "ebay_message": f"eBay publish failed: {exc}",
            "distribution_status": dist,
            "errors": errors,
        }

    listing_id: str = result["listing_id"]
    offer_id: str = result["offer_id"]
    log.info(
        "[eBay PROD] Published VIN %s → listingId=%s offerId=%s sku=%s",
        vin, listing_id, offer_id, sku,
    )

    dist = dict(state.get("distribution_status") or {})
    dist["ebay"] = f"published:{listing_id}"

    return {
        **state,
        "ebay_status": "published",
        "ebay_listing_id": listing_id,
        "ebay_message": (
            f"Listed on eBay. "
            f"Listing ID: {listing_id}  Offer ID: {offer_id}  SKU: {sku}"
        ),
        "distribution_status": dist,
        "errors": errors,
    }


async def distribute_facebook(state: AgentState) -> AgentState:
    """Confirm Facebook Marketplace copy is ready for posting."""
    errors: dict = dict(state.get("errors") or {})

    if not _require_vehicle_id(state, errors, "distribute_facebook"):
        return {**state, "errors": errors}

    facebook_copy = state.get("facebook_copy") or ""
    dist: dict = dict(state.get("distribution_status") or {})

    if facebook_copy:
        dist["facebook"] = "copy_ready"
        log.info("[Facebook] Copy confirmed ready (%d chars)", len(facebook_copy))
    else:
        dist["facebook"] = "no_copy_generated"
        log.warning("[Facebook] No facebook_copy in state")

    return {**state, "distribution_status": dist, "errors": errors}


async def distribute_website(state: AgentState) -> AgentState:
    """Confirm the vehicle is live in website inventory."""
    errors: dict = dict(state.get("errors") or {})

    if not _require_vehicle_id(state, errors, "distribute_website"):
        return {**state, "errors": errors}

    vehicle_id = state.get("inventory_vehicle_id") or ""
    dist: dict = dict(state.get("distribution_status") or {})
    dist["website"] = f"live:{vehicle_id}"

    log.info("[Website] Vehicle %s confirmed live in inventory", vehicle_id)
    return {**state, "distribution_status": dist, "errors": errors}
