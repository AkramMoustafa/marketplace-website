from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from app.models.contact import ContactMessage
from app.schemas.contact import ContactMessageCreate


async def create_contact_message(db: AsyncSession, data: ContactMessageCreate) -> ContactMessage:
    msg = ContactMessage(**data.model_dump())
    db.add(msg)
    await db.flush()
    await db.refresh(msg)
    return msg


async def list_contact_messages(
    db: AsyncSession, skip: int = 0, limit: int = 50
) -> tuple[list[ContactMessage], int]:
    total = (await db.execute(select(func.count()).select_from(ContactMessage))).scalar_one()
    rows = (
        await db.execute(
            select(ContactMessage)
            .order_by(ContactMessage.created_at.desc())
            .offset(skip)
            .limit(limit)
        )
    ).scalars().all()
    return list(rows), total


async def mark_read(db: AsyncSession, msg: ContactMessage) -> ContactMessage:
    msg.read = True
    await db.flush()
    await db.refresh(msg)
    return msg
