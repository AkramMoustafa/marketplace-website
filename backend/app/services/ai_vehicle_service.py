"""
AI vehicle content generation service.

Calls OpenAI to produce:
  • Vehicle image analysis (vision) — make, model, year, color, body type
  • Text-only generation:
  • A dealership marketing description
  • Selling-point highlights
  • An SEO page title
  • A meta description

The function is intentionally provider-agnostic in its interface so the
underlying model/provider can be swapped without touching callers.
"""
from __future__ import annotations

import base64
import json
import logging

logger = logging.getLogger(__name__)


def _build_prompt(d: dict) -> str:
    year         = d.get("year", "")
    make         = d.get("make", "")
    model        = d.get("model", "")
    title        = d.get("title", "") or f"{year} {make} {model}"
    engine       = d.get("engine", "") or "Not specified"
    drive        = d.get("drive", "") or "Not specified"
    mileage      = d.get("mileage", 0)
    fuel_econ    = d.get("fuel_economy", "") or "Not specified"
    color        = d.get("color", "") or "Not specified"
    body_type    = d.get("body_type", "") or "Not specified"
    transmission = d.get("transmission", "") or "Not specified"
    features     = d.get("features", [])

    features_block = (
        "\n".join(f"• {f}" for f in features)
        if features else "None listed"
    )

    return f"""You are writing premium marketing copy for a luxury car dealership website.

Vehicle details:
  Title:        {title}
  Year:         {year}
  Make:         {make}
  Model:        {model}
  Engine:       {engine}
  Drivetrain:   {drive}
  Mileage:      {mileage:,} miles
  Transmission: {transmission}
  Fuel economy: {fuel_econ}
  Exterior:     {color}
  Body style:   {body_type}
  Key features:
{features_block}

Return a JSON object with EXACTLY these four keys (no extra keys, no markdown):
{{
  "description":       "<2–3 compelling paragraphs, 150–200 words, emphasising performance, luxury and value>",
  "highlights":        ["<3–5 punchy selling bullets, each 8–15 words>"],
  "seo_title":         "<SEO page title, max 60 characters>",
  "meta_description":  "<Meta description for search engines, 140–160 characters>"
}}

Output only the raw JSON — no code fences, no explanation."""


async def generate_vehicle_content(vehicle_data: dict) -> dict:
    """
    Generate AI marketing content for a vehicle listing.

    Parameters
    ----------
    vehicle_data : dict
        Flat dict with keys matching VehicleAIPreviewRequest fields.

    Returns
    -------
    dict with keys: description, highlights, seo_title, meta_description
    """
    from openai import AsyncOpenAI
    from app.config.settings import get_settings

    settings = get_settings()

    if not settings.OPENAI_API_KEY:
        raise ValueError(
            "OPENAI_API_KEY is not configured. "
            "Set it in your .env file to enable AI content generation."
        )

    client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)
    prompt = _build_prompt(vehicle_data)

    logger.info("Requesting AI vehicle content for: %s", vehicle_data.get("title", "unknown"))

    response = await client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[{"role": "user", "content": prompt}],
        max_tokens=1024,
        temperature=0.7,
    )

    raw = response.choices[0].message.content.strip()

    # Strip accidental markdown code fences (model shouldn't emit them, but be safe)
    if raw.startswith("```"):
        lines = raw.splitlines()
        raw = "\n".join(
            line for line in lines
            if not line.startswith("```")
        ).strip()

    try:
        parsed = json.loads(raw)
    except json.JSONDecodeError as exc:
        logger.error("AI response was not valid JSON: %s", raw[:300])
        raise ValueError(f"AI returned non-JSON response: {exc}") from exc

    return {
        "description":      str(parsed.get("description", "")),
        "highlights":       list(parsed.get("highlights", [])),
        "seo_title":        str(parsed.get("seo_title", "")),
        "meta_description": str(parsed.get("meta_description", "")),
    }


_IMAGE_ANALYSIS_PROMPT = """\
You are a vehicle identification expert for a car dealership.

Examine this vehicle photograph and identify as many of the following details as you can:
- make       (manufacturer, e.g. "BMW", "Toyota", "Ford")
- model      (e.g. "M3 Competition", "Camry", "F-150")
- year       (exact year if visible, or best estimate from styling/design cues)
- color      (exterior paint colour, e.g. "Alpine White", "Midnight Black")
- body_type  (e.g. "Sedan", "SUV", "Coupe", "Pickup Truck", "Convertible")
- title      (a clean listing title, e.g. "2023 BMW M3 Competition")

Return ONLY a JSON object — no markdown, no explanation:
{
  "make":             "<string or null>",
  "model":            "<string or null>",
  "year":             <integer or null>,
  "color":            "<string or null>",
  "body_type":        "<string or null>",
  "title":            "<string or null>",
  "confidence_note":  "<one sentence about confidence, e.g. 'Year estimated from grille design'>"
}"""


async def analyze_vehicle_image(image_bytes: bytes, content_type: str) -> dict:
    """
    Analyse a vehicle photograph with GPT-4o vision and return detected field values.

    Parameters
    ----------
    image_bytes : bytes   Raw image data (JPEG, PNG, WebP, …)
    content_type : str    MIME type, e.g. "image/jpeg"

    Returns
    -------
    dict with keys: make, model, year, color, body_type, title, confidence_note
    """
    from openai import AsyncOpenAI
    from app.config.settings import get_settings

    settings = get_settings()

    if not settings.OPENAI_API_KEY:
        raise ValueError(
            "OPENAI_API_KEY is not configured. "
            "Set it in your .env file to enable AI image analysis."
        )

    client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)

    # Encode as a base64 data-URL so we don't need a public URL
    b64 = base64.b64encode(image_bytes).decode("utf-8")
    data_url = f"data:{content_type};base64,{b64}"

    logger.info("Requesting AI image analysis (%d bytes, %s)", len(image_bytes), content_type)

    response = await client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[
            {
                "role": "user",
                "content": [
                    {
                        "type": "image_url",
                        "image_url": {"url": data_url, "detail": "low"},
                    },
                    {
                        "type": "text",
                        "text": _IMAGE_ANALYSIS_PROMPT,
                    },
                ],
            }
        ],
        max_tokens=512,
        temperature=0.2,   # low temperature — we want consistent factual identification
    )

    raw = response.choices[0].message.content.strip()

    if raw.startswith("```"):
        lines = raw.splitlines()
        raw = "\n".join(line for line in lines if not line.startswith("```")).strip()

    try:
        parsed = json.loads(raw)
    except json.JSONDecodeError as exc:
        logger.error("AI image analysis returned non-JSON: %s", raw[:300])
        raise ValueError(f"AI returned non-JSON response: {exc}") from exc

    return {
        "make":            parsed.get("make") or None,
        "model":           parsed.get("model") or None,
        "year":            int(parsed["year"]) if parsed.get("year") else None,
        "color":           parsed.get("color") or None,
        "body_type":       parsed.get("body_type") or None,
        "title":           parsed.get("title") or None,
        "confidence_note": parsed.get("confidence_note") or None,
    }
