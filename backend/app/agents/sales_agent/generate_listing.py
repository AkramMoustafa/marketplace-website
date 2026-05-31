"""
generate_listing.py
~~~~~~~~~~~~~~~~~~~
Phase B — Listing Generation Agent.

Uses GPT-4o-mini to generate a complete vehicle listing package from
accumulated Vehicle Intelligence + Market Research + User Review inputs:

  • listing_title            (≤ 80 chars, compelling, eBay-compatible)
  • listing_description      (2–3 paragraphs, professional, for website)
  • suggested_price          (respects asking_price when provided)
  • facebook_copy            (formatted for Facebook Marketplace)
  • ebay_listing_description (eBay-specific description with full specs table)

Short-circuits if vehicle_intelligence failed.
"""
from __future__ import annotations

import json
import logging

from openai import AsyncOpenAI

from app.config.settings import get_settings
from .state import AgentState

log = logging.getLogger(__name__)

_CONDITION_LABELS = {
    "excellent": "Excellent — like-new condition, no visible wear",
    "good":      "Good — well-maintained with minor wear",
    "fair":      "Fair — functional with noticeable wear",
    "poor":      "Poor — significant wear, may need attention",
}

_TITLE_STATUS_LABELS = {
    "clean":    "Clean Title",
    "rebuilt":  "Rebuilt/Reconstructed Title",
    "salvage":  "Salvage Title",
}


async def generate_listing(state: AgentState) -> AgentState:
    """Generate complete listing package from all accumulated state."""
    errors: dict = dict(state.get("errors") or {})

    if errors.get("vehicle_intelligence"):
        return state

    settings = get_settings()
    if not settings.OPENAI_API_KEY:
        errors["generate_listing"] = "OPENAI_API_KEY is not configured."
        return {**state, "errors": errors}

    # ── Collect all available context ─────────────────────────────────────────
    make         = state.get("make") or ""
    model        = state.get("model") or ""
    year         = state.get("year") or ""
    trim         = state.get("trim") or ""
    engine       = state.get("engine") or ""
    fuel_type    = state.get("fuel_type") or ""
    transmission = state.get("transmission") or ""
    body_style   = state.get("body_style") or ""
    drive_type   = state.get("drive_type") or ""

    market_price  = state.get("market_price_range") or "contact for pricing"
    selling_points: list[str] = state.get("selling_points") or []
    market_insights = state.get("market_insights") or ""

    # User review inputs
    mileage       = state.get("mileage")
    asking_price  = state.get("asking_price") or state.get("admin_price")
    condition     = state.get("condition") or ""
    title_status  = state.get("title_status") or "clean"
    features: list[str] = state.get("features") or []
    service_history = state.get("service_history") or ""
    notes         = state.get("notes") or ""

    vehicle_str = " ".join(filter(None, [str(year), make, model, trim]))
    log.info("[Listing] Generating package for %s", vehicle_str)

    # ── Build prompt ──────────────────────────────────────────────────────────
    lines = [f"VEHICLE: {vehicle_str}"]

    specs = []
    if engine:       specs.append(f"Engine: {engine}")
    if transmission: specs.append(f"Transmission: {transmission}")
    if fuel_type:    specs.append(f"Fuel Type: {fuel_type}")
    if body_style:   specs.append(f"Body Style: {body_style}")
    if drive_type:   specs.append(f"Drive Type: {drive_type}")
    if mileage is not None:
        specs.append(f"Mileage: {mileage:,} miles")
    if specs:
        lines.append("SPECS: " + " | ".join(specs))

    if condition:
        lines.append(f"CONDITION: {_CONDITION_LABELS.get(condition, condition)}")

    ts_label = _TITLE_STATUS_LABELS.get(title_status, title_status or "Clean Title")
    lines.append(f"TITLE STATUS: {ts_label}")

    lines.append(f"MARKET PRICE RANGE: {market_price}")
    if market_insights:
        lines.append(f"MARKET INSIGHTS: {market_insights}")
    if selling_points:
        lines.append(f"KEY SELLING POINTS: {', '.join(selling_points[:5])}")

    if features:
        lines.append(f"DEALER-LISTED FEATURES: {', '.join(features[:10])}")
    if service_history:
        lines.append(f"SERVICE HISTORY: {service_history}")
    if notes:
        lines.append(f"DEALER NOTES: {notes}")

    if asking_price:
        lines.append(f"ASKING PRICE: ${asking_price:,.0f} — use this as suggested_price exactly")

    prompt = "\n".join(lines)

    try:
        client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)

        response = await client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {
                    "role": "system",
                    "content": (
                        "You are an expert automotive copywriter for NOVA Motors, a luxury dealership. "
                        "Generate a complete listing package. Return JSON with exactly six keys:\n"
                        '  "listing_title": string (≤ 80 chars, includes year/make/model/trim, '
                        "compelling and factual)\n"
                        '  "listing_description": string (2–3 paragraphs, professional website '
                        "description, highlights condition, key features, service history. "
                        "Note salvage/rebuilt title prominently if applicable. No markdown.)\n"
                        '  "suggested_price": number (integer asking price; if ASKING PRICE is '
                        "given use it exactly, otherwise price near the lower-middle of market range)\n"
                        '  "key_features": array of 6–12 strings — specific, accurate vehicle '
                        "features and options for this trim (e.g. \"Heated front seats\", "
                        "\"Apple CarPlay\", \"Panoramic sunroof\", \"Lane-departure warning\"). "
                        "Include any DEALER-LISTED FEATURES provided. Each item 2–6 words.\n"
                        '  "facebook_copy": string (Facebook Marketplace post — include title, '
                        "price, bullet specs, condition, VIN, NOVA Motors contact CTA. "
                        "Use emoji sparingly. Ready to copy-paste.)\n"
                        '  "ebay_listing_description": string (eBay description — structured with '
                        "VEHICLE DETAILS, CONDITION, FEATURES, TITLE STATUS sections. "
                        "Professional, factual, eBay policy compliant. No HTML tags.)"
                    ),
                },
                {"role": "user", "content": prompt},
            ],
            response_format={"type": "json_object"},
            max_tokens=2200,
            temperature=0.6,
        )

        data: dict = json.loads(response.choices[0].message.content)

        title: str = (data.get("listing_title") or f"{year} {make} {model}")[:80]
        description: str = data.get("listing_description") or ""
        facebook_copy: str = data.get("facebook_copy") or ""
        ebay_description: str = data.get("ebay_listing_description") or ""
        key_features: list[str] = data.get("key_features") or []
        if not isinstance(key_features, list):
            key_features = []

        if asking_price:
            suggested_price = float(asking_price)
        else:
            raw = data.get("suggested_price", 0)
            try:
                suggested_price = float(str(raw).replace(",", "").replace("$", ""))
            except (ValueError, TypeError):
                suggested_price = 0.0

        log.info("[Listing] Done — title='%s' price=$%s features=%d", title, suggested_price, len(key_features))

        return {
            **state,
            "listing_title": title,
            "listing_description": description,
            "suggested_price": suggested_price,
            "key_features": key_features,
            "facebook_copy": facebook_copy,
            "ebay_listing_description": ebay_description,
            "errors": errors,
        }

    except Exception as exc:
        errors["generate_listing"] = str(exc)
        log.error("[Listing] OpenAI call failed: %s", exc)
        return {**state, "errors": errors}
