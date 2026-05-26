"""
publish_ebay.py
~~~~~~~~~~~~~~~
Node 4 — Publishes (or mock-publishes) the vehicle to eBay Motors.

Behaviour is controlled by the EBAY_MOCK_MODE setting:

  EBAY_MOCK_MODE=true  (default)
    Returns a synthetic listing ID and status "mock_published".
    Safe for development and pre-approval demos.

  EBAY_MOCK_MODE=false
    Returns status "pending_ebay_api_approval" until real eBay
    developer-account credentials are wired in.
"""
from __future__ import annotations

import logging

from app.config.settings import get_settings
from .state import AgentState

log = logging.getLogger(__name__)


async def publish_ebay(state: AgentState) -> AgentState:
    """Post listing to eBay Motors (mock or pending-approval)."""
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

    # Production skeleton (credentials not yet configured)
    log.info("[eBay PROD] Approval pending for VIN %s", vin)
    return {
        **state,
        "ebay_status": "pending_ebay_api_approval",
        "ebay_listing_id": None,
        "ebay_message": (
            "eBay developer-account approval is pending. "
            "The listing will be submitted once credentials are active."
        ),
        "errors": errors,
    }
