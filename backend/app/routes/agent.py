"""
agent.py  (routes)
~~~~~~~~~~~~~~~~~~
AI Sales Agent route for NOVA Motors.

POST /api/agent/process-vehicle
  Accepts a VIN and an optional admin-set price.
  Returns a Server-Sent Events (SSE) stream that emits a JSON event
  after each pipeline node completes, followed by a final "complete"
  event containing the full result.

SSE event format
----------------
Every line is:
  data: <json>\n\n

Event types:
  {"type": "step_start", "step": "<id>", "label": "<human label>"}
  {"type": "step_done",  "step": "<id>"}
  {"type": "complete",   "result": { ...AgentState fields... }}
  {"type": "error",      "message": "<description>"}   (catastrophic only)
"""
from __future__ import annotations

import json
import logging
from typing import AsyncGenerator

from fastapi import APIRouter, Header, HTTPException, status
from fastapi.responses import StreamingResponse

from app.agents.sales_agent.generate_facebook_copy import generate_facebook_copy
from app.agents.sales_agent.generate_listing import generate_listing
from app.agents.sales_agent.lookup_nhtsa import lookup_nhtsa
from app.agents.sales_agent.publish_ebay import publish_ebay
from app.agents.sales_agent.state import AgentState
from app.agents.sales_agent.web_search_market import web_search_market
from app.schemas.agent import ProcessVehicleRequest

log = logging.getLogger(__name__)

router = APIRouter(prefix="/api/agent", tags=["AI Sales Agent"])

# ── Pipeline definition ───────────────────────────────────────────────────────

_PIPELINE = [
    ("lookup_nhtsa",           "Looking up vehicle via NHTSA…",            lookup_nhtsa),
    ("web_search_market",      "Researching current market price range…",   web_search_market),
    ("generate_listing",       "Generating AI listing with GPT-4o-mini…",   generate_listing),
    ("publish_ebay",           "Publishing to eBay Motors (mock mode)…",    publish_ebay),
    ("generate_facebook_copy", "Creating Facebook Marketplace copy…",       generate_facebook_copy),
]


# ── SSE helpers ───────────────────────────────────────────────────────────────

def _sse(payload: dict) -> str:
    """Encode a dict as a single SSE data line."""
    return f"data: {json.dumps(payload)}\n\n"


# ── Streaming generator ───────────────────────────────────────────────────────

async def _stream_agent(vin: str, admin_price: float | None) -> AsyncGenerator[str, None]:
    state: AgentState = {
        "vin": vin,
        "admin_price": admin_price,
        "errors": {},
    }

    for step_id, label, node_fn in _PIPELINE:
        yield _sse({"type": "step_start", "step": step_id, "label": label})
        try:
            state = await node_fn(state)  # type: ignore[assignment]
        except Exception as exc:
            # Unexpected crash inside a node — log and continue with partial state
            log.exception("[Agent] Unexpected error in node %s: %s", step_id, exc)
            state = {**state, "errors": {**state.get("errors", {}), step_id: str(exc)}}
        yield _sse({"type": "step_done", "step": step_id})

    # Emit final complete event with full state (serialisable fields only)
    result = {k: v for k, v in state.items() if _is_serialisable(v)}
    yield _sse({"type": "complete", "result": result})


def _is_serialisable(value: object) -> bool:
    try:
        json.dumps(value)
        return True
    except (TypeError, ValueError):
        return False


# ── Route ─────────────────────────────────────────────────────────────────────

@router.post(
    "/process-vehicle",
    summary="Run AI Sales Agent pipeline for a VIN",
    description=(
        "Streams SSE events as the agent progresses through five nodes: "
        "NHTSA lookup → market research → listing generation → eBay publish → "
        "Facebook copy generation."
    ),
)
async def process_vehicle(
    body: ProcessVehicleRequest,
    x_admin_auth: str | None = Header(default=None),
) -> StreamingResponse:
    if x_admin_auth != "true":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Admin authentication required",
        )

    log.info("[Agent] Starting pipeline for VIN=%s admin_price=%s", body.vin, body.admin_price)

    return StreamingResponse(
        _stream_agent(body.vin, body.admin_price),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
            "Connection": "keep-alive",
        },
    )
