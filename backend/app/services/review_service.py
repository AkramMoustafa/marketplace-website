import uuid
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from fastapi import HTTPException, status
from app.models.review import Review, ReviewStatus
from app.schemas.review import ReviewCreate, ReviewUpdate


async def create_review(
    db: AsyncSession,
    data: ReviewCreate,
    customer_id: uuid.UUID | None = None,
) -> Review:
    review = Review(
        customer_id=customer_id,
        vehicle_id=data.vehicle_id,
        rating=data.rating,
        title=data.title,
        body=data.body,
        status=ReviewStatus.pending,
    )

    db.add(review)
    await db.flush()
    await db.refresh(review)
    return review

async def get_review(db: AsyncSession, review_id: uuid.UUID) -> Review:
    result = await db.execute(select(Review).where(Review.id == review_id))
    review = result.scalar_one_or_none()
    if not review:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Review not found")
    return review


async def list_reviews(
    db: AsyncSession,
    vehicle_id: uuid.UUID | None = None,
    customer_id: uuid.UUID | None = None,
    review_status: ReviewStatus | None = None,
    skip: int = 0,
    limit: int = 20,
) -> tuple[list[Review], int]:
    query = select(Review)
    if vehicle_id:
        query = query.where(Review.vehicle_id == vehicle_id)
    if customer_id:
        query = query.where(Review.customer_id == customer_id)
    if review_status:
        query = query.where(Review.status == review_status)

    total = (await db.execute(select(func.count()).select_from(query.subquery()))).scalar_one()
    result = await db.execute(query.order_by(Review.created_at.desc()).offset(skip).limit(limit))
    return result.scalars().all(), total


async def update_review(db: AsyncSession, review: Review, data: ReviewUpdate) -> Review:
    for field, value in data.model_dump(exclude_none=True).items():
        setattr(review, field, value)
    await db.flush()
    await db.refresh(review)
    return review


async def delete_review(db: AsyncSession, review: Review) -> None:
    await db.delete(review)
    await db.flush()
