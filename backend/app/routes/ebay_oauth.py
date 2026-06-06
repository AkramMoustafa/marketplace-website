"""
ebay_oauth.py  (routes)
~~~~~~~~~~~~~~~~~~~~~~~
eBay Authorization Code flow — obtains a long-lived refresh token.

Flow
----
1. Admin calls GET /api/ebay/oauth/authorize
   Returns the eBay consent URL to open in a browser.

2. Admin opens that URL in a browser, signs in with their eBay sandbox seller
   account, and clicks Accept.

3. eBay redirects the browser to:
      GET /api/ebay/oauth/callback?code=<auth_code>

4. The callback endpoint exchanges the code for:
      access_token   — short-lived (~2 h)
      refresh_token  — long-lived (~18 months)

5. The refresh token is displayed on screen and logged.
   Copy it and set EBAY_REFRESH_TOKEN in backend/.env.
   The EbayTokenManager will then refresh automatically forever.

Endpoint security
-----------------
/authorize  — requires X-Admin-Auth: true  (same as all admin routes).
/callback   — publicly reachable; eBay's browser redirect cannot carry auth headers.
/declined   — publicly reachable; shown when the user clicks "I decline" on eBay.
"""
from __future__ import annotations

import base64
import logging
import urllib.parse

import httpx
from fastapi import APIRouter, Depends, Header, HTTPException, Query, status
from fastapi.responses import HTMLResponse, JSONResponse

from app.config.settings import get_settings

log = logging.getLogger(__name__)

router = APIRouter(prefix="/api/ebay/oauth", tags=["eBay OAuth"])


# ── Admin-auth dependency ─────────────────────────────────────────────────────

async def _require_admin(x_admin_auth: str | None = Header(default=None)) -> None:
    if x_admin_auth != "true":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Admin authentication required. Set header X-Admin-Auth: true.",
        )


# ── Helper: eBay token-endpoint base URL ─────────────────────────────────────

def _base_url() -> str:
    s = get_settings()
    return (
        "https://api.sandbox.ebay.com"
        if s.EBAY_ENVIRONMENT == "sandbox"
        else "https://api.ebay.com"
    )


def _auth_base_url() -> str:
    s = get_settings()
    return (
        "https://auth.sandbox.ebay.com"
        if s.EBAY_ENVIRONMENT == "sandbox"
        else "https://auth.ebay.com"
    )


# ── Step 1: build the authorization URL ──────────────────────────────────────

@router.get(
    "/authorize",
    summary="Generate the eBay consent URL",
    description=(
        "Returns the URL to open in a browser to start the eBay OAuth Authorization "
        "Code flow. Requires X-Admin-Auth: true header."
    ),
    dependencies=[Depends(_require_admin)],
)
async def get_authorize_url() -> JSONResponse:
    s = get_settings()

    if not s.EBAY_CLIENT_ID:
        raise HTTPException(status_code=500, detail="EBAY_CLIENT_ID is not set in .env")
    if not s.EBAY_REDIRECT_URI:
        raise HTTPException(
            status_code=500,
            detail=(
                "EBAY_REDIRECT_URI is not set in .env. "
                "Register http://localhost:8000/api/ebay/oauth/callback in the eBay "
                "Developer Portal (Application Keys -> OAuth -> Add a Redirect URL), "
                "then copy the assigned RuName into EBAY_REDIRECT_URI."
            ),
        )

    scopes = " ".join([
        "https://api.ebay.com/oauth/api_scope/sell.inventory",
        "https://api.ebay.com/oauth/api_scope/sell.account",
    ])

    params = {
        "client_id": s.EBAY_CLIENT_ID,
        "redirect_uri": s.EBAY_REDIRECT_URI,
        "response_type": "code",
        "scope": scopes,
    }
    auth_url = f"{_auth_base_url()}/oauth2/authorize?{urllib.parse.urlencode(params)}"

    log.info("[eBay OAuth] Generated authorization URL for environment=%s", s.EBAY_ENVIRONMENT)

    return JSONResponse({
        "authorize_url": auth_url,
        "instructions": (
            "Open authorize_url in a browser. Sign in with your eBay sandbox seller "
            "account and click Accept. The browser will be redirected to "
            "/api/ebay/oauth/callback where the refresh token will be displayed."
        ),
        "environment": s.EBAY_ENVIRONMENT,
        "redirect_uri_runame": s.EBAY_REDIRECT_URI,
    })


# ── Step 2: exchange code for tokens ─────────────────────────────────────────

@router.get(
    "/callback",
    response_class=HTMLResponse,
    summary="eBay OAuth callback — exchanges auth code for refresh token",
    description=(
        "eBay redirects the browser here after the user accepts. "
        "Exchanges the authorization code for an access token and refresh token."
    ),
    include_in_schema=False,  # hide from Swagger — eBay calls this, not the API consumer
)
async def ebay_oauth_callback(
    code: str | None = Query(default=None),
    expires_in: int | None = Query(default=None),
    # eBay also sends these on some flows
    state: str | None = Query(default=None),
    error: str | None = Query(default=None),
    error_description: str | None = Query(default=None),
) -> HTMLResponse:
    if error:
        log.warning("[eBay OAuth] Callback received error: %s — %s", error, error_description)
        return _html_error(error, error_description or "No description provided.")

    if not code:
        log.warning("[eBay OAuth] Callback called with no code and no error")
        return _html_error("missing_code", "No authorization code was received from eBay.")

    s = get_settings()
    log.info("[eBay OAuth] Received auth code (len=%d), exchanging for tokens...", len(code))

    credentials = base64.b64encode(
        f"{s.EBAY_CLIENT_ID}:{s.EBAY_CLIENT_SECRET}".encode()
    ).decode()

    token_url = f"{_base_url()}/identity/v1/oauth2/token"

    try:
        async with httpx.AsyncClient(timeout=15) as client:
            resp = await client.post(
                token_url,
                headers={
                    "Authorization": f"Basic {credentials}",
                    "Content-Type": "application/x-www-form-urlencoded",
                },
                data={
                    "grant_type": "authorization_code",
                    "code": code,
                    "redirect_uri": s.EBAY_REDIRECT_URI,
                },
            )
    except httpx.RequestError as exc:
        log.error("[eBay OAuth] Token exchange network error: %s", exc)
        return _html_error("network_error", str(exc))

    log.info("[eBay OAuth] Token endpoint response: HTTP %s", resp.status_code)

    if not resp.is_success:
        body: dict = {}
        try:
            body = resp.json()
        except Exception:
            body = {"raw": resp.text}
        log.error("[eBay OAuth] Token exchange failed: HTTP %s — %s", resp.status_code, body)
        err_msg = body.get("error_description") or body.get("error") or str(body)
        return _html_error(f"HTTP {resp.status_code}", err_msg)

    data = resp.json()
    access_token: str = data.get("access_token", "")
    refresh_token: str = data.get("refresh_token", "")
    token_expires_in: int = int(data.get("expires_in", 7200))
    refresh_expires_in: int = int(data.get("refresh_token_expires_in", 0))

    log.info(
        "[eBay OAuth] Token exchange successful — access_token expires in %ds, "
        "refresh_token expires in %ds",
        token_expires_in,
        refresh_expires_in,
    )
    # Log the refresh token so it can be recovered from server logs if needed
    log.info("[eBay OAuth] REFRESH TOKEN (save to EBAY_REFRESH_TOKEN in .env): %s", refresh_token)

    refresh_days = refresh_expires_in // 86400 if refresh_expires_in else "unknown"

    return _html_success(
        access_token=access_token,
        refresh_token=refresh_token,
        access_expires_in=token_expires_in,
        refresh_days=refresh_days,
        environment=s.EBAY_ENVIRONMENT,
    )


# ── Declined callback ─────────────────────────────────────────────────────────

@router.get(
    "/declined",
    response_class=HTMLResponse,
    summary="eBay OAuth declined callback",
    include_in_schema=False,
)
async def ebay_oauth_declined(
    error: str | None = Query(default=None),
    error_description: str | None = Query(default=None),
) -> HTMLResponse:
    log.warning("[eBay OAuth] User declined eBay authorization: %s", error_description or error)
    return _html_error(
        error or "access_denied",
        error_description or "You declined to authorise the application on eBay.",
    )


# ── HTML response helpers ─────────────────────────────────────────────────────

def _html_success(
    access_token: str,
    refresh_token: str,
    access_expires_in: int,
    refresh_days: int | str,
    environment: str,
) -> HTMLResponse:
    access_h = access_expires_in // 3600
    access_m = (access_expires_in % 3600) // 60

    html = f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>eBay OAuth - Success</title>
  <style>
    body {{ font-family: system-ui, sans-serif; max-width: 860px; margin: 40px auto; padding: 0 24px; background: #0f0f0f; color: #e5e5e5; }}
    h1 {{ color: #C9A84C; }}
    h2 {{ color: #aaa; font-size: 1rem; font-weight: 600; margin-top: 2rem; }}
    .token-box {{
      background: #1a1a1a; border: 1px solid #333; border-radius: 8px;
      padding: 16px; font-family: monospace; font-size: 0.82rem;
      word-break: break-all; color: #a3e635; position: relative;
    }}
    .copy-btn {{
      position: absolute; top: 10px; right: 10px;
      background: #C9A84C; color: #000; border: none; padding: 4px 12px;
      border-radius: 4px; cursor: pointer; font-size: 0.78rem; font-weight: 600;
    }}
    .copy-btn:hover {{ background: #e2bf6c; }}
    .env-block {{
      background: #111; border: 1px solid #2a2a2a; border-radius: 8px;
      padding: 16px; font-family: monospace; font-size: 0.82rem; color: #7dd3fc;
    }}
    .badge {{ display: inline-block; padding: 2px 10px; border-radius: 12px; font-size: 0.78rem; font-weight: 600; }}
    .sandbox {{ background: #713f12; color: #fde68a; }}
    .production {{ background: #14532d; color: #bbf7d0; }}
    .info {{ color: #9ca3af; font-size: 0.88rem; line-height: 1.6; }}
    .warning {{ background: #1c1208; border: 1px solid #92400e; border-radius: 8px; padding: 12px 16px; color: #fde68a; font-size: 0.88rem; margin-top: 1rem; }}
    hr {{ border-color: #2a2a2a; margin: 2rem 0; }}
  </style>
</head>
<body>
  <h1>eBay OAuth - Authorization Successful</h1>
  <p><span class="badge {'sandbox' if environment == 'sandbox' else 'production'}">{environment.upper()}</span></p>
  <p class="info">
    Copy <strong>EBAY_REFRESH_TOKEN</strong> into <code>backend/.env</code>.
    Once set, <code>EbayTokenManager</code> will refresh the access token automatically every ~2 hours.
  </p>

  <hr>

  <h2>EBAY_REFRESH_TOKEN  (expires in ~{refresh_days} days)</h2>
  <div class="token-box" id="refresh">
    <button class="copy-btn" onclick="copy('refresh')">Copy</button>
    {refresh_token}
  </div>

  <h2>EBAY_ACCESS_TOKEN  (expires in {access_h}h {access_m}m — optional seed)</h2>
  <div class="token-box" id="access">
    <button class="copy-btn" onclick="copy('access')">Copy</button>
    {access_token}
  </div>

  <hr>

  <h2>Paste into backend/.env</h2>
  <div class="env-block">
EBAY_REFRESH_TOKEN={refresh_token}<br>
EBAY_ACCESS_TOKEN={access_token}
  </div>

  <div class="warning">
    <strong>Security:</strong> These tokens grant sell access to your eBay account.
    Never commit them to version control.
  </div>

  <script>
    function copy(id) {{
      const el = document.getElementById(id);
      const text = el.innerText.replace('Copy', '').trim();
      navigator.clipboard.writeText(text);
    }}
  </script>
</body>
</html>"""
    return HTMLResponse(content=html, status_code=200)


def _html_error(error: str, description: str) -> HTMLResponse:
    html = f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>eBay OAuth - Error</title>
  <style>
    body {{ font-family: system-ui, sans-serif; max-width: 700px; margin: 40px auto; padding: 0 24px; background: #0f0f0f; color: #e5e5e5; }}
    h1 {{ color: #f87171; }}
    code {{ background: #1a1a1a; padding: 2px 6px; border-radius: 4px; color: #fca5a5; }}
    .desc {{ color: #9ca3af; }}
  </style>
</head>
<body>
  <h1>eBay OAuth - Authorization Failed</h1>
  <p><strong>Error:</strong> <code>{error}</code></p>
  <p class="desc">{description}</p>
  <p>Return to the eBay Developer Portal and try again, or check the backend server logs for details.</p>
</body>
</html>"""
    return HTMLResponse(content=html, status_code=400)
