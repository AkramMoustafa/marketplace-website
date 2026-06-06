"""
web_search_market.py
~~~~~~~~~~~~~~~~~~~~
Node 2 — Web-searches for the current market price range and key selling
points for the decoded vehicle.

Strategy:
  1. Run two DuckDuckGo searches (no API key required).
  2. Feed the snippets to GPT-4o-mini to extract a price range and selling
     points.
  3. If DuckDuckGo is rate-limited or unavailable, fall back to GPT-4o-mini
     using its training knowledge — the price estimate will be labelled
     "(AI estimate)".

Requires: OPENAI_API_KEY in environment / settings.
"""
from __future__ import annotations

import asyncio
import json
import logging
from typing import Any

from openai import AsyncOpenAI

from app.config.settings import get_settings
from .state import AgentState

log = logging.getLogger(__name__)


# ── DuckDuckGo helper ─────────────────────────────────────────────────────────

def _ddg_search(query: str, max_results: int = 10) -> list[dict[str, Any]]:
    """Synchronous DDGS text search — call via asyncio.to_thread."""
    from ddgs import DDGS
    with DDGS() as ddgs:
        results = list(ddgs.text(query, max_results=max_results))
    log.info("[WebSearch] DDGS returned %d results for: %s", len(results), query)
    log.info("[WebSearch] DDGS raw results: %s", results)
    return results


def _snippets(results: list[dict[str, Any]]) -> str:
    """Extract title+body pairs. DDGS field names: title, href, body."""
    lines = []
    for r in results:
        body = r.get("body", "")
        if body:
            lines.append(f"{r.get('title', '')}: {body}")
    return "\n".join(lines)


# ── Main node ─────────────────────────────────────────────────────────────────

async def web_search_market(state: AgentState) -> AgentState:
    """Search for market price range and key selling points."""
    errors: dict = dict(state.get("errors") or {})

    # Short-circuit if NHTSA failed — nothing useful to search
    if errors.get("lookup_nhtsa"):
        return state

    settings = get_settings()
    if not settings.OPENAI_API_KEY:
        errors["web_search_market"] = "OPENAI_API_KEY is not configured."
        return {**state, "errors": errors}

    make = state.get("make") or ""
    model = state.get("model") or ""
    year = state.get("year") or ""
    trim = state.get("trim") or ""
    vehicle_str = " ".join(filter(None, [str(year), make, model, trim]))

    log.info("[WebSearch] Researching: %s", vehicle_str)

    # ── DuckDuckGo searches (best-effort) ─────────────────────────────────────
    price_snippets = ""
    selling_snippets = ""

    fallback_reason = ""
    try:
        price_results, selling_results = await asyncio.gather(
            asyncio.to_thread(_ddg_search, f"{vehicle_str} market value price range"),
            asyncio.to_thread(_ddg_search, f"{vehicle_str} features highlights review"),
        )
        total_returned = len(price_results) + len(selling_results)
        price_snippets = _snippets(price_results)
        selling_snippets = _snippets(selling_results)
        snippet_count = sum(1 for r in price_results + selling_results if r.get("body"))
        log.info("[WebSearch] DDGS totals — results: %d, snippets with body: %d", total_returned, snippet_count)

        if price_snippets or selling_snippets:
            log.info("[WebSearch] Using DDGS research successfully")
        elif total_returned == 0:
            fallback_reason = "DDGS returned zero results"
            log.info("[WebSearch] %s — falling back to GPT training knowledge", fallback_reason)
        else:
            fallback_reason = "DDGS parsing failed — results contained no body text"
            log.info("[WebSearch] %s — falling back to GPT training knowledge", fallback_reason)
    except Exception as exc:
        fallback_reason = f"DDGS exception: {exc}"
        log.warning("[WebSearch] DDGS gather failed: %s — falling back to GPT training knowledge", exc)

    client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)

    try:
        # ── Price range ───────────────────────────────────────────────────────
        price_context = (
            f"Search results:\n{price_snippets}"
            if price_snippets
            else "No search results available — use your training knowledge."
        )
        price_suffix = "" if price_snippets else " (AI estimate)"

        price_resp = await client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {
                    "role": "system",
                    "content": (
                        "You are an automotive pricing analyst. "
                        "Return ONLY a concise price range like '$28,000 – $36,000'. "
                        "No other text."
                    ),
                },
                {
                    "role": "user",
                    "content": (
                        f"What is the current US used-car market price range for "
                        f"a {vehicle_str}?\n\n{price_context}"
                    ),
                },
            ],
            max_tokens=60,
            temperature=0.3,
        )
        market_price_range = (
            price_resp.choices[0].message.content.strip() + price_suffix
        )

        # ── Selling points ────────────────────────────────────────────────────
        selling_context = (
            f"Search results:\n{selling_snippets}"
            if selling_snippets
            else "No search results available — use your training knowledge."
        )

        selling_resp = await client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {
                    "role": "system",
                    "content": (
                        "You are a car features expert. "
                        'Return JSON with key "points" containing a list of 5–6 '
                        "concise selling points (each under 12 words)."
                    ),
                },
                {
                    "role": "user",
                    "content": (
                        f"List the key selling points for a {vehicle_str}.\n\n"
                        f"{selling_context}"
                    ),
                },
            ],
            response_format={"type": "json_object"},
            max_tokens=350,
            temperature=0.3,
        )
        selling_data = json.loads(selling_resp.choices[0].message.content)
        selling_points: list[str] = selling_data.get(
            "points", selling_data.get("features", selling_data.get("highlights", []))
        )
        if not isinstance(selling_points, list):
            selling_points = []

        log.info("[WebSearch] Done — price=%s, points=%d", market_price_range, len(selling_points))

        return {
            **state,
            "market_price_range": market_price_range,
            "selling_points": selling_points[:6],
            "errors": errors,
        }

    except Exception as exc:
        errors["web_search_market"] = str(exc)
        log.error("[WebSearch] OpenAI call failed: %s", exc)
        return {**state, "errors": errors}
