"""
test_ebay_inventory.py
~~~~~~~~~~~~~~~~~~~~~~
Standalone test for the eBay Inventory API integration.

Usage:
    cd backend
    .\\venv\\Scripts\\Activate.ps1
    python test_ebay_inventory.py

What it does:
  1. Creates (or updates) an inventory item via PUT inventory_item/{sku}
  2. Creates an offer for that item  (or reuses an existing one)
  3. Publishes the offer            → prints the resulting listingId
  4. Prints a full summary

Requires in .env:
  EBAY_MOCK_MODE=false
  EBAY_USER_TOKEN=<user token with sell.inventory + sell.account scopes>
  EBAY_CLIENT_ID / EBAY_CLIENT_SECRET  (for app-token fallback logging)
"""
from __future__ import annotations

import asyncio
import os
import sys
import json

# Add the backend root to the path so app.* imports work when run directly.
sys.path.insert(0, os.path.dirname(__file__))

from dotenv import load_dotenv
load_dotenv()

from app.config.settings import get_settings
from app.services.marketplaces.ebay import (
    EbayAPIClient,
    EbayAPIError,
    EbayConfigError,
    build_inventory_item_payload,
    build_offer_payload,
)

# ── Test vehicle data ─────────────────────────────────────────────────────────

TEST_VIN = "1HGBH41JXMN109186"   # Fictitious VIN — safe for sandbox
TEST_SKU = f"NOVA-TEST-{TEST_VIN[:10]}"

TEST_INVENTORY = build_inventory_item_payload(
    title="2021 Honda Accord Sport — NOVA Motors Test",
    description=(
        "This is a test listing created by the NOVA Motors eBay integration test. "
        "2021 Honda Accord Sport — clean title, one owner, full service history.\n\n"
        "Key Features:\n"
        "• Honda Sensing suite (adaptive cruise, lane-keep assist)\n"
        "• Apple CarPlay / Android Auto\n"
        "• Heated front seats\n"
        "• 19-inch sport alloy wheels\n"
        "• 192 hp 1.5L turbocharged engine"
    ),
    make="Honda",
    model="Accord",
    year=2021,
    vin=TEST_VIN,
    mileage=28_500,
    body_type="Sedan",
    color="Sonic Gray Pearl",
    engine="1.5L Turbocharged I4",
    drive="FWD",
    transmission="CVT",
    fuel_type="Gasoline",
)


async def run_test() -> None:
    settings = get_settings()

    print("=" * 65)
    print("  NOVA Motors — eBay Inventory API Test")
    print("=" * 65)
    print(f"  Environment : {settings.EBAY_ENVIRONMENT}")
    print(f"  Marketplace : {settings.EBAY_MARKETPLACE_ID}")
    print(f"  SKU         : {TEST_SKU}")
    print(f"  Mock mode   : {settings.EBAY_MOCK_MODE}")
    print(f"  Refresh token : {'SET' if settings.EBAY_REFRESH_TOKEN else 'NOT SET'}")
    print(f"  User token    : {'SET' if settings.EBAY_USER_TOKEN else 'NOT SET'}")
    print("=" * 65)

    if settings.EBAY_MOCK_MODE:
        print("\n[WARN] EBAY_MOCK_MODE=true — set it to false in .env to test real API.\n")
        return

    has_token = settings.EBAY_REFRESH_TOKEN or settings.EBAY_USER_TOKEN or settings.EBAY_ACCESS_TOKEN
    if not has_token:
        print(
            "\n[ERROR] No eBay user token configured.\n"
            "  Set one of the following in backend/.env:\n"
            "    EBAY_REFRESH_TOKEN=<long-lived token from OAuth flow>  ← preferred\n"
            "    EBAY_USER_TOKEN=<static 2-hour token>                  ← legacy\n"
            "  Run the OAuth flow: GET http://localhost:8000/api/ebay/oauth/authorize\n"
            "  (header: X-Admin-Auth: true)\n"
        )
        return

    client = EbayAPIClient()

    # ── Step 1 — Fetch / auto-select business policies ────────────────────────
    print("\n[1/3] Fetching business policies …")
    try:
        policies = await client.fetch_policies()
    except (EbayAPIError, EbayConfigError) as exc:
        print(f"  [FAIL] Policy fetch: {exc}")
        if isinstance(exc, EbayAPIError):
            print(f"         HTTP {exc.status_code} — {json.dumps(exc.body, indent=2)}")
        return

    print(f"  Fulfillment policy : {policies['fulfillment_id']}")
    print(f"  Payment policy     : {policies['payment_id']}")
    print(f"  Return policy      : {policies['return_id']}")

    # ── Step 2 — Upsert inventory item ────────────────────────────────────────
    print(f"\n[2/4] Upserting inventory item (SKU={TEST_SKU}) …")
    try:
        await client.upsert_inventory_item(TEST_SKU, TEST_INVENTORY)
        print("  Inventory item upserted OK")
    except EbayAPIError as exc:
        print(f"  [FAIL] upsert_inventory_item: HTTP {exc.status_code} — {exc}")
        print(f"         {json.dumps(exc.body, indent=2)}")
        return

    # ── Step 3 — Create or reuse offer ────────────────────────────────────────
    print(f"\n[3/4] Creating offer for SKU={TEST_SKU} …")

    price = 28_950.00
    offer_payload = build_offer_payload(
        sku=TEST_SKU,
        price=price,
        category_id="6001",  # Cars & Trucks
        marketplace_id=settings.EBAY_MARKETPLACE_ID,
        fulfillment_policy_id=policies["fulfillment_id"],
        payment_policy_id=policies["payment_id"],
        return_policy_id=policies["return_id"],
        listing_description=TEST_INVENTORY["product"]["description"],
    )

    existing_offer = await client.get_offer_by_sku(TEST_SKU)
    if existing_offer:
        offer_id = existing_offer["offerId"]
        print(f"  Reusing existing offer: offerId={offer_id}")
    else:
        try:
            offer_id = await client.create_offer(offer_payload)
            print(f"  Offer created: offerId={offer_id}")
        except EbayAPIError as exc:
            print(f"  [FAIL] create_offer: HTTP {exc.status_code} — {exc}")
            print(f"         {json.dumps(exc.body, indent=2)}")
            return

    # ── Step 4 — Publish offer ────────────────────────────────────────────────
    print(f"\n[4/4] Publishing offer {offer_id} …")
    try:
        listing_id = await client.publish_offer(offer_id)
    except EbayAPIError as exc:
        print(f"  [FAIL] publish_offer: HTTP {exc.status_code} — {exc}")
        print(f"         {json.dumps(exc.body, indent=2)}")
        return

    # ── Summary ───────────────────────────────────────────────────────────────
    print("\n" + "=" * 65)
    print("  SUCCESS")
    print("=" * 65)
    print(f"  Listing ID  : {listing_id}")
    print(f"  Offer ID    : {offer_id}")
    print(f"  SKU         : {TEST_SKU}")
    print(f"  Price       : ${price:,.2f}")
    if settings.EBAY_ENVIRONMENT == "sandbox":
        print(f"  URL: https://www.sandbox.ebay.com/itm/{listing_id}")
    else:
        print(f"  URL: https://www.ebay.com/itm/{listing_id}")
    print("=" * 65 + "\n")


if __name__ == "__main__":
    asyncio.run(run_test())
