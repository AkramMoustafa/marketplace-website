"""
Test eBay Client Credentials (application-level) OAuth grant.

Run from backend/ with the venv active:
    python test_ebay_oauth.py
"""
import asyncio
import base64
import os

import httpx
from dotenv import load_dotenv

load_dotenv()

CLIENT_ID = os.getenv("EBAY_CLIENT_ID", "")
CLIENT_SECRET = os.getenv("EBAY_CLIENT_SECRET", "")
ENVIRONMENT = os.getenv("EBAY_ENVIRONMENT", "sandbox")

TOKEN_URL = (
    "https://api.sandbox.ebay.com/identity/v1/oauth2/token"
    if ENVIRONMENT == "sandbox"
    else "https://api.ebay.com/identity/v1/oauth2/token"
)

SCOPE = "https://api.ebay.com/oauth/api_scope"


async def main() -> None:
    if not CLIENT_ID or not CLIENT_SECRET:
        print("ERROR: EBAY_CLIENT_ID or EBAY_CLIENT_SECRET is not set in .env")
        return

    credentials = base64.b64encode(f"{CLIENT_ID}:{CLIENT_SECRET}".encode()).decode()
    print(f"Environment : {ENVIRONMENT}")
    print(f"Token URL   : {TOKEN_URL}")
    print(f"Client ID   : {CLIENT_ID}")
    print()

    async with httpx.AsyncClient() as client:
        resp = await client.post(
            TOKEN_URL,
            headers={
                "Authorization": f"Basic {credentials}",
                "Content-Type": "application/x-www-form-urlencoded",
            },
            data={"grant_type": "client_credentials", "scope": SCOPE},
        )

    print(f"HTTP status : {resp.status_code}")

    data = resp.json()
    if resp.status_code == 200:
        token: str = data.get("access_token", "")
        print(f"Token type  : {data.get('token_type')}")
        print(f"Expires in  : {data.get('expires_in')}s")
        print(f"Token prefix: {token[:40]}...")
        print("\nSUCCESS — credentials are valid.")
    else:
        print(f"Error       : {data}")
        print("\nFAILED — check your Client ID / Secret and environment.")


asyncio.run(main())
