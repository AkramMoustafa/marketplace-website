"""
graph.py
~~~~~~~~
LangGraph StateGraph definition for the NOVA Motors AI Sales Agent.

Pipeline (linear):
  lookup_nhtsa → web_search_market → generate_listing
               → publish_ebay → generate_facebook_copy → END

Usage
-----
  from app.agents.sales_agent.graph import build_graph

  compiled = build_graph()

  # Direct invocation (blocking):
  final_state = await compiled.ainvoke({"vin": "1HGCM82633A004352", "errors": {}})

  # Streaming (yields state snapshot after every node):
  async for snapshot in compiled.astream({"vin": vin, "errors": {}}):
      node_name = next(iter(snapshot))
      ...
"""
from __future__ import annotations

from langgraph.graph import END, StateGraph

from .generate_facebook_copy import generate_facebook_copy
from .generate_listing import generate_listing
from .lookup_nhtsa import lookup_nhtsa
from .publish_ebay import publish_ebay
from .state import AgentState
from .web_search_market import web_search_market


def build_graph() -> "CompiledStateGraph":  # type: ignore[name-defined]
    """Construct and compile the sales-agent LangGraph."""
    graph: StateGraph = StateGraph(AgentState)

    graph.add_node("lookup_nhtsa", lookup_nhtsa)
    graph.add_node("web_search_market", web_search_market)
    graph.add_node("generate_listing", generate_listing)
    graph.add_node("publish_ebay", publish_ebay)
    graph.add_node("generate_facebook_copy", generate_facebook_copy)

    graph.set_entry_point("lookup_nhtsa")
    graph.add_edge("lookup_nhtsa", "web_search_market")
    graph.add_edge("web_search_market", "generate_listing")
    graph.add_edge("generate_listing", "publish_ebay")
    graph.add_edge("publish_ebay", "generate_facebook_copy")
    graph.add_edge("generate_facebook_copy", END)

    return graph.compile()
