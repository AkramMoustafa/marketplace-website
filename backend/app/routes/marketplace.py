"""
marketplace.py  (routes)
~~~~~~~~~~~~~~~~~~~~~~~~
Marketplace publishing routes for NOVA Motors vehicles.

Endpoints
---------
POST /api/vehicles/{vehicle_id}/publish-ebay
POST /api/vehicles/{vehicle_id}/unpublish-ebay
GET  /api/vehicles/{vehicle_id}/marketplace-status
POST /api/vehicles/{vehicle_id}/generate-facebook-listing
"""
from __future__ import annotations

import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.models.vehicle import Vehicle
from app.schemas.marketplace import EbayPublishResult, FacebookListingOut, MarketplaceStatusOut
from app.services import vehicle_service
from app.services.marketplaces.ebay import EbayPublisher
from app.services.marketplaces.facebook import FacebookPublisher

router = APIRouter(prefix="/api/vehicles", tags=["Marketplace"])

# Service instances are stateless — safe to reuse across requests.
_ebay = EbayPublisher()
_facebook = FacebookPublisher()


# ── helpers ──────────────────────────────────────────────────────────────────

async def _get_vehicle_or_404(vehicle_id: uuid.UUID, db: AsyncSession) -> Vehicle:
    vehicle = await vehicle_service.get_vehicle(db, vehicle_id)
    if not vehicle:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Vehicle {vehicle_id} not found",
        )
    return vehicle


# ── eBay endpoints ────────────────────────────────────────────────────────────

@router.post(
    "/{vehicle_id}/publish-ebay",
    response_model=EbayPublishResult,
    summary="Publish a vehicle to eBay Motors",
    description=(
        "Creates (or updates) an eBay Motors listing for the vehicle. "
        "When EBAY_MOCK_MODE=true no real API call is made and status is set "
        "to 'mock_published' so the feature can be demoed before eBay developer "
        "approval is complete."
    ),
)
async def publish_to_ebay(
    vehicle_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
) -> EbayPublishResult:
    vehicle = await _get_vehicle_or_404(vehicle_id, db)

    # If the vehicle already has an active listing, update it instead.
    if vehicle.ebay_listing_id and vehicle.ebay_status not in ("draft", "failed"):
        result = await _ebay.update_vehicle(vehicle)
    else:
        result = await _ebay.publish_vehicle(vehicle)

    # Persist the result.
    vehicle.ebay_listing_id = result.listing_id or vehicle.ebay_listing_id
    vehicle.ebay_status = result.status
    vehicle.ebay_last_sync_at = datetime.now(timezone.utc)
    vehicle.ebay_error_message = result.error
    await db.commit()
    await db.refresh(vehicle)

    return EbayPublishResult(
        success=result.success,
        listing_id=result.listing_id,
        status=result.status,
        message=result.message,
        error=result.error,
    )


@router.post(
    "/{vehicle_id}/unpublish-ebay",
    response_model=EbayPublishResult,
    summary="Remove a vehicle listing from eBay Motors",
)
async def unpublish_from_ebay(
    vehicle_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
) -> EbayPublishResult:
    vehicle = await _get_vehicle_or_404(vehicle_id, db)

    result = await _ebay.remove_vehicle(vehicle)

    vehicle.ebay_status = result.status
    # Clear the listing ID if successfully returned to draft.
    if result.status == "draft":
        vehicle.ebay_listing_id = None
    vehicle.ebay_last_sync_at = datetime.now(timezone.utc)
    vehicle.ebay_error_message = result.error
    await db.commit()
    await db.refresh(vehicle)

    return EbayPublishResult(
        success=result.success,
        listing_id=result.listing_id,
        status=result.status,
        message=result.message,
        error=result.error,
    )


# ── status endpoint ───────────────────────────────────────────────────────────

@router.get(
    "/{vehicle_id}/marketplace-status",
    response_model=MarketplaceStatusOut,
    summary="Get current marketplace publishing status for a vehicle",
)
async def get_marketplace_status(
    vehicle_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
) -> MarketplaceStatusOut:
    vehicle = await _get_vehicle_or_404(vehicle_id, db)
    return MarketplaceStatusOut(
        vehicle_id=str(vehicle.id),
        ebay_listing_id=vehicle.ebay_listing_id,
        ebay_status=vehicle.ebay_status or "draft",
        ebay_last_sync_at=vehicle.ebay_last_sync_at,
        ebay_error_message=vehicle.ebay_error_message,
    )


# ── Facebook endpoint ─────────────────────────────────────────────────────────

@router.post(
    "/{vehicle_id}/generate-facebook-listing",
    response_model=FacebookListingOut,
    summary="Generate a Facebook Marketplace listing (copy/paste text only)",
    description=(
        "Generates a structured Facebook Marketplace listing with a ready-to-paste "
        "text block. Facebook does not support automated posting, so no external "
        "API call is made."
    ),
)
async def generate_facebook_listing(
    vehicle_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
) -> FacebookListingOut:
    vehicle = await _get_vehicle_or_404(vehicle_id, db)
    payload = await _facebook.generate_listing(vehicle)
    return FacebookListingOut(**payload)
