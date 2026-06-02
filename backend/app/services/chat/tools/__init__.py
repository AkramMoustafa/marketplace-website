from sqlalchemy.ext.asyncio import AsyncSession
from langchain_core.tools import BaseTool

from .inventory import make_search_inventory_tool, make_get_vehicle_details_tool
from .leads import make_capture_lead_tool, make_callback_request_tool
from .financing import make_financing_estimate_tool


def get_all_tools(db: AsyncSession) -> list[BaseTool]:
    # schedule_test_drive is intentionally omitted — the frontend modal owns that flow.
    # Alex emits [SCHEDULE_MODAL] and the UI posts directly to /api/appointments.
    return [
        make_search_inventory_tool(db),
        make_get_vehicle_details_tool(db),
        make_capture_lead_tool(db),
        make_callback_request_tool(db),
        make_financing_estimate_tool(),
    ]
