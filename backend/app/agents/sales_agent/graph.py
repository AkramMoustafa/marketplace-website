"""
graph.py
~~~~~~~~
LangGraph StateGraph definitions for the NOVA Motors AI Sales Agent.

New phase-based architecture (preferred)
-----------------------------------------
  Phase A – vehicle_intelligence → market_research
  Phase B – generate_listing
  Phase C – distribute_ebay → distribute_facebook → distribute_website

The route handlers in app/routes/agent.py stream each phase individually
with user review and approval steps between phases, so the graphs below
are provided for direct invocation / testing only.

Legacy graph (backward compat)
-------------------------------
  lookup_nhtsa → web_search_market → generate_listing
               → publish_ebay → generate_facebook_copy → END
"""
from __future__ import annotations

from langgraph.graph import END, StateGraph

from .distribute import distribute_ebay, distribute_facebook, distribute_website
from .generate_listing import generate_listing
from .lookup_nhtsa import lookup_nhtsa
from .market_research import market_research
from .publish_ebay import publish_ebay
from .state import AgentState
from .web_search_market import web_search_market


def build_phase_a_graph():
    """Phase A: Vehicle Intelligence + Market Research."""
    g: StateGraph = StateGraph(AgentState)
    g.add_node("vehicle_intelligence", lookup_nhtsa)
    g.add_node("market_research", market_research)
    g.set_entry_point("vehicle_intelligence")
    g.add_edge("vehicle_intelligence", "market_research")
    g.add_edge("market_research", END)
    return g.compile()


def build_phase_b_graph():
    """Phase B: Listing Generation (requires user inputs in state)."""
    g: StateGraph = StateGraph(AgentState)
    g.add_node("generate_listing", generate_listing)
    g.set_entry_point("generate_listing")
    g.add_edge("generate_listing", END)
    return g.compile()


def build_phase_c_graph():
    """Phase C: Distribution (requires inventory_vehicle_id in state)."""
    g: StateGraph = StateGraph(AgentState)
    g.add_node("distribute_ebay", distribute_ebay)
    g.add_node("distribute_facebook", distribute_facebook)
    g.add_node("distribute_website", distribute_website)
    g.set_entry_point("distribute_ebay")
    g.add_edge("distribute_ebay", "distribute_facebook")
    g.add_edge("distribute_facebook", "distribute_website")
    g.add_edge("distribute_website", END)
    return g.compile()


def build_graph():
    """Legacy linear graph — kept for backward compatibility."""
    g: StateGraph = StateGraph(AgentState)
    g.add_node("lookup_nhtsa", lookup_nhtsa)
    g.add_node("web_search_market", web_search_market)
    g.add_node("generate_listing", generate_listing)
    g.add_node("publish_ebay", publish_ebay)
    g.add_node("generate_facebook_copy", _noop)  # replaced by distribute
    g.set_entry_point("lookup_nhtsa")
    g.add_edge("lookup_nhtsa", "web_search_market")
    g.add_edge("web_search_market", "generate_listing")
    g.add_edge("generate_listing", "publish_ebay")
    g.add_edge("publish_ebay", "generate_facebook_copy")
    g.add_edge("generate_facebook_copy", END)
    return g.compile()


async def _noop(state: AgentState) -> AgentState:
    return state
