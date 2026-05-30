"""
market_research.py
~~~~~~~~~~~~~~~~~~
Phase A, Node 2 — Market Research Agent.

Searches for current market data for the decoded vehicle and produces:
  • market_price_range  — e.g. "$28,000 – $36,000"
  • selling_points      — 5–6 concise key selling points
  • market_insights     — 2–3 sentence market analysis paragraph

Strategy
--------
  1. Two parallel DuckDuckGo searches (no API key required).
  2. Single GPT-4o-mini call returns all three outputs as a JSON object.
  3. Falls back to GPT training knowledge when DuckDuckGo is unavailable.

Short-circuits if vehicle_intelligence failed (no make/model/year decoded).
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


def _ddg_search(query: str, max_results: int = 6) -> list[dict[str, Any]]:
    """Synchronous DuckDuckGo text search wrapped for asyncio.to_thread."""
    try:
        from duckduckgo_search import DDGS
        with DDGS() as ddgs:
            return list(ddgs.text(query, max_results=max_results))
    except Exception as exc:
        log.warning("[MarketResearch] DDG search failed (%s): %s", type(exc).__name__, exc)
        return []


def _snippets(results: list[dict[str, Any]]) -> str:
    return "\n".join(
        f"{r.get('title', '')}: {r.get('body', '')}"
        for r in results
        if r.get("body")
    )


async def market_research(state: AgentState) -> AgentState:
    """Research market price range, selling points, and market insights."""
    errors: dict = dict(state.get("errors") or {})

    if errors.get("vehicle_intelligence"):
        return state

    make = state.get("make") or ""
    model = state.get("model") or ""
    year = state.get("year") or ""
    trim = state.get("trim") or ""

    if not make or not model:
        errors["market_research"] = "Cannot research market — vehicle not decoded."
        return {**state, "errors": errors}

    settings = get_settings()
    if not settings.OPENAI_API_KEY:
        errors["market_research"] = "OPENAI_API_KEY is not configured."
        return {**state, "errors": errors}

    vehicle_str = " ".join(filter(None, [str(year), make, model, trim]))
    log.info("[MarketResearch] Researching: %s", vehicle_str)

    # ── DuckDuckGo searches (best-effort, parallel) ────────────────────────────
    price_snippets = ""
    review_snippets = ""
    try:
        price_results, review_results = await asyncio.gather(
            asyncio.to_thread(_ddg_search, f"{vehicle_str} market value price 2024 2025"),
            asyncio.to_thread(_ddg_search, f"{vehicle_str} review features highlights pros cons"),
        )
        price_snippets = _snippets(price_results)
        review_snippets = _snippets(review_results)
        if price_snippets or review_snippets:
            log.info("[MarketResearch] DDG returned usable snippets")
        else:
            log.info("[MarketResearch] DDG returned no snippets — using GPT knowledge")
    except Exception as exc:
        log.warning("[MarketResearch] DDG gather failed: %s", exc)

    has_search_data = bool(price_snippets or review_snippets)
    search_context = ""
    if price_snippets:
        search_context += f"Price search results:\n{price_snippets}\n\n"
    if review_snippets:
        search_context += f"Review search results:\n{review_snippets}"
    if not search_context:
        search_context = "No web search data available — use your training knowledge."

    ai_suffix = "" if has_search_data else " (AI estimate)"

    client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)

    try:
        response = await client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {
                    "role": "system",
                    "content": (
                        "You are an automotive market analyst. "
                        "Return JSON with exactly three keys:\n"
                        '  "price_range": string — current US used-car price range, '
                        'e.g. "$28,000 – $36,000"\n'
                        '  "selling_points": array of 5–6 strings — key selling points, '
                        "each under 12 words\n"
                        '  "market_insights": string — 2–3 sentences about current market '
                        "demand, trends, and buyer appeal for this vehicle\n"
                        "Be specific and accurate. Do not include markdown."
                    ),
                },
                {
                    "role": "user",
                    "content": (
                        f"Analyze the {vehicle_str} used-car market.\n\n{search_context}"
                    ),
                },
            ],
            response_format={"type": "json_object"},
            max_tokens=500,
            temperature=0.3,
        )

        data: dict = json.loads(response.choices[0].message.content)

        price_range: str = (data.get("price_range") or "Contact for pricing") + ai_suffix
        selling_points: list[str] = data.get("selling_points") or []
        if not isinstance(selling_points, list):
            selling_points = []
        market_insights: str = data.get("market_insights") or ""

        log.info(
            "[MarketResearch] Done — price=%s, points=%d, insights=%d chars",
            price_range, len(selling_points), len(market_insights),
        )

        return {
            **state,
            "market_price_range": price_range,
            "selling_points": selling_points[:6],
            "market_insights": market_insights,
            "errors": errors,
        }

    except Exception as exc:
        errors["market_research"] = str(exc)
        log.error("[MarketResearch] OpenAI call failed: %s", exc)
        return {**state, "errors": errors}
