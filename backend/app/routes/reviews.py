import uuid
from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.session import get_db
from app.schemas.review import ReviewCreate, ReviewOut
from app.services import review_service
from app.auth.dependencies import get_current_user
from app.models.user import User
from app.models.review import ReviewStatus
from app.utils.pagination import PaginationParams, PaginatedResponse, pagination_params

router = APIRouter(prefix="/api/reviews", tags=["Reviews"])


@router.post("", response_model=ReviewOut, status_code=status.HTTP_201_CREATED)
async def create_review(
    data: ReviewCreate,
    db: AsyncSession = Depends(get_db),
):
    review = await review_service.create_review(db, data, None)
    return ReviewOut.model_validate(review)

@router.get("", response_model=PaginatedResponse)
async def list_approved_reviews(
    vehicle_id: uuid.UUID | None = None,
    pagination: PaginationParams = Depends(pagination_params),
    db: AsyncSession = Depends(get_db),
):
    items, total = await review_service.list_reviews(
        db,
        vehicle_id=vehicle_id,
        review_status=ReviewStatus.approved,
        skip=pagination.offset,
        limit=pagination.page_size,
    )
    return PaginatedResponse.build(
        items=[ReviewOut.model_validate(i) for i in items],
        total=total, page=pagination.page, page_size=pagination.page_size,
    )
