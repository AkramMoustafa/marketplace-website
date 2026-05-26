"""
generate_listing.py
~~~~~~~~~~~~~~~~~~~
Node 3 — Uses GPT-4o-mini to auto-generate a full vehicle listing:
  • Compelling title  (≤ 80 chars for eBay compatibility)
  • Professional 2–3 paragraph description
  • Suggested price   (or admin-provided price if supplied)

Requires: OPENAI_API_KEY in environment / settings.
"""
from __future__ import annotations

import json
import logging

from openai import AsyncOpenAI

from app.config.settings import get_settings
from .state import AgentState

log = logging.getLogger(__name__)


async def generate_listing(state: AgentState) -> AgentState:
    """Generate listing title, description, and suggested price."""
    errors: dict = dict(state.get("errors") or {})

    if errors.get("lookup_nhtsa"):
        return state

    settings = get_settings()
    if not settings.OPENAI_API_KEY:
        errors["generate_listing"] = "OPENAI_API_KEY is not configured."
        return {**state, "errors": errors}

    make = state.get("make") or ""
    model = state.get("model") or ""
    year = state.get("year") or ""
    trim = state.get("trim") or ""
    engine = state.get("engine") or ""
    fuel_type = state.get("fuel_type") or ""
    transmission = state.get("transmission") or ""
    market_price = state.get("market_price_range") or "contact for pricing"
    selling_points: list[str] = state.get("selling_points") or []
    admin_price: float | None = state.get("admin_price")

    vehicle_str = " ".join(filter(None, [str(year), make, model, trim]))

    log.info("[Listing] Generating for %s", vehicle_str)

    prompt_parts = [
        f"Vehicle: {vehicle_str}",
        f"Engine: {engine}" if engine else "",
        f"Transmission: {transmission}" if transmission else "",
        f"Fuel Type: {fuel_type}" if fuel_type else "",
        f"Market Price Range: {market_price}",
        (
            f"Key Features: {', '.join(selling_points[:4])}"
            if selling_points
            else ""
        ),
        (
            f"Admin Set Price: ${admin_price:,.0f} — use this as the suggested_price"
            if admin_price
            else ""
        ),
    ]
    prompt = "\n".join(p for p in prompt_parts if p)

    try:
        client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)

        response = await client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {
                    "role": "system",
                    "content": (
                        "You are an expert luxury car dealership copywriter for NOVA Motors. "
                        "Generate a compelling, accurate vehicle listing. "
                        "Return JSON with three keys:\n"
                        '  "title": string (≤ 80 chars, compelling, includes year/make/model/trim)\n'
                        '  "description": string (2–3 paragraphs, professional tone, highlights key features)\n'
                        '  "suggested_price": number (integer, no $ or commas — the retail asking price)\n'
                        "Do not use markdown formatting in the description."
                    ),
                },
                {"role": "user", "content": prompt},
            ],
            response_format={"type": "json_object"},
            max_tokens=900,
            temperature=0.6,
        )

        data: dict = json.loads(response.choices[0].message.content)

        title: str = (data.get("title") or f"{year} {make} {model}")[:80]
        description: str = data.get("description") or ""

        # Admin price wins; otherwise use AI suggestion
        if admin_price:
            suggested_price = float(admin_price)
        else:
            raw_price = data.get("suggested_price", 0)
            try:
                suggested_price = float(str(raw_price).replace(",", "").replace("$", ""))
            except (ValueError, TypeError):
                suggested_price = 0.0

        log.info("[Listing] Title: %s | Price: $%s", title, suggested_price)

        return {
            **state,
            "listing_title": title,
            "listing_description": description,
            "suggested_price": suggested_price,
            "errors": errors,
        }

    except Exception as exc:
        errors["generate_listing"] = str(exc)
        log.error("[Listing] OpenAI call failed: %s", exc)
        return {**state, "errors": errors}
