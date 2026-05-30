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
from .state import AgentState

log = logging.getLogger(__name__)


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

    log.info("[eBay PROD] Approval pending for VIN %s", vin)
    dist = dict(state.get("distribution_status") or {})
    dist["ebay"] = "pending_approval"

    return {
        **state,
        "ebay_status": "pending_ebay_api_approval",
        "ebay_listing_id": None,
        "ebay_message": (
            "eBay developer-account approval is pending. "
            "The listing will be submitted once credentials are active."
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
