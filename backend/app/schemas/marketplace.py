"""
marketplace.py  (schemas)
~~~~~~~~~~~~~~~~~~~~~~~~~
Pydantic schemas for marketplace publish / status / listing responses.
"""
from __future__ import annotations

from datetime import datetime
from typing import Optional
from pydantic import BaseModel


class EbayPublishResult(BaseModel):
    """Response returned by the publish-ebay and unpublish-ebay endpoints."""

    success: bool
    listing_id: Optional[str] = None
    status: str
    message: str
    error: Optional[str] = None


class MarketplaceStatusOut(BaseModel):
    """Current marketplace publishing state for a vehicle."""

    vehicle_id: str
    ebay_listing_id: Optional[str] = None
    ebay_status: str
    ebay_last_sync_at: Optional[datetime] = None
    ebay_error_message: Optional[str] = None


class FacebookListingOut(BaseModel):
    """Facebook Marketplace listing payload (copy/paste only, no direct posting)."""

    title: str
    price: str
    description: str
    year: int
    make: str
    model: str
    mileage: int
    vin: str
    color: Optional[str] = None
    body_type: Optional[str] = None
    specs: list[str]
    features: list[str]
    image_urls: list[str]
    copy_paste_text: str
