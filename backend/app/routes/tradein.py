import uuid
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.session import get_db
from app.schemas.tradein import TradeInCreate, TradeInOut
from app.services import tradein_service
from app.auth.dependencies import get_current_user
from app.models.user import User
from app.utils.pagination import PaginationParams, PaginatedResponse, pagination_params

router = APIRouter(prefix="/api/tradein", tags=["Trade-In"])


@router.post("", response_model=TradeInOut, status_code=status.HTTP_201_CREATED)
async def submit_tradein(
    data: TradeInCreate,
    current: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    trade = await tradein_service.create_tradein(db, data, current.id)
    return TradeInOut.model_validate(trade)


@router.get("/my", response_model=PaginatedResponse)
async def my_tradeins(
    current: User = Depends(get_current_user),
    pagination: PaginationParams = Depends(pagination_params),
    db: AsyncSession = Depends(get_db),
):
    items, total = await tradein_service.list_tradeins(
        db, customer_id=current.id, skip=pagination.offset, limit=pagination.page_size
    )
    return PaginatedResponse.build(
        items=[TradeInOut.model_validate(i) for i in items],
        total=total, page=pagination.page, page_size=pagination.page_size,
    )


@router.get("/{trade_id}", response_model=TradeInOut)
async def get_tradein(
    trade_id: uuid.UUID,
    current: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    trade = await tradein_service.get_tradein(db, trade_id)
    if trade.customer_id != current.id and current.role != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")
    return TradeInOut.model_validate(trade)
