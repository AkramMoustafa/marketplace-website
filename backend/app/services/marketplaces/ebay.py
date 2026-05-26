"""
ebay.py
~~~~~~~
EbayPublisher — supports mock mode (safe for pre-approval dev) and a
production skeleton that is ready for real eBay API credentials.

Environment variables
---------------------
EBAY_MOCK_MODE      true | false   — skip real API calls when true (default: true)
EBAY_CLIENT_ID      OAuth client ID from the eBay developer console
EBAY_CLIENT_SECRET  OAuth client secret
EBAY_REDIRECT_URI   RuName / redirect URI configured in the eBay app
EBAY_ENVIRONMENT    sandbox | production
"""
from __future__ import annotations

import logging
from typing import TYPE_CHECKING

from app.config.settings import get_settings
from .base import BaseMarketplacePublisher, PublishResult
from .mapper import to_ebay_payload

if TYPE_CHECKING:
    from app.models.vehicle import Vehicle

log = logging.getLogger(__name__)


class EbayPublisher(BaseMarketplacePublisher):
    """Publishes vehicles to eBay Motors.

    In mock mode every call returns a synthetic success response and sets the
    vehicle status to ``mock_published`` so the feature can be demoed without
    real credentials.

    In production mode the code is structured to drop in the real eBay REST /
    SDK calls once developer-account approval is received.
    """

    def __init__(self) -> None:
        self._settings = get_settings()

    # ── internal helpers ────────────────────────────────────────────────────

    def _is_mock(self) -> bool:
        return self._settings.EBAY_MOCK_MODE

    # ── mock responses ───────────────────────────────────────────────────────

    def _mock_publish(self, vehicle: "Vehicle", action: str = "publish") -> PublishResult:
        fake_id = f"MOCK-{str(vehicle.id)[:8].upper()}"
        log.info("[eBay MOCK] %s vehicle %s → listing_id=%s", action, vehicle.id, fake_id)
        return PublishResult(
            success=True,
            listing_id=fake_id,
            status="mock_published",
            message=(
                "Mock mode is active — eBay developer approval is still pending. "
                "No real API call was made. Status set to 'mock_published'."
            ),
            raw_response={"mock": True, "action": action, "vehicle_id": str(vehicle.id)},
        )

    def _mock_unpublish(self, vehicle: "Vehicle") -> PublishResult:
        log.info("[eBay MOCK] unpublish vehicle %s", vehicle.id)
        return PublishResult(
            success=True,
            listing_id=vehicle.ebay_listing_id,
            status="draft",
            message="Mock mode — listing removed (no real API call was made).",
            raw_response={"mock": True, "action": "unpublish", "vehicle_id": str(vehicle.id)},
        )

    def _pending_approval_result(self, vehicle: "Vehicle") -> PublishResult:
        """Returned when running in production mode but approval is still pending."""
        return PublishResult(
            success=True,
            listing_id=None,
            status="pending_ebay_api_approval",
            message=(
                "eBay developer-account approval is pending. "
                "The listing has been queued and will be submitted once credentials are active."
            ),
            raw_response={},
        )

    # ── public interface ─────────────────────────────────────────────────────

    async def publish_vehicle(self, vehicle: "Vehicle") -> PublishResult:
        if self._is_mock():
            return self._mock_publish(vehicle, "publish")

        # ── Production path ──────────────────────────────────────────────────
        #
        # Replace this block with real eBay API calls once developer approval
        # is complete.  Typical OAuth + Inventory flow:
        #
        #   1. Exchange EBAY_CLIENT_ID + EBAY_CLIENT_SECRET for an access token via
        #      POST https://api.ebay.com/identity/v1/oauth2/token
        #
        #   2. Create / update an InventoryItem:
        #      PUT  https://api.ebay.com/sell/inventory/v1/inventory_item/{sku}
        #      Body: to_ebay_payload(vehicle) translated to eBay's InventoryItem schema
        #
        #   3. Create an Offer:
        #      POST https://api.ebay.com/sell/inventory/v1/offer
        #
        #   4. Publish the Offer:
        #      POST https://api.ebay.com/sell/inventory/v1/offer/{offerId}/publish
        #
        #   5. Parse the listingId from the response and return it.
        #
        payload = to_ebay_payload(vehicle)
        log.info(
            "[eBay PROD] Would publish vehicle %s with payload keys: %s",
            vehicle.id,
            list(payload.keys()),
        )
        return self._pending_approval_result(vehicle)

    async def update_vehicle(self, vehicle: "Vehicle") -> PublishResult:
        if self._is_mock():
            return self._mock_publish(vehicle, "update")

        # TODO: PUT updated InventoryItem, then re-publish the Offer.
        payload = to_ebay_payload(vehicle)
        log.info("[eBay PROD] Would update vehicle %s", vehicle.id)
        return self._pending_approval_result(vehicle)

    async def remove_vehicle(self, vehicle: "Vehicle") -> PublishResult:
        if self._is_mock():
            return self._mock_unpublish(vehicle)

        # TODO: POST https://api.ebay.com/sell/inventory/v1/offer/{offerId}/withdraw
        log.info(
            "[eBay PROD] Would remove vehicle %s (listing: %s)",
            vehicle.id,
            vehicle.ebay_listing_id,
        )
        return PublishResult(
            success=True,
            listing_id=vehicle.ebay_listing_id,
            status="draft",
            message="Queued for removal — will execute once eBay developer approval is complete.",
        )
