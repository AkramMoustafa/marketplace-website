import logging

from pydantic import BaseModel, Field
from sqlalchemy.ext.asyncio import AsyncSession
from langchain_core.tools import StructuredTool

from app.schemas.contact import ContactMessageCreate
from app.services import contact_service

logger = logging.getLogger(__name__)


class CaptureLeadInput(BaseModel):
    name: str = Field(description="Customer's full name")
    phone: str = Field(description="Customer's phone number")
    email: str = Field(description="Customer's email address")
    interest: str = Field(
        description="What they're interested in, e.g. '2024 Toyota Camry' or 'electric vehicles'"
    )


class CallbackRequestInput(BaseModel):
    name: str = Field(description="Customer's full name")
    phone: str = Field(description="Customer's phone number")
    email: str = Field(description="Customer's email address")
    reason: str = Field(description="Reason for the callback")


def make_capture_lead_tool(db: AsyncSession) -> StructuredTool:
    async def capture_lead(name: str, phone: str, email: str, interest: str) -> str:
        logger.info("[tool:capture_lead] name=%s interest=%s", name, interest)
        data = ContactMessageCreate(
            name=name,
            email=email,
            phone=phone,
            subject=f"New Lead – {interest}",
            message=(
                f"Lead captured via chatbot.\n"
                f"Name: {name}\nPhone: {phone}\nEmail: {email}\nInterest: {interest}"
            ),
        )
        try:
            await contact_service.create_contact_message(db, data)
        except Exception as exc:
            logger.error("[tool:capture_lead] db error: %s", exc)
            return "I had trouble saving your info — please try again or call us directly."

        return (
            f"Thanks, {name}! Your info is saved and our team will reach out "
            f"at {email} or {phone} about {interest}. "
            "We typically respond within 30 minutes during business hours."
        )

    return StructuredTool.from_function(
        coroutine=capture_lead,
        name="capture_lead",
        description=(
            "Save a customer's contact info and interest to the dealership CRM for follow-up. "
            "Use when a customer wants to be contacted or when they express buying intent."
        ),
        args_schema=CaptureLeadInput,
    )


def make_callback_request_tool(db: AsyncSession) -> StructuredTool:
    async def callback_request(name: str, phone: str, email: str, reason: str) -> str:
        logger.info("[tool:callback_request] name=%s phone=%s", name, phone)
        data = ContactMessageCreate(
            name=name,
            email=email,
            phone=phone,
            subject="Callback Request",
            message=f"Callback requested by {name} at {phone}.\nReason: {reason}",
        )
        try:
            await contact_service.create_contact_message(db, data)
        except Exception as exc:
            logger.error("[tool:callback_request] db error: %s", exc)
            return "I had trouble logging that — please call us directly at our dealership number."

        return (
            f"Got it, {name}! One of our team members will call you at {phone} "
            f'within 1 hour regarding: "{reason}". '
            "We're available Mon–Sat 9AM–7PM."
        )

    return StructuredTool.from_function(
        coroutine=callback_request,
        name="callback_request",
        description=(
            "Submit a callback request to the dealership. "
            "Use when a customer explicitly wants a team member to call them back."
        ),
        args_schema=CallbackRequestInput,
    )
