"""
LangChain 1.x / LangGraph agent for the Alex dealership chatbot.

Uses create_agent from langchain.agents (LangGraph-backed).
Session history is stored in-memory; each request builds a fresh agent
with DB-bound tools so SQLAlchemy sessions are never shared across requests.
"""

import base64
import json
import logging
import re
from typing import Dict

from langchain.agents import create_agent
from langchain_core.messages import AIMessage, BaseMessage, HumanMessage, ToolMessage
from langchain_openai import ChatOpenAI
from sqlalchemy.ext.asyncio import AsyncSession

from app.config.settings import get_settings
from app.services.chat.tools import get_all_tools

_VEHICLES_RE = re.compile(r'\[VEHICLES:([A-Za-z0-9+/=]+)\]')

logger = logging.getLogger(__name__)

# In-memory session store: session_id → list[BaseMessage]
# Only clean human+ai pairs are stored (no intermediate tool messages).
_sessions: Dict[str, list[BaseMessage]] = {}
MAX_HISTORY = 30  # messages (15 turns)

SYSTEM_PROMPT = (
    "You are Alex, a friendly and professional virtual assistant for NOVA Motors "
    "car dealership in Detroit, MI.\n\n"
    "Your role:\n"
    "- Help customers browse real inventory and get vehicle details\n"
    "- Trigger the test drive booking form when scheduling intent is detected\n"
    "- Provide financing payment estimates\n"
    "- Log callback requests and capture leads (saved to our CRM)\n"
    "- Keep responses concise — 2-3 sentences unless presenting inventory or estimates\n\n"
    "Rules:\n"
    "- Always use tools to get real data — never invent prices, availability, or vehicle details\n"
    "- If a customer asks about a specific vehicle, call get_vehicle_details first\n"
    "- When browsing inventory by type, call search_inventory with the appropriate type\n"
    "- If the backend is unavailable, apologise and offer a callback instead\n"
    "- When search_inventory returns vehicle results, respond with ONE brief sentence like "
    "'I found X vehicles matching your criteria.' — do NOT list vehicles in text; "
    "the frontend renders them as cards automatically\n\n"
    "CRITICAL — Test drive scheduling:\n"
    "When a user expresses ANY intent to schedule or book a test drive, visit a car, "
    "make an appointment, or says things like 'can I drive this', 'I want to see this car', "
    "'schedule', 'book', 'appointment', 'test drive':\n"
    "1. Reply with ONE short, enthusiastic sentence (e.g. 'Absolutely! Let me pull up the booking form for you.')\n"
    "2. Immediately append the exact token [SCHEDULE_MODAL] at the end of your response — nothing after it\n"
    "3. Do NOT ask for name, phone, email, date, or time in the chat — the booking form handles all of that\n"
    "4. Do NOT use the schedule_test_drive tool — it is disabled\n"
    "Example output: 'Of course! Let me get that set up for you right now.[SCHEDULE_MODAL]'"
)


def get_session_history(session_id: str) -> list[BaseMessage]:
    if session_id not in _sessions:
        _sessions[session_id] = []
    return _sessions[session_id]


def clear_session(session_id: str) -> None:
    removed = _sessions.pop(session_id, None)
    if removed is not None:
        logger.info("[session] cleared session_id=%s (%d messages)", session_id, len(removed))


async def run_agent(
    session_id: str, user_message: str, db: AsyncSession
) -> tuple[str, list[dict] | None]:
    settings = get_settings()
    logger.info("[chat] session_id=%s message_preview=%r", session_id, user_message[:100])

    llm = ChatOpenAI(
        model="gpt-4o-mini",
        api_key=settings.OPENAI_API_KEY,
        temperature=0.3,
    )

    tools = get_all_tools(db)

    # create_agent is the LangChain 1.x / LangGraph API
    agent = create_agent(llm, tools, system_prompt=SYSTEM_PROMPT)

    history = get_session_history(session_id)
    input_messages = history + [HumanMessage(content=user_message)]

    result = await agent.ainvoke({"messages": input_messages})

    # The result state contains all messages including tool calls/responses.
    # The final AIMessage is always last.
    all_messages: list[BaseMessage] = result.get("messages", [])
    output = ""
    for msg in reversed(all_messages):
        if isinstance(msg, AIMessage) and msg.content:
            output = msg.content if isinstance(msg.content, str) else str(msg.content)
            break

    if not output:
        output = "I'm sorry, I couldn't generate a response. Please try again."

    # Extract vehicle cards from any ToolMessage that carries the [VEHICLES:b64] marker
    vehicles: list[dict] | None = None
    for msg in all_messages:
        if isinstance(msg, ToolMessage) and isinstance(msg.content, str):
            m = _VEHICLES_RE.search(msg.content)
            if m:
                try:
                    vehicles = json.loads(base64.b64decode(m.group(1)).decode())
                except Exception as exc:
                    logger.warning("[chat] failed to decode vehicles marker: %s", exc)
                break

    # Persist only the clean human+ai pair to history
    history.append(HumanMessage(content=user_message))
    history.append(AIMessage(content=output))

    # Trim to bounded window
    if len(history) > MAX_HISTORY:
        history[:] = history[-MAX_HISTORY:]

    logger.info(
        "[chat] session_id=%s output_len=%d vehicles=%s total_history=%d",
        session_id, len(output), len(vehicles) if vehicles else 0, len(history),
    )
    return output, vehicles
