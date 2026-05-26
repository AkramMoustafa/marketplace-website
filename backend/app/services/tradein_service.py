import uuid
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from fastapi import HTTPException, status
from app.models.tradein import TradeIn, TradeInStatus
from app.schemas.tradein import TradeInCreate, TradeInUpdate


async def create_tradein(
    db: AsyncSession, data: TradeInCreate, customer_id: uuid.UUID
) -> TradeIn:
    trade = TradeIn(**data.model_dump(), customer_id=customer_id)
    db.add(trade)
    await db.flush()
    await db.refresh(trade)
    return trade


async def get_tradein(db: AsyncSession, trade_id: uuid.UUID) -> TradeIn:
    result = await db.execute(select(TradeIn).where(TradeIn.id == trade_id))
    trade = result.scalar_one_or_none()
    if not trade:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Trade-in not found")
    return trade


async def list_tradeins(
    db: AsyncSession,
    customer_id: uuid.UUID | None = None,
    trade_status: TradeInStatus | None = None,
    skip: int = 0,
    limit: int = 20,
) -> tuple[list[TradeIn], int]:
    query = select(TradeIn)
    if customer_id:
        query = query.where(TradeIn.customer_id == customer_id)
    if trade_status:
        query = query.where(TradeIn.status == trade_status)

    total = (await db.execute(select(func.count()).select_from(query.subquery()))).scalar_one()
    result = await db.execute(query.order_by(TradeIn.created_at.desc()).offset(skip).limit(limit))
    return result.scalars().all(), total


async def update_tradein(db: AsyncSession, trade: TradeIn, data: TradeInUpdate) -> TradeIn:
    for field, value in data.model_dump(exclude_none=True).items():
        setattr(trade, field, value)
    await db.flush()
    await db.refresh(trade)
    return trade
