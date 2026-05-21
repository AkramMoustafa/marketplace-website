import uuid
from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.session import get_db
from app.schemas.financing import FinancingRequestCreate, FinancingRequestOut
from app.services import financing_service
from app.auth.dependencies import get_current_user
from app.models.user import User
from app.utils.pagination import PaginationParams, PaginatedResponse, pagination_params

router = APIRouter(prefix="/api/financing", tags=["Financing"])


@router.post("", response_model=FinancingRequestOut, status_code=status.HTTP_201_CREATED)
async def apply_financing(
    data: FinancingRequestCreate,
    current: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    req = await financing_service.create_financing_request(db, data, current.id)
    return FinancingRequestOut.model_validate(req)


@router.get("/my", response_model=PaginatedResponse)
async def my_financing_requests(
    current: User = Depends(get_current_user),
    pagination: PaginationParams = Depends(pagination_params),
    db: AsyncSession = Depends(get_db),
):
    items, total = await financing_service.list_financing_requests(
        db, customer_id=current.id, skip=pagination.offset, limit=pagination.page_size
    )
    return PaginatedResponse.build(
        items=[FinancingRequestOut.model_validate(i) for i in items],
        total=total, page=pagination.page, page_size=pagination.page_size,
    )


@router.get("/{req_id}", response_model=FinancingRequestOut)
async def get_financing_request(
    req_id: uuid.UUID,
    current: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    from fastapi import HTTPException
    req = await financing_service.get_financing_request(db, req_id)
    if req.customer_id != current.id and current.role != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")
    return FinancingRequestOut.model_validate(req)
