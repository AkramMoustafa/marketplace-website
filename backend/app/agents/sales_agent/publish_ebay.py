"""
publish_ebay.py
~~~~~~~~~~~~~~~
Phase B legacy node — Publishes the vehicle to eBay Motors.

Behaviour is controlled by the EBAY_MOCK_MODE setting:

  EBAY_MOCK_MODE=true  (default)
    Returns a synthetic listing ID and status "mock_published".

  EBAY_MOCK_MODE=false
    Calls the real eBay Inventory API using EBAY_USER_TOKEN.
    Requires: sell.inventory + sell.account scopes on the user token.
    Business policies are auto-fetched from the Account API if not set in .env.
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


async def publish_ebay(state: AgentState) -> AgentState:
    """Post listing to eBay Motors (mock or live)."""
    errors: dict = dict(state.get("errors") or {})

    if errors.get("lookup_nhtsa"):
        return state

    settings = get_settings()
    vin: str = state.get("vin") or ""

    if settings.EBAY_MOCK_MODE:
        listing_id = f"MOCK-{vin[:8].upper()}"
        log.info("[eBay MOCK] Listing ID: %s", listing_id)
        return {
            **state,
            "ebay_status": "mock_published",
            "ebay_listing_id": listing_id,
            "ebay_message": (
                "Mock mode active — no real API call was made. "
                "Set EBAY_MOCK_MODE=false once eBay developer approval is complete."
            ),
            "errors": errors,
        }

    # ── Real eBay Inventory API ───────────────────────────────────────────────

    if not settings.EBAY_USER_TOKEN:
        log.warning(
            "[eBay PROD] EBAY_USER_TOKEN not set — cannot publish VIN %s", vin
        )
        return {
            **state,
            "ebay_status": "needs_user_token",
            "ebay_listing_id": None,
            "ebay_message": (
                "EBAY_USER_TOKEN is not configured. "
                "Obtain a user token from developer.ebay.com → Application Keys → "
                "your app → User Tokens (scopes: sell.inventory  sell.account)."
            ),
            "errors": errors,
        }

    title: str = state.get("listing_title") or f"Vehicle VIN {vin}"
    sku = f"NOVA-{vin}"

    make: str = state.get("make") or ""
    model: str = state.get("model") or ""
    year = state.get("year") or 0
    mileage: int | None = state.get("mileage")

    price_raw = state.get("asking_price") or state.get("suggested_price") or 0.0
    price = float(price_raw)

    ebay_desc: str = (
        state.get("ebay_listing_description")
        or state.get("listing_description")
        or title
    )

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
        errors["publish_ebay"] = f"Policy fetch failed: {exc}"
        return {
            **state,
            "ebay_status": "policy_error",
            "ebay_listing_id": None,
            "ebay_message": f"eBay policy fetch failed: {exc}",
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
        errors["publish_ebay"] = str(exc)
        return {
            **state,
            "ebay_status": "failed",
            "ebay_listing_id": None,
            "ebay_message": f"eBay publish failed: {exc}",
            "errors": errors,
        }

    listing_id: str = result["listing_id"]
    offer_id: str = result["offer_id"]
    log.info(
        "[eBay PROD] Published VIN %s → listingId=%s offerId=%s",
        vin, listing_id, offer_id,
    )

    return {
        **state,
        "ebay_status": "published",
        "ebay_listing_id": listing_id,
        "ebay_message": (
            f"Live on eBay. "
            f"Listing ID: {listing_id}  Offer ID: {offer_id}  SKU: {sku}"
        ),
        "errors": errors,
    }
