import logging
from datetime import datetime

from pydantic import BaseModel, Field
from sqlalchemy.ext.asyncio import AsyncSession
from langchain_core.tools import StructuredTool

from app.models.appointment import ServiceType
from app.schemas.appointment import AppointmentCreate
from app.services import appointment_service

logger = logging.getLogger(__name__)


class ScheduleTestDriveInput(BaseModel):
    name: str = Field(description="Customer's full name")
    phone: str = Field(description="Customer's phone number")
    email: str = Field(description="Customer's email address")
    car_model: str = Field(description='Car they want to test drive, e.g. "2024 Toyota Camry"')
    date: str = Field(description="Date as YYYY-MM-DD")
    time: str = Field(description="Time as HH:MM in 24-hour format")


def make_schedule_test_drive_tool(db: AsyncSession) -> StructuredTool:
    async def schedule_test_drive(
        name: str,
        phone: str,
        email: str,
        car_model: str,
        date: str,
        time: str,
    ) -> str:
        logger.info("[tool:schedule_test_drive] name=%s car=%s date=%s time=%s", name, car_model, date, time)
        try:
            appointment_date = datetime.fromisoformat(f"{date}T{time}:00")
        except ValueError as exc:
            return f"Invalid date or time format ({exc}). Please use YYYY-MM-DD for date and HH:MM for time."

        notes = f"Customer: {name} | Email: {email} | Vehicle: {car_model}"
        data = AppointmentCreate(
            service_type=ServiceType.test_drive,
            appointment_date=appointment_date,
            phone=phone,
            notes=notes,
        )

        try:
            appt = await appointment_service.create_appointment(db, data)
        except Exception as exc:
            logger.error("[tool:schedule_test_drive] db error: %s", exc)
            return (
                "I wasn't able to book the appointment right now due to a system issue. "
                "Would you like to leave your contact info and have our team reach out to confirm manually?"
            )

        short_id = str(appt.id)[:8].upper()
        return (
            f"Test drive booked for {name} — {car_model} on {date} at {time}. "
            f"Confirmation ID: {short_id}. We'll send details to {email}."
        )

    return StructuredTool.from_function(
        coroutine=schedule_test_drive,
        name="schedule_test_drive",
        description=(
            "Book a test drive appointment and save it directly to the dealership system. "
            "Collect name, phone, email, car_model, date (YYYY-MM-DD), and time (HH:MM) "
            "through conversation before calling this tool."
        ),
        args_schema=ScheduleTestDriveInput,
    )
