from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.session import get_db
from app.schemas.contact import ContactMessageCreate, ContactMessageOut
from app.services.contact_service import create_contact_message

router = APIRouter(prefix="/api/contact", tags=["Contact"])


@router.post("", response_model=ContactMessageOut, status_code=status.HTTP_201_CREATED)
async def submit_contact(
    data: ContactMessageCreate,
    db: AsyncSession = Depends(get_db),
):
    """Public endpoint — no auth required. Stores the submitted contact form."""
    msg = await create_contact_message(db, data)
    return ContactMessageOut.model_validate(msg)
