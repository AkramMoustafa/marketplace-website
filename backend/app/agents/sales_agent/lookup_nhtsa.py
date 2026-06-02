"""
lookup_nhtsa.py
~~~~~~~~~~~~~~~
Node 1 — Decodes a VIN via the free NHTSA vPIC API and extracts
make, model, year, trim, engine, fuel type, and transmission.

No credentials required.  Endpoint:
  GET https://vpic.nhtsa.dot.gov/api/vehicles/decodevin/{vin}?format=json
"""
from __future__ import annotations

import logging

import httpx

from .state import AgentState

log = logging.getLogger(__name__)

_NHTSA_URL = "https://vpic.nhtsa.dot.gov/api/vehicles/decodevin/{vin}?format=json"


def _build_engine_string(r: dict) -> str:
    """Compose a human-readable engine description from raw NHTSA fields."""
    parts: list[str] = []

    disp = r.get("Displacement (L)")
    cylinders = r.get("Engine Number of Cylinders")
    config = r.get("Engine Configuration")  # e.g. "Inline", "V"
    turbo = (r.get("Turbo") or "").lower()

    if disp:
        parts.append(f"{disp}L")
    if config and cylinders:
        parts.append(f"{config}-{cylinders}")
    elif cylinders:
        parts.append(f"{cylinders}-cyl")
    if turbo in ("yes", "turbo"):
        parts.append("Turbo")

    return " ".join(parts) or r.get("Engine Model", "")


async def lookup_nhtsa(state: AgentState) -> AgentState:
    """Call NHTSA vPIC API and extract vehicle specs.

    Errors are stored under two keys for compatibility:
      state["errors"]["lookup_nhtsa"]       — legacy pipeline
      state["errors"]["vehicle_intelligence"] — new phase-based pipeline
    """
    vin: str = state.get("vin", "")
    errors: dict = dict(state.get("errors") or {})

    log.info("[NHTSA] Decoding VIN: %s", vin)

    try:
        async with httpx.AsyncClient(timeout=12) as client:
            resp = await client.get(_NHTSA_URL.format(vin=vin))
            resp.raise_for_status()
            data = resp.json()
    except Exception as exc:
        msg = f"NHTSA request failed: {exc}"
        errors["lookup_nhtsa"] = msg
        errors["vehicle_intelligence"] = msg
        log.error("[NHTSA] %s", msg)
        return {**state, "errors": errors}

    # Build a flat dict, filtering out empty/None values
    raw: dict = {
        r["Variable"]: r["Value"]
        for r in data.get("Results", [])
        if r.get("Value") and r["Value"] not in ("", "Not Applicable")
    }

    make = raw.get("Make")
    model = raw.get("Model")
    year_str = raw.get("Model Year")

    if not make or not model or not year_str:
        msg = (
            "NHTSA returned no results for this VIN. "
            "Please verify the VIN is correct (17 alphanumeric characters, no I/O/Q)."
        )
        errors["lookup_nhtsa"] = msg
        errors["vehicle_intelligence"] = msg
        log.warning("[NHTSA] %s", msg)
        return {**state, "errors": errors}

    try:
        year = int(year_str)
    except ValueError:
        year = 0

    engine_str = _build_engine_string(raw)
    fuel_type = raw.get("Fuel Type - Primary") or raw.get("Fuel Type") or ""
    transmission = (
        raw.get("Transmission Style")
        or raw.get("Transmission Speeds")
        or ""
    )
    trim = raw.get("Trim") or raw.get("Trim2") or ""
    body_style = raw.get("Body Class") or ""
    drive_type = raw.get("Drive Type") or ""

    log.info("[NHTSA] %s %s %s %s — OK", year, make, model, trim)

    return {
        **state,
        "make": make,
        "model": model,
        "year": year,
        "trim": trim,
        "engine": engine_str,
        "fuel_type": fuel_type,
        "transmission": transmission,
        "body_style": body_style,
        "drive_type": drive_type,
        "nhtsa_raw": raw,
        "errors": errors,
    }
