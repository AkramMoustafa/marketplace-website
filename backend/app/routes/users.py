from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.session import get_db
from app.schemas.user import UserOut, UserUpdate, UserPasswordChange
from app.services import user_service
from app.auth.dependencies import get_current_user
from app.models.user import User

router = APIRouter(prefix="/api/users", tags=["Users"])


@router.get("/me", response_model=UserOut)
async def get_me(current: User = Depends(get_current_user)):
    return UserOut.model_validate(current)


@router.patch("/me", response_model=UserOut)
async def update_me(
    data: UserUpdate,
    current: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    updated = await user_service.update_user(db, current, data)
    return UserOut.model_validate(updated)


@router.post("/me/change-password", status_code=204)
async def change_password(
    data: UserPasswordChange,
    current: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    await user_service.change_password(db, current, data.current_password, data.new_password)
