import logging

from pydantic import BaseModel, Field
from langchain_core.tools import StructuredTool

logger = logging.getLogger(__name__)

_APR: dict[str, float] = {
    "excellent": 4.9,
    "good": 6.9,
    "fair": 9.9,
    "poor": 14.9,
}
_LABELS: dict[str, str] = {
    "excellent": "Excellent (750+)",
    "good": "Good (700–749)",
    "fair": "Fair (650–699)",
    "poor": "Poor (below 650)",
}


def _monthly(principal: float, annual_rate: float, months: int) -> float:
    r = annual_rate / 100 / 12
    if r == 0:
        return principal / months
    return (principal * r * (1 + r) ** months) / ((1 + r) ** months - 1)


class FinancingEstimateInput(BaseModel):
    budget: float = Field(description="Vehicle price in dollars, e.g. 35000")
    down_payment: float = Field(description="Down payment in dollars, e.g. 5000")
    credit_score_range: str = Field(
        description='Credit tier: "excellent", "good", "fair", or "poor"'
    )


def make_financing_estimate_tool() -> StructuredTool:
    async def financing_estimate(
        budget: float,
        down_payment: float,
        credit_score_range: str,
    ) -> str:
        logger.info(
            "[tool:financing_estimate] budget=%.0f down=%.0f credit=%s",
            budget, down_payment, credit_score_range,
        )
        key = credit_score_range.lower().split()[0].rstrip("(+)")
        apr = _APR.get(key, _APR["fair"])
        label = _LABELS.get(key, _LABELS["fair"])
        loan = budget - down_payment

        if loan <= 0:
            return (
                f"With a ${down_payment:,.0f} down payment on a ${budget:,.0f} vehicle "
                "you'd pay it off outright — no loan needed!"
            )

        lines = []
        for months in (36, 48, 60, 72):
            mo = _monthly(loan, apr, months)
            total = mo * months
            lines.append(f"• {months} months: ~${mo:,.0f}/mo (total ${total:,.0f})")

        return (
            f"Estimate for ${budget:,.0f} vehicle, ${down_payment:,.0f} down, "
            f"{label} credit at {apr}% APR:\n\n"
            + "\n".join(lines)
            + "\n\nThese are estimates — our finance team often finds better rates. "
            "To submit a full application, visit the Financing page on our website."
        )

    return StructuredTool.from_function(
        coroutine=financing_estimate,
        name="financing_estimate",
        description=(
            "Calculate estimated monthly car payments based on vehicle price, "
            "down payment, and credit score range. Pure calculation — no DB needed."
        ),
        args_schema=FinancingEstimateInput,
    )
