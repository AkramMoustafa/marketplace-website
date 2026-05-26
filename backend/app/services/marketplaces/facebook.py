"""
facebook.py
~~~~~~~~~~~
FacebookPublisher — generates Facebook Marketplace listing copy/paste text.

⚠️  Facebook Marketplace does NOT provide a public posting API for individual
    vehicle sellers.  This service intentionally only generates structured
    listing content for manual posting.  It never attempts to post directly.
"""
from __future__ import annotations

import logging
from typing import TYPE_CHECKING, Any

from .base import BaseMarketplacePublisher, PublishResult
from .mapper import to_facebook_payload

if TYPE_CHECKING:
    from app.models.vehicle import Vehicle

log = logging.getLogger(__name__)


class FacebookPublisher(BaseMarketplacePublisher):
    """
    Generates Facebook Marketplace listing content for manual copy/paste.

    The ``generate_listing`` method is the only production-ready entry point.
    The three abstract methods from ``BaseMarketplacePublisher`` raise
    ``NotImplementedError`` because direct automated posting is not supported
    by Facebook's platform.
    """

    async def generate_listing(self, vehicle: "Vehicle") -> dict[str, Any]:
        """Return a structured Facebook Marketplace listing payload.

        The returned dict includes a ``copy_paste_text`` key containing a
        ready-to-use formatted listing that can be pasted directly into the
        Facebook Marketplace "Create Listing" form.
        """
        payload = to_facebook_payload(vehicle)
        log.info("[Facebook] Generated listing for vehicle %s (%s)", vehicle.id, vehicle.title)
        return payload

    # ── BaseMarketplacePublisher stubs ────────────────────────────────────────
    # These are intentionally unsupported — Facebook does not allow automated
    # vehicle listing creation via a public API.

    async def publish_vehicle(self, vehicle: "Vehicle") -> PublishResult:
        raise NotImplementedError(
            "Facebook Marketplace does not support automated posting. "
            "Use generate_listing() to produce copy/paste text instead."
        )

    async def update_vehicle(self, vehicle: "Vehicle") -> PublishResult:
        raise NotImplementedError(
            "Facebook Marketplace does not support automated updates. "
            "Use generate_listing() to regenerate copy/paste text."
        )

    async def remove_vehicle(self, vehicle: "Vehicle") -> PublishResult:
        raise NotImplementedError(
            "Facebook Marketplace listings must be removed manually by the account owner."
        )
