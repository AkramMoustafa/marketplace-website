"""
ebay.py
~~~~~~~
eBay Inventory API integration for NOVA Motors.

Two-layer design
----------------
EbayAPIClient  — raw async HTTP client: token lifecycle, policies, inventory/offer calls.
EbayPublisher  — high-level publisher that maps Vehicle ORM → eBay payloads
                 and implements the BaseMarketplacePublisher interface.

Token lifecycle (EbayTokenManager)
------------------------------------
Priority order at every API call:
  1. In-memory cached access token — returned immediately if not near expiry.
  2. EBAY_REFRESH_TOKEN grant      — exchanges for a new access token automatically.
  3. EBAY_USER_TOKEN (legacy)      — static token, no auto-refresh, backward compat.

Startup seeding:
  Set EBAY_ACCESS_TOKEN + EBAY_TOKEN_EXPIRES_AT in .env to warm-start the cache
  so the first request doesn't need a refresh round-trip.

Environment variables
---------------------
EBAY_MOCK_MODE              true | false   — skip real API calls (default: true)
EBAY_CLIENT_ID              OAuth client ID
EBAY_CLIENT_SECRET          OAuth client secret
EBAY_DEV_ID                 Developer ID
EBAY_ENVIRONMENT            sandbox | production
EBAY_MARKETPLACE_ID         EBAY_US  (default)
EBAY_REFRESH_TOKEN          Long-lived refresh token — enables indefinite auto-refresh
EBAY_ACCESS_TOKEN           Optional: pre-seed the in-memory access token on startup
EBAY_TOKEN_EXPIRES_AT       Optional: Unix timestamp (float string) of EBAY_ACCESS_TOKEN
EBAY_USER_TOKEN             Legacy static access token (2-hour expiry, no auto-refresh)
EBAY_FULFILLMENT_POLICY_ID  Auto-fetched from Account API if empty
EBAY_PAYMENT_POLICY_ID      Auto-fetched from Account API if empty
EBAY_RETURN_POLICY_ID       Auto-fetched from Account API if empty
"""
from __future__ import annotations

import asyncio
import base64
import logging
import time
from decimal import Decimal
from typing import TYPE_CHECKING, Any

import httpx

from app.config.settings import get_settings
from .base import BaseMarketplacePublisher, PublishResult

if TYPE_CHECKING:
    from app.models.vehicle import Vehicle

log = logging.getLogger(__name__)

_REFRESH_BUFFER_SECONDS = 300  # start refresh 5 minutes before token expires


# ── Custom exceptions ─────────────────────────────────────────────────────────
# Defined first so EbayTokenManager can raise them.

class EbayAPIError(Exception):
    def __init__(self, status_code: int, message: str, body: dict) -> None:
        super().__init__(message)
        self.status_code = status_code
        self.body = body


class EbayConfigError(Exception):
    pass


# ── OAuth token manager ───────────────────────────────────────────────────────

class EbayTokenManager:
    """
    Manages the eBay OAuth user access token with automatic refresh.

    Thread-safety: uses asyncio.Lock — safe for concurrent FastAPI requests.
    Singleton: use _get_token_manager() to get the shared process-level instance.

    Startup seeding
    ---------------
    On first use, loads EBAY_ACCESS_TOKEN + EBAY_TOKEN_EXPIRES_AT from settings
    to warm the in-memory cache.  This avoids a refresh round-trip on the first
    request when EBAY_ACCESS_TOKEN is pre-populated in .env.

    Token priority (per call)
    -------------------------
    1. Cached access token (if not within _REFRESH_BUFFER_SECONDS of expiry)
    2. Refresh via EBAY_REFRESH_TOKEN  → new access token stored in memory
    3. Static EBAY_USER_TOKEN          → returned as-is (no expiry tracking)
    """

    def __init__(self) -> None:
        self._settings = get_settings()
        self._access_token: str | None = None
        self._expires_at: float = 0.0          # Unix timestamp
        self._lock = asyncio.Lock()
        self._initialized = False

    # ── initialisation ────────────────────────────────────────────────────────

    def _load_from_settings(self) -> None:
        """Seed in-memory cache from .env values (called once, inside the lock)."""
        s = self._settings
        if s.EBAY_ACCESS_TOKEN:
            self._access_token = s.EBAY_ACCESS_TOKEN
            try:
                self._expires_at = float(s.EBAY_TOKEN_EXPIRES_AT) if s.EBAY_TOKEN_EXPIRES_AT else 0.0
            except ValueError:
                self._expires_at = 0.0
            remaining = max(0.0, self._expires_at - time.time())
            log.info(
                "[eBay Token] Seeded from .env — access token expires in %.0f seconds",
                remaining,
            )
        self._initialized = True

    # ── validity check ────────────────────────────────────────────────────────

    def _is_valid(self) -> bool:
        """True if the cached token exists and has more than the buffer window left."""
        return bool(self._access_token) and (
            time.time() + _REFRESH_BUFFER_SECONDS < self._expires_at
        )

    # ── public interface ──────────────────────────────────────────────────────

    async def get_access_token(self) -> str:
        """
        Return a valid access token, refreshing automatically when needed.
        Raises EbayConfigError if no token source is configured.
        """
        async with self._lock:
            if not self._initialized:
                self._load_from_settings()

            if self._is_valid():
                remaining = self._expires_at - time.time()
                log.info(
                    "[eBay Token] Access token valid — expires in %.0f seconds",
                    remaining,
                )
                return self._access_token  # type: ignore[return-value]

            # Token is absent, expired, or within the buffer window
            if self._access_token:
                log.info(
                    "[eBay Token] Access token expired or near expiry — will refresh"
                )
            else:
                log.info("[eBay Token] No access token in memory")

            s = self._settings
            if s.EBAY_REFRESH_TOKEN:
                return await self._do_refresh()

            # Backward compat: static EBAY_USER_TOKEN, no expiry tracking
            if s.EBAY_USER_TOKEN:
                log.info(
                    "[eBay Token] No EBAY_REFRESH_TOKEN configured — "
                    "using static EBAY_USER_TOKEN (expires in ~2 h, no auto-refresh). "
                    "Add EBAY_REFRESH_TOKEN to .env to enable automatic token management."
                )
                return s.EBAY_USER_TOKEN

            raise EbayConfigError(
                "No eBay user token available. "
                "Set EBAY_REFRESH_TOKEN (recommended) or EBAY_USER_TOKEN in .env."
            )

    async def force_refresh(self) -> tuple[str, float]:
        """
        Unconditionally exchange the refresh token for a new access token.
        Returns (access_token, expires_at_unix_timestamp).
        Useful for test scripts and admin tooling.
        """
        async with self._lock:
            if not self._initialized:
                self._load_from_settings()
            s = self._settings
            if not s.EBAY_REFRESH_TOKEN:
                raise EbayConfigError(
                    "EBAY_REFRESH_TOKEN is not set. "
                    "Obtain one via the eBay Authorization Code flow."
                )
            token = await self._do_refresh()
            return token, self._expires_at

    # ── internal refresh ──────────────────────────────────────────────────────

    async def _do_refresh(self) -> str:
        """
        POST to the eBay token endpoint with grant_type=refresh_token.
        Caller must already hold self._lock.
        Updates self._access_token and self._expires_at in place.
        """
        s = self._settings
        log.info("[eBay Token] Requesting new access token via refresh_token grant")

        credentials = base64.b64encode(
            f"{s.EBAY_CLIENT_ID}:{s.EBAY_CLIENT_SECRET}".encode()
        ).decode()

        base_url = (
            "https://api.sandbox.ebay.com"
            if s.EBAY_ENVIRONMENT == "sandbox"
            else "https://api.ebay.com"
        )
        token_url = f"{base_url}/identity/v1/oauth2/token"

        log.info("[eBay Token] POST %s (grant_type=refresh_token)", token_url)

        try:
            async with httpx.AsyncClient(timeout=15) as client:
                resp = await client.post(
                    token_url,
                    headers={
                        "Authorization": f"Basic {credentials}",
                        "Content-Type": "application/x-www-form-urlencoded",
                    },
                    data={
                        "grant_type": "refresh_token",
                        "refresh_token": s.EBAY_REFRESH_TOKEN,
                        "scope": (
                            "https://api.ebay.com/oauth/api_scope/sell.inventory "
                            "https://api.ebay.com/oauth/api_scope/sell.account"
                        ),
                    },
                )
        except httpx.RequestError as exc:
            log.error("[eBay Token] Refresh failed (network error): %s", exc)
            raise EbayConfigError(f"Token refresh network error: {exc}") from exc

        log.info("[eBay Token] Token endpoint response: HTTP %s", resp.status_code)

        if not resp.is_success:
            body: dict = {}
            try:
                body = resp.json()
            except Exception:
                body = {"raw": resp.text}
            log.error(
                "[eBay Token] Refresh failed — HTTP %s: %s",
                resp.status_code,
                body,
            )
            raise EbayAPIError(
                resp.status_code,
                f"Token refresh failed: {body.get('error_description') or body}",
                body,
            )

        data = resp.json()
        access_token: str = data["access_token"]
        expires_in: int = int(data.get("expires_in", 7200))

        self._access_token = access_token
        self._expires_at = time.time() + expires_in

        log.info(
            "[eBay Token] Refresh successful — new token expires in %d seconds "
            "(expires_at=%.0f)",
            expires_in,
            self._expires_at,
        )

        return access_token


# Module-level singleton — one token manager per process, shared across all
# EbayAPIClient instances so the in-memory token is never duplicated.
_token_manager: EbayTokenManager | None = None


def _get_token_manager() -> EbayTokenManager:
    global _token_manager
    if _token_manager is None:
        _token_manager = EbayTokenManager()
    return _token_manager


# ── Low-level eBay API client ─────────────────────────────────────────────────

class EbayAPIClient:
    """
    Async eBay REST client.

    Uses EbayTokenManager for all user-token acquisition — never reads
    EBAY_USER_TOKEN directly.  Falls back to the app token (Client Credentials)
    only when no user token source is configured, in which case sell.* calls
    will return 403 with a clear error message.
    """

    def __init__(self) -> None:
        self._settings = get_settings()
        self._app_token_cache: str | None = None
        self._token_manager = _get_token_manager()

    # ── base URL ──────────────────────────────────────────────────────────────

    @property
    def _base(self) -> str:
        return (
            "https://api.sandbox.ebay.com"
            if self._settings.EBAY_ENVIRONMENT == "sandbox"
            else "https://api.ebay.com"
        )

    # ── app-level token (Client Credentials) ─────────────────────────────────

    async def _get_app_token(self) -> str:
        """Client Credentials grant — application-level token (public APIs only)."""
        if self._app_token_cache:
            return self._app_token_cache

        credentials = base64.b64encode(
            f"{self._settings.EBAY_CLIENT_ID}:{self._settings.EBAY_CLIENT_SECRET}".encode()
        ).decode()

        token_url = f"{self._base}/identity/v1/oauth2/token"
        log.info("[eBay] Requesting app token from %s", token_url)

        async with httpx.AsyncClient() as client:
            resp = await client.post(
                token_url,
                headers={
                    "Authorization": f"Basic {credentials}",
                    "Content-Type": "application/x-www-form-urlencoded",
                },
                data={
                    "grant_type": "client_credentials",
                    "scope": "https://api.ebay.com/oauth/api_scope",
                },
            )

        log.info("[eBay] App token response: HTTP %s", resp.status_code)
        resp.raise_for_status()
        token: str = resp.json()["access_token"]
        self._app_token_cache = token
        return token

    # ── auth header ───────────────────────────────────────────────────────────

    async def _auth_header(self) -> str:
        """
        Return the Authorization header value.

        Delegates to EbayTokenManager, which handles:
          - Cache validity check
          - Automatic refresh via EBAY_REFRESH_TOKEN
          - Fallback to static EBAY_USER_TOKEN
        Falls back to the app token only when no user token source exists at all.
        """
        try:
            token = await self._token_manager.get_access_token()
            return f"Bearer {token}"
        except EbayConfigError:
            log.warning(
                "[eBay] No user token available — falling back to app token. "
                "Sell API calls will return 403. "
                "Set EBAY_REFRESH_TOKEN or EBAY_USER_TOKEN in .env."
            )
            app_token = await self._get_app_token()
            return f"Bearer {app_token}"

    # ── generic request ───────────────────────────────────────────────────────

    async def request(
        self,
        method: str,
        path: str,
        *,
        json: dict | None = None,
        params: dict | None = None,
    ) -> dict:
        """Generic eBay API request with full logging."""
        url = f"{self._base}{path}"
        auth = await self._auth_header()
        headers = {
            "Authorization": auth,
            "Content-Type": "application/json",
            "Accept": "application/json",
        }

        log.info("[eBay API] %s %s", method.upper(), url)
        if json:
            log.info("[eBay API] Request body: %s", json)
        if params:
            log.info("[eBay API] Query params: %s", params)

        async with httpx.AsyncClient(timeout=30) as client:
            resp = await client.request(
                method, url, headers=headers, json=json, params=params
            )

        log.info("[eBay API] Response: HTTP %s", resp.status_code)
        body: dict = {}
        if resp.content:
            try:
                body = resp.json()
            except Exception:
                body = {"raw": resp.text}
        log.info("[eBay API] Response body: %s", body)

        if not resp.is_success:
            errors = body.get("errors", [])
            msg = "; ".join(
                f"{e.get('errorId')} {e.get('longMessage', e.get('message', ''))}"
                for e in errors
            ) if errors else body.get("message") or resp.text
            raise EbayAPIError(resp.status_code, msg, body)

        return body

    # ── Business policies ─────────────────────────────────────────────────────

    async def fetch_policies(self) -> dict[str, str]:
        """
        Return {fulfillment_id, payment_id, return_id} from settings or
        auto-fetch the first active policy of each type from the Account API.
        """
        s = self._settings
        marketplace_id = s.EBAY_MARKETPLACE_ID

        fulfillment_id = s.EBAY_FULFILLMENT_POLICY_ID
        payment_id = s.EBAY_PAYMENT_POLICY_ID
        return_id = s.EBAY_RETURN_POLICY_ID

        if not (fulfillment_id and payment_id and return_id):
            log.info("[eBay] One or more policy IDs missing — fetching from Account API")

            if not fulfillment_id:
                r = await self.request(
                    "GET",
                    "/sell/account/v1/fulfillment_policy",
                    params={"marketplace_id": marketplace_id},
                )
                policies = r.get("fulfillmentPolicies", [])
                if policies:
                    fulfillment_id = policies[0]["fulfillmentPolicyId"]
                    log.info("[eBay] Auto-selected fulfillment policy: %s", fulfillment_id)
                else:
                    raise EbayConfigError(
                        "No fulfillment policies found in your eBay seller account. "
                        "Create one at ebay.com/sh/sel/pref/shipping or set "
                        "EBAY_FULFILLMENT_POLICY_ID in .env"
                    )

            if not payment_id:
                r = await self.request(
                    "GET",
                    "/sell/account/v1/payment_policy",
                    params={"marketplace_id": marketplace_id},
                )
                policies = r.get("paymentPolicies", [])
                if policies:
                    payment_id = policies[0]["paymentPolicyId"]
                    log.info("[eBay] Auto-selected payment policy: %s", payment_id)
                else:
                    raise EbayConfigError(
                        "No payment policies found. Create one in eBay Seller Hub or "
                        "set EBAY_PAYMENT_POLICY_ID in .env"
                    )

            if not return_id:
                r = await self.request(
                    "GET",
                    "/sell/account/v1/return_policy",
                    params={"marketplace_id": marketplace_id},
                )
                policies = r.get("returnPolicies", [])
                if policies:
                    return_id = policies[0]["returnPolicyId"]
                    log.info("[eBay] Auto-selected return policy: %s", return_id)
                else:
                    raise EbayConfigError(
                        "No return policies found. Create one in eBay Seller Hub or "
                        "set EBAY_RETURN_POLICY_ID in .env"
                    )

        return {
            "fulfillment_id": fulfillment_id,
            "payment_id": payment_id,
            "return_id": return_id,
        }

    # ── Inventory + Offer API ─────────────────────────────────────────────────

    async def upsert_inventory_item(self, sku: str, payload: dict) -> None:
        """PUT /sell/inventory/v1/inventory_item/{sku} — create or update."""
        log.info("[eBay] Upserting inventory item SKU=%s", sku)
        await self.request("PUT", f"/sell/inventory/v1/inventory_item/{sku}", json=payload)
        log.info("[eBay] Inventory item upserted: SKU=%s", sku)

    async def create_offer(self, payload: dict) -> str:
        """POST /sell/inventory/v1/offer — returns offerId."""
        log.info("[eBay] Creating offer for SKU=%s", payload.get("sku"))
        resp = await self.request("POST", "/sell/inventory/v1/offer", json=payload)
        offer_id: str = resp["offerId"]
        log.info("[eBay] Offer created: offerId=%s", offer_id)
        return offer_id

    async def publish_offer(self, offer_id: str) -> str:
        """POST /sell/inventory/v1/offer/{offerId}/publish — returns listingId."""
        log.info("[eBay] Publishing offer: offerId=%s", offer_id)
        resp = await self.request(
            "POST", f"/sell/inventory/v1/offer/{offer_id}/publish"
        )
        listing_id: str = str(resp.get("listingId", ""))
        log.info("[eBay] Offer published: listingId=%s", listing_id)
        return listing_id

    async def get_offer_by_sku(self, sku: str) -> dict | None:
        """GET /sell/inventory/v1/offer?sku={sku} — return first offer or None."""
        log.info("[eBay] Looking up offer for SKU=%s", sku)
        try:
            resp = await self.request(
                "GET", "/sell/inventory/v1/offer", params={"sku": sku}
            )
            offers = resp.get("offers", [])
            if offers:
                log.info("[eBay] Found %d offer(s) for SKU=%s", len(offers), sku)
                return offers[0]
        except EbayAPIError as exc:
            if exc.status_code == 404:
                return None
            raise
        return None

    async def withdraw_offer(self, offer_id: str) -> None:
        """POST /sell/inventory/v1/offer/{offerId}/withdraw."""
        log.info("[eBay] Withdrawing offer: offerId=%s", offer_id)
        await self.request("POST", f"/sell/inventory/v1/offer/{offer_id}/withdraw")
        log.info("[eBay] Offer withdrawn: offerId=%s", offer_id)

    # ── Full publish flow ─────────────────────────────────────────────────────

    async def publish_listing(
        self,
        sku: str,
        inventory_payload: dict,
        offer_payload: dict,
    ) -> dict:
        """
        Full create-or-update flow:
          1. Upsert inventory item
          2. Create offer (or reuse existing for this SKU)
          3. Publish offer
        Returns {listing_id, offer_id, sku}.
        """
        await self.upsert_inventory_item(sku, inventory_payload)

        existing = await self.get_offer_by_sku(sku)
        if existing:
            offer_id = existing["offerId"]
            log.info("[eBay] Reusing existing offer %s for SKU=%s", offer_id, sku)
        else:
            offer_id = await self.create_offer(offer_payload)

        listing_id = await self.publish_offer(offer_id)

        return {"listing_id": listing_id, "offer_id": offer_id, "sku": sku}


# ── Payload builders ──────────────────────────────────────────────────────────

def build_inventory_item_payload(
    title: str,
    description: str,
    make: str,
    model: str,
    year: int | str,
    vin: str,
    mileage: int | None = None,
    body_type: str | None = None,
    color: str | None = None,
    engine: str | None = None,
    drive: str | None = None,
    transmission: str | None = None,
    fuel_type: str | None = None,
    image_urls: list[str] | None = None,
    condition: str = "USED_GOOD",
) -> dict:
    """Build an eBay InventoryItem payload from individual vehicle fields."""
    aspects: dict[str, list[str]] = {
        "Make": [str(make)],
        "Model": [str(model)],
        "Year": [str(year)],
    }
    if vin:
        aspects["VIN"] = [vin]
    if mileage is not None:
        aspects["Mileage"] = [str(mileage)]
    if body_type:
        aspects["Body Type"] = [body_type]
    if color:
        aspects["Exterior Color"] = [color]
    if engine:
        aspects["Engine"] = [engine]
    if drive:
        aspects["Drive Type"] = [drive]
    if transmission:
        aspects["Transmission"] = [transmission]
    if fuel_type:
        aspects["Fuel Type"] = [fuel_type.replace("_", " ").title()]

    product: dict[str, Any] = {
        "title": title[:80],
        "description": description,
        "aspects": aspects,
    }
    if image_urls:
        product["imageUrls"] = image_urls[:12]

    return {
        "availability": {"shipToLocationAvailability": {"quantity": 1}},
        "condition": condition,
        "product": product,
    }


def build_offer_payload(
    sku: str,
    price: float,
    category_id: str,
    marketplace_id: str,
    fulfillment_policy_id: str,
    payment_policy_id: str,
    return_policy_id: str,
    listing_description: str = "",
    available_quantity: int = 1,
) -> dict:
    """Build an eBay Offer payload."""
    return {
        "sku": sku,
        "marketplaceId": marketplace_id,
        "format": "FIXED_PRICE",
        "availableQuantity": available_quantity,
        "categoryId": category_id,
        "listingDescription": listing_description or "",
        "listingPolicies": {
            "fulfillmentPolicyId": fulfillment_policy_id,
            "paymentPolicyId": payment_policy_id,
            "returnPolicyId": return_policy_id,
        },
        "pricingSummary": {
            "price": {
                "currency": "USD",
                "value": f"{price:.2f}",
            }
        },
    }


# ── High-level publisher ──────────────────────────────────────────────────────

class EbayPublisher(BaseMarketplacePublisher):
    """
    Publishes Vehicle ORM objects to eBay via the Inventory API.

    Modes
    -----
    EBAY_MOCK_MODE=true   — returns synthetic mock_published result (no API calls)
    EBAY_MOCK_MODE=false  — calls real eBay Inventory API via EbayAPIClient
      Token management is handled entirely by EbayTokenManager:
        - Set EBAY_REFRESH_TOKEN for indefinite auto-refresh (recommended)
        - Set EBAY_USER_TOKEN for a static 2-hour token (legacy / testing)
      Business policies are auto-fetched if not set in .env
    """

    _CATEGORY_ID = "6001"  # eBay Motors > Cars & Trucks

    def __init__(self) -> None:
        self._settings = get_settings()
        self._client = EbayAPIClient()

    def _is_mock(self) -> bool:
        return self._settings.EBAY_MOCK_MODE

    # ── mock helpers ──────────────────────────────────────────────────────────

    def _mock_publish(self, vehicle: "Vehicle", action: str = "publish") -> PublishResult:
        fake_id = f"MOCK-{str(vehicle.id)[:8].upper()}"
        log.info("[eBay MOCK] %s vehicle %s -> listing_id=%s", action, vehicle.id, fake_id)
        return PublishResult(
            success=True,
            listing_id=fake_id,
            status="mock_published",
            message="Mock mode active — no real API call was made.",
            raw_response={"mock": True, "action": action, "vehicle_id": str(vehicle.id)},
        )

    # ── vehicle → payload mapping ─────────────────────────────────────────────

    def _inventory_payload(self, vehicle: "Vehicle") -> dict:
        price = float(vehicle.price) if isinstance(vehicle.price, Decimal) else float(vehicle.price or 0)

        description_parts: list[str] = []
        if vehicle.description:
            description_parts.append(vehicle.description)
        if vehicle.features:
            description_parts.append(
                "\n\nKey Features:\n" + "\n".join(f"* {f}" for f in vehicle.features)
            )
        description = (
            "\n".join(description_parts)
            or f"{vehicle.year} {vehicle.make} {vehicle.model}"
        )

        image_urls = [u for u in (vehicle.images or []) if isinstance(u, str)]

        return build_inventory_item_payload(
            title=vehicle.title,
            description=description,
            make=vehicle.make,
            model=vehicle.model,
            year=vehicle.year,
            vin=vehicle.vin or "",
            mileage=vehicle.mileage,
            body_type=vehicle.body_type,
            color=vehicle.color,
            engine=vehicle.engine,
            drive=vehicle.drive,
            transmission=vehicle.transmission.value if vehicle.transmission else None,
            fuel_type=vehicle.fuel_type.value if vehicle.fuel_type else None,
            image_urls=image_urls,
        )

    # ── live publish flow ─────────────────────────────────────────────────────

    async def _live_publish(self, vehicle: "Vehicle") -> PublishResult:
        sku = f"NOVA-{vehicle.vin}"
        price = float(vehicle.price) if isinstance(vehicle.price, Decimal) else float(vehicle.price or 0)

        try:
            policies = await self._client.fetch_policies()
        except (EbayAPIError, EbayConfigError) as exc:
            log.error("[eBay] Policy fetch failed: %s", exc)
            return PublishResult(
                success=False,
                status="policy_error",
                error=str(exc),
            )

        inventory_payload = self._inventory_payload(vehicle)
        offer_payload = build_offer_payload(
            sku=sku,
            price=price,
            category_id=self._CATEGORY_ID,
            marketplace_id=self._settings.EBAY_MARKETPLACE_ID,
            fulfillment_policy_id=policies["fulfillment_id"],
            payment_policy_id=policies["payment_id"],
            return_policy_id=policies["return_id"],
            listing_description=vehicle.description or vehicle.title,
        )

        try:
            result = await self._client.publish_listing(sku, inventory_payload, offer_payload)
        except (EbayAPIError, EbayConfigError) as exc:
            status_code = getattr(exc, "status_code", None)
            body = getattr(exc, "body", {})
            log.error("[eBay] Publish failed%s: %s", f" (HTTP {status_code})" if status_code else "", exc)
            return PublishResult(
                success=False,
                status="failed",
                error=str(exc),
                raw_response=body,
            )

        listing_id = result["listing_id"]
        offer_id = result["offer_id"]
        log.info(
            "[eBay PROD] Published vehicle %s -> listingId=%s offerId=%s",
            vehicle.id, listing_id, offer_id,
        )
        return PublishResult(
            success=True,
            listing_id=listing_id,
            status="published",
            message=f"Live on eBay. Listing ID: {listing_id}  Offer ID: {offer_id}",
            raw_response={
                "status": "published",
                "listing_id": listing_id,
                "offer_id": offer_id,
                "inventory_item": sku,
            },
        )

    # ── BaseMarketplacePublisher interface ────────────────────────────────────

    async def publish_vehicle(self, vehicle: "Vehicle") -> PublishResult:
        if self._is_mock():
            return self._mock_publish(vehicle, "publish")
        return await self._live_publish(vehicle)

    async def update_vehicle(self, vehicle: "Vehicle") -> PublishResult:
        if self._is_mock():
            return self._mock_publish(vehicle, "update")

        sku = f"NOVA-{vehicle.vin}"
        inventory_payload = self._inventory_payload(vehicle)

        try:
            await self._client.upsert_inventory_item(sku, inventory_payload)
            existing = await self._client.get_offer_by_sku(sku)
            if existing:
                offer_id = existing["offerId"]
                listing_id = await self._client.publish_offer(offer_id)
                log.info("[eBay PROD] Updated vehicle %s -> listingId=%s", vehicle.id, listing_id)
                return PublishResult(
                    success=True,
                    listing_id=listing_id,
                    status="published",
                    message=f"Listing updated. Listing ID: {listing_id}",
                    raw_response={"status": "published", "listing_id": listing_id, "offer_id": offer_id},
                )
            return await self._live_publish(vehicle)
        except (EbayAPIError, EbayConfigError) as exc:
            status_code = getattr(exc, "status_code", None)
            body = getattr(exc, "body", {})
            log.error("[eBay] Update failed%s: %s", f" (HTTP {status_code})" if status_code else "", exc)
            return PublishResult(success=False, status="failed", error=str(exc), raw_response=body)

    async def remove_vehicle(self, vehicle: "Vehicle") -> PublishResult:
        if self._is_mock():
            log.info("[eBay MOCK] unpublish vehicle %s", vehicle.id)
            return PublishResult(
                success=True,
                listing_id=vehicle.ebay_listing_id,
                status="draft",
                message="Mock mode — listing removed (no real API call was made).",
            )

        sku = f"NOVA-{vehicle.vin}"
        try:
            existing = await self._client.get_offer_by_sku(sku)
            if existing:
                await self._client.withdraw_offer(existing["offerId"])
                log.info("[eBay PROD] Withdrawn offer for vehicle %s", vehicle.id)
            else:
                log.info("[eBay PROD] No active offer found for SKU=%s, nothing to withdraw", sku)
        except (EbayAPIError, EbayConfigError) as exc:
            status_code = getattr(exc, "status_code", None)
            body = getattr(exc, "body", {})
            log.error("[eBay] Withdraw failed%s: %s", f" (HTTP {status_code})" if status_code else "", exc)
            return PublishResult(success=False, status="failed", error=str(exc), raw_response=body)

        return PublishResult(
            success=True,
            listing_id=None,
            status="draft",
            message="Listing withdrawn from eBay.",
        )
