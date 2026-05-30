"""
agent.py  (routes)
~~~~~~~~~~~~~~~~~~
AI Sales Agent routes for NOVA Motors.

New phase-based endpoints (preferred)
--------------------------------------
  POST /api/agent/vehicle-intelligence   Phase A — VIN decode + market research
  POST /api/agent/generate-listing       Phase B — listing generation (user inputs required)
  POST /api/agent/distribute             Phase C — distribution (inventory save required)

Legacy endpoint (backward compat)
----------------------------------
  POST /api/agent/process-vehicle        Single-pass pipeline (original flow)

All endpoints stream SSE events:
  {"type": "step_start", "step": "<id>", "label": "<label>"}
  {"type": "step_done",  "step": "<id>"}
  {"type": "complete",   "result": { ...AgentState fields... }}
  {"type": "error",      "message": "<description>"}
"""
from __future__ import annotations

import json
import logging
from typing import AsyncGenerator

from fastapi import APIRouter, Header, HTTPException, status
from fastapi.responses import StreamingResponse

from app.agents.sales_agent.distribute import (
    distribute_ebay,
    distribute_facebook,
    distribute_website,
)
from app.agents.sales_agent.generate_listing import generate_listing
from app.agents.sales_agent.generate_facebook_copy import generate_facebook_copy
from app.agents.sales_agent.lookup_nhtsa import lookup_nhtsa
from app.agents.sales_agent.market_research import market_research
from app.agents.sales_agent.publish_ebay import publish_ebay
from app.agents.sales_agent.state import AgentState
from app.agents.sales_agent.web_search_market import web_search_market
from app.schemas.agent import PhaseARequest, PhaseBRequest, PhaseCRequest, ProcessVehicleRequest

log = logging.getLogger(__name__)

router = APIRouter(prefix="/api/agent", tags=["AI Sales Agent"])

_SSE_HEADERS = {
    "Cache-Control": "no-cache",
    "X-Accel-Buffering": "no",
    "Connection": "keep-alive",
}

# ── Phase pipelines ───────────────────────────────────────────────────────────

_PHASE_A = [
    ("vehicle_intelligence", "Decoding VIN via NHTSA…",                 lookup_nhtsa),
    ("market_research",      "Researching market value & trends…",       market_research),
]

_PHASE_B = [
    ("generate_listing",     "Generating complete listing package…",     generate_listing),
]

_PHASE_C = [
    ("distribute_ebay",      "Publishing to eBay Motors…",               distribute_ebay),
    ("distribute_facebook",  "Preparing Facebook Marketplace post…",     distribute_facebook),
    ("distribute_website",   "Confirming website inventory…",            distribute_website),
]

_LEGACY_PIPELINE = [
    ("lookup_nhtsa",           "Looking up vehicle via NHTSA…",            lookup_nhtsa),
    ("web_search_market",      "Researching current market price range…",   web_search_market),
    ("generate_listing",       "Generating AI listing with GPT-4o-mini…",   generate_listing),
    ("publish_ebay",           "Publishing to eBay Motors (mock mode)…",    publish_ebay),
    ("generate_facebook_copy", "Creating Facebook Marketplace copy…",       generate_facebook_copy),
]


# ── SSE helpers ───────────────────────────────────────────────────────────────

def _sse(payload: dict) -> str:
    return f"data: {json.dumps(payload)}\n\n"


def _is_serialisable(value: object) -> bool:
    try:
        json.dumps(value)
        return True
    except (TypeError, ValueError):
        return False


def _admin_check(x_admin_auth: str | None) -> None:
    if x_admin_auth != "true":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Admin authentication required",
        )


# ── Generic streaming runner ──────────────────────────────────────────────────

async def _stream_pipeline(
    initial_state: AgentState,
    pipeline: list[tuple[str, str, object]],
) -> AsyncGenerator[str, None]:
    state = initial_state
    for step_id, label, node_fn in pipeline:
        yield _sse({"type": "step_start", "step": step_id, "label": label})
        try:
            state = await node_fn(state)  # type: ignore[assignment]
        except Exception as exc:
            log.exception("[Agent] Unexpected error in node %s: %s", step_id, exc)
            state = {**state, "errors": {**state.get("errors", {}), step_id: str(exc)}}
        yield _sse({"type": "step_done", "step": step_id})

    result = {k: v for k, v in state.items() if _is_serialisable(v)}
    yield _sse({"type": "complete", "result": result})


def _streaming_response(gen: AsyncGenerator[str, None]) -> StreamingResponse:
    return StreamingResponse(gen, media_type="text/event-stream", headers=_SSE_HEADERS)


# ── Phase A — Vehicle Intelligence ────────────────────────────────────────────

@router.post("/vehicle-intelligence", summary="Phase A: VIN decode + market research")
async def vehicle_intelligence(
    body: PhaseARequest,
    x_admin_auth: str | None = Header(default=None),
) -> StreamingResponse:
    _admin_check(x_admin_auth)
    log.info("[Agent Phase A] VIN=%s", body.vin)
    initial: AgentState = {"vin": body.vin, "errors": {}}
    return _streaming_response(_stream_pipeline(initial, _PHASE_A))


# ── Phase B — Listing Generation ──────────────────────────────────────────────

@router.post("/generate-listing", summary="Phase B: generate listing from user inputs")
async def generate_listing_route(
    body: PhaseBRequest,
    x_admin_auth: str | None = Header(default=None),
) -> StreamingResponse:
    _admin_check(x_admin_auth)
    log.info("[Agent Phase B] VIN=%s condition=%s title_status=%s", body.vin, body.condition, body.title_status)

    initial: AgentState = {
        "vin": body.vin,
        "make": body.make,
        "model": body.model,
        "year": body.year,
        "trim": body.trim,
        "engine": body.engine,
        "fuel_type": body.fuel_type,
        "transmission": body.transmission,
        "body_style": body.body_style,
        "drive_type": body.drive_type,
        "market_price_range": body.market_price_range,
        "selling_points": body.selling_points,
        "market_insights": body.market_insights,
        "mileage": body.mileage,
        "asking_price": body.asking_price,
        "condition": body.condition,
        "title_status": body.title_status,
        "features": body.features,
        "service_history": body.service_history,
        "notes": body.notes,
        "errors": {},
    }
    return _streaming_response(_stream_pipeline(initial, _PHASE_B))


# ── Phase C — Distribution ────────────────────────────────────────────────────

@router.post("/distribute", summary="Phase C: distribute approved listing")
async def distribute_route(
    body: PhaseCRequest,
    x_admin_auth: str | None = Header(default=None),
) -> StreamingResponse:
    _admin_check(x_admin_auth)

    if not body.vehicle_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="vehicle_id is required. Save the vehicle to inventory before distributing.",
        )

    log.info("[Agent Phase C] vehicle_id=%s VIN=%s", body.vehicle_id, body.vin)

    initial: AgentState = {
        "vin": body.vin,
        "make": body.make,
        "model": body.model,
        "year": body.year,
        "inventory_vehicle_id": body.vehicle_id,
        "listing_title": body.listing_title,
        "listing_description": body.listing_description,
        "facebook_copy": body.facebook_copy,
        "ebay_listing_description": body.ebay_listing_description,
        "suggested_price": body.suggested_price,
        "errors": {},
    }
    return _streaming_response(_stream_pipeline(initial, _PHASE_C))


# ── Legacy — process-vehicle (backward compat) ────────────────────────────────

@router.post(
    "/process-vehicle",
    summary="[Legacy] Single-pass AI Sales Agent pipeline",
    description="Kept for backward compatibility. Prefer the phase-based endpoints.",
)
async def process_vehicle(
    body: ProcessVehicleRequest,
    x_admin_auth: str | None = Header(default=None),
) -> StreamingResponse:
    _admin_check(x_admin_auth)
    log.info("[Agent Legacy] VIN=%s admin_price=%s", body.vin, body.admin_price)
    initial: AgentState = {
        "vin": body.vin,
        "admin_price": body.admin_price,
        "errors": {},
    }
    return _streaming_response(_stream_pipeline(initial, _LEGACY_PIPELINE))
