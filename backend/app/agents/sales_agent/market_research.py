"""
market_research.py
~~~~~~~~~~~~~~~~~~
Phase A, Node 2 — Market Research Agent.

Searches for current market data for the decoded vehicle and produces:
  • market_price_range  — e.g. "$28,000 – $36,000"
  • selling_points      — 5–6 concise key selling points
  • market_insights     — 2–3 sentence market analysis paragraph
  • suggested_features  — 6–10 trim-accurate feature suggestions

Strategy
--------
  1. Two parallel DDGS searches (no API key required).
  2. If snippets are found, pass them to GPT-4o-mini as grounded context.
  3. Only when DDGS returns zero results (or all snippets fail to parse) does
     GPT fall back to its own training knowledge.

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


def _ddg_search(query: str, max_results: int = 10) -> list[dict[str, Any]]:
    """Synchronous DDGS text search — call via asyncio.to_thread."""
    from ddgs import DDGS
    with DDGS() as ddgs:
        results = list(ddgs.text(query, max_results=max_results))
    log.info("[MarketResearch] DDGS returned %d results for: %s", len(results), query)
    log.info("[MarketResearch] DDGS raw results: %s", results)
    return results


def _snippets(results: list[dict[str, Any]]) -> str:
    """Extract title+body pairs from DDGS results. Field names: title, href, body."""
    lines = []
    for r in results:
        title = r.get("title", "")
        body = r.get("body", "")
        if body:
            lines.append(f"{title}: {body}")
    return "\n".join(lines)


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

    # ── DDGS searches (parallel, best-effort) ────────────────────────────────
    price_snippets = ""
    review_snippets = ""
    fallback_reason = ""

    try:
        price_results, review_results = await asyncio.gather(
            asyncio.to_thread(_ddg_search, f"{vehicle_str} market value price 2024 2025"),
            asyncio.to_thread(_ddg_search, f"{vehicle_str} review features highlights pros cons"),
        )

        all_results = price_results + review_results
        total_returned = len(all_results)
        price_snippets = _snippets(price_results)
        review_snippets = _snippets(review_results)
        snippet_count = sum(1 for r in all_results if r.get("body"))

        log.info(
            "[MarketResearch] DDGS totals — results: %d, snippets with body: %d",
            total_returned,
            snippet_count,
        )

        if price_snippets or review_snippets:
            log.info("[MarketResearch] Using DDGS research successfully")
        elif total_returned == 0:
            fallback_reason = "DDGS returned zero results"
            log.info("[MarketResearch] %s — falling back to GPT training knowledge", fallback_reason)
        else:
            fallback_reason = "DDGS parsing failed — results contained no body text"
            log.info("[MarketResearch] %s — falling back to GPT training knowledge", fallback_reason)

    except Exception as exc:
        fallback_reason = f"DDGS exception: {type(exc).__name__}: {exc}"
        log.warning("[MarketResearch] DDGS gather failed: %s — falling back to GPT training knowledge", exc)

    # ── Build GPT context ─────────────────────────────────────────────────────
    has_search_data = bool(price_snippets or review_snippets)
    search_context = ""
    if price_snippets:
        search_context += f"Price search results:\n{price_snippets}\n\n"
    if review_snippets:
        search_context += f"Review search results:\n{review_snippets}"
    if not search_context:
        search_context = (
            f"No web search data available ({fallback_reason or 'unknown reason'}) — "
            "use your training knowledge."
        )

    ai_suffix = "" if has_search_data else " (AI estimate)"

    # ── GPT-4o-mini synthesis ─────────────────────────────────────────────────
    client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)

    try:
        response = await client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {
                    "role": "system",
                    "content": (
                        "You are an automotive market analyst. "
                        "Return JSON with exactly four keys:\n"
                        '  "price_range": string — current US used-car price range, '
                        'e.g. "$28,000 – $36,000"\n'
                        '  "selling_points": array of 5–6 strings — key selling points, '
                        "each under 12 words\n"
                        '  "market_insights": string — 2–3 sentences about current market '
                        "demand, trends, and buyer appeal for this vehicle\n"
                        '  "suggested_features": array of 6–10 strings — specific features '
                        "and options typical for this exact trim level (e.g. \"Heated front seats\", "
                        "\"Apple CarPlay\", \"Panoramic sunroof\", \"Blind-spot monitoring\"). "
                        "Be accurate to the trim — do not invent features not standard on it.\n"
                        "Be specific and accurate. Do not include markdown."
                    ),
                },
                {
                    "role": "user",
                    "content": f"Analyze the {vehicle_str} used-car market.\n\n{search_context}",
                },
            ],
            response_format={"type": "json_object"},
            max_tokens=700,
            temperature=0.3,
        )

        data: dict = json.loads(response.choices[0].message.content)

        price_range: str = (data.get("price_range") or "Contact for pricing") + ai_suffix
        selling_points: list[str] = data.get("selling_points") or []
        if not isinstance(selling_points, list):
            selling_points = []
        market_insights: str = data.get("market_insights") or ""
        suggested_features: list[str] = data.get("suggested_features") or []
        if not isinstance(suggested_features, list):
            suggested_features = []

        log.info(
            "[MarketResearch] Done — price=%s, points=%d, features=%d, insights=%d chars, "
            "ddgs_used=%s",
            price_range,
            len(selling_points),
            len(suggested_features),
            len(market_insights),
            has_search_data,
        )

        return {
            **state,
            "market_price_range": price_range,
            "selling_points": selling_points[:6],
            "market_insights": market_insights,
            "suggested_features": suggested_features[:10],
            "errors": errors,
        }

    except Exception as exc:
        errors["market_research"] = str(exc)
        log.error("[MarketResearch] OpenAI call failed: %s", exc)
        return {**state, "errors": errors}
