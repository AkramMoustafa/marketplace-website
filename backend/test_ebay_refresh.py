"""
test_ebay_refresh.py
~~~~~~~~~~~~~~~~~~~~
Standalone test for the eBay OAuth token refresh flow.

Usage:
    cd backend
    .\\venv\\Scripts\\Activate.ps1
    python test_ebay_refresh.py

What it does:
  1. Forces a new access token via EBAY_REFRESH_TOKEN (grant_type=refresh_token).
  2. Prints the new token (first 40 chars), its expiry time, and seconds remaining.
  3. Verifies Inventory API access by listing up to 5 existing inventory items.
  4. Prints suggested .env values (EBAY_ACCESS_TOKEN + EBAY_TOKEN_EXPIRES_AT)
     that you can paste in to warm-start future runs.

Requires in .env:
  EBAY_MOCK_MODE=false
  EBAY_CLIENT_ID=...
  EBAY_CLIENT_SECRET=...
  EBAY_REFRESH_TOKEN=...   <-- long-lived token from Authorization Code flow
"""
from __future__ import annotations

import asyncio
import datetime
import os
import sys
import time

sys.path.insert(0, os.path.dirname(__file__))

from dotenv import load_dotenv
load_dotenv()

from app.config.settings import get_settings
from app.services.marketplaces.ebay import (
    EbayAPIClient,
    EbayAPIError,
    EbayConfigError,
    EbayTokenManager,
)


async def run_test() -> None:
    settings = get_settings()

    print("=" * 65)
    print("  NOVA Motors -- eBay Token Refresh Test")
    print("=" * 65)
    print(f"  Environment    : {settings.EBAY_ENVIRONMENT}")
    print(f"  Client ID      : {settings.EBAY_CLIENT_ID[:20]}..." if settings.EBAY_CLIENT_ID else "  Client ID      : NOT SET")
    print(f"  Refresh token  : {'SET (' + settings.EBAY_REFRESH_TOKEN[:20] + '...)' if settings.EBAY_REFRESH_TOKEN else 'NOT SET'}")
    print(f"  Mock mode      : {settings.EBAY_MOCK_MODE}")
    print("=" * 65)

    if settings.EBAY_MOCK_MODE:
        print("\n[WARN] EBAY_MOCK_MODE=true -- set it to false in .env to test real API.\n")
        return

    if not settings.EBAY_REFRESH_TOKEN:
        print(
            "\n[ERROR] EBAY_REFRESH_TOKEN is not set.\n"
            "\nHow to obtain a refresh token:\n"
            "  1. Go to developer.ebay.com -> Application Keys -> your sandbox app\n"
            "  2. Click 'User Tokens' -> 'Get a Token from eBay via Your Application'\n"
            "  3. Sign in with your sandbox seller account\n"
            "  4. Copy the refresh_token from the response JSON\n"
            "  5. Paste it into EBAY_REFRESH_TOKEN in backend/.env\n"
        )
        return

    if not settings.EBAY_CLIENT_ID or not settings.EBAY_CLIENT_SECRET:
        print("\n[ERROR] EBAY_CLIENT_ID or EBAY_CLIENT_SECRET is not set.\n")
        return

    # ── Step 1: Force a token refresh ────────────────────────────────────────
    print("\n[1/3] Forcing access token refresh via EBAY_REFRESH_TOKEN ...")

    manager = EbayTokenManager()
    try:
        access_token, expires_at = await manager.force_refresh()
    except EbayConfigError as exc:
        print(f"  [FAIL] Config error: {exc}")
        return
    except EbayAPIError as exc:
        print(f"  [FAIL] eBay API error (HTTP {exc.status_code}): {exc}")
        print(f"         Response body: {exc.body}")
        return

    now = time.time()
    expires_dt = datetime.datetime.fromtimestamp(expires_at)
    remaining = int(expires_at - now)
    remaining_h = remaining // 3600
    remaining_m = (remaining % 3600) // 60

    print(f"  Refresh successful.")
    print(f"  Access token   : {access_token[:40]}...")
    print(f"  Expires at     : {expires_dt.strftime('%Y-%m-%d %H:%M:%S')} local")
    print(f"  Remaining      : {remaining_h}h {remaining_m}m ({remaining} seconds)")

    # ── Step 2: Verify Inventory API access ───────────────────────────────────
    print("\n[2/3] Verifying Inventory API access (GET /sell/inventory/v1/inventory_item) ...")

    client = EbayAPIClient()
    try:
        resp = await client.request(
            "GET",
            "/sell/inventory/v1/inventory_item",
            params={"limit": 5},
        )
        total = resp.get("total", 0)
        items = resp.get("inventoryItems", [])
        print(f"  Inventory API OK -- {total} total item(s) in your sandbox account.")
        if items:
            print("  First 5 SKUs:")
            for item in items:
                sku = item.get("sku", "(no sku)")
                print(f"    - {sku}")
        else:
            print("  No existing inventory items (account is empty -- that is fine).")
    except EbayAPIError as exc:
        print(f"  [FAIL] Inventory API call failed (HTTP {exc.status_code}): {exc}")
        print(f"         Response body: {exc.body}")
        print(
            "\n  Common causes:\n"
            "    403: Refresh token lacks sell.inventory scope.\n"
            "         Re-authorise via User Tokens with scopes: sell.inventory  sell.account\n"
            "    401: Refresh token is invalid or expired (refresh tokens last ~18 months).\n"
        )
        return

    # ── Step 3: Print .env seed values ───────────────────────────────────────
    print("\n[3/3] Suggested .env values to warm-start future runs:")
    print("-" * 65)
    print(f"EBAY_ACCESS_TOKEN={access_token}")
    print(f"EBAY_TOKEN_EXPIRES_AT={expires_at:.0f}")
    print("-" * 65)
    print(
        "\n  Paste these into backend/.env to skip the refresh round-trip on startup.\n"
        "  They are optional -- the token manager will refresh automatically when needed.\n"
    )

    print("=" * 65)
    print("  ALL CHECKS PASSED")
    print("=" * 65)


if __name__ == "__main__":
    asyncio.run(run_test())
