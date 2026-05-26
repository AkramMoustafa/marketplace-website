import uuid
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from fastapi import HTTPException, status
from app.models.financing import FinancingRequest, FinancingStatus
from app.schemas.financing import FinancingRequestCreate, FinancingRequestUpdate


async def create_financing_request(
    db: AsyncSession, data: FinancingRequestCreate, customer_id: uuid.UUID
) -> FinancingRequest:
    req = FinancingRequest(**data.model_dump(), customer_id=customer_id)
    db.add(req)
    await db.flush()
    await db.refresh(req)
    return req


async def get_financing_request(db: AsyncSession, req_id: uuid.UUID) -> FinancingRequest:
    result = await db.execute(select(FinancingRequest).where(FinancingRequest.id == req_id))
    req = result.scalar_one_or_none()
    if not req:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Financing request not found")
    return req


async def list_financing_requests(
    db: AsyncSession,
    customer_id: uuid.UUID | None = None,
    financing_status: FinancingStatus | None = None,
    skip: int = 0,
    limit: int = 20,
) -> tuple[list[FinancingRequest], int]:
    query = select(FinancingRequest)
    if customer_id:
        query = query.where(FinancingRequest.customer_id == customer_id)
    if financing_status:
        query = query.where(FinancingRequest.status == financing_status)

    total = (await db.execute(select(func.count()).select_from(query.subquery()))).scalar_one()
    result = await db.execute(query.order_by(FinancingRequest.created_at.desc()).offset(skip).limit(limit))
    return result.scalars().all(), total


async def update_financing_request(
    db: AsyncSession, req: FinancingRequest, data: FinancingRequestUpdate
) -> FinancingRequest:
    for field, value in data.model_dump(exclude_none=True).items():
        setattr(req, field, value)
    await db.flush()
    await db.refresh(req)
    return req
