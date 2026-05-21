from fastapi import APIRouter, Depends, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.session import get_db
from app.schemas.user import UserCreate, UserOut
from app.schemas.token import Token, RefreshRequest
from app.services import user_service
from app.auth.jwt import create_access_token, create_refresh_token, decode_token
from app.auth.dependencies import get_current_user
from app.models.user import User
from fastapi import HTTPException

router = APIRouter(prefix="/api/auth", tags=["Auth"])


@router.post("/register", response_model=UserOut, status_code=status.HTTP_201_CREATED)
async def register(data: UserCreate, db: AsyncSession = Depends(get_db)):
    user = await user_service.create_user(db, data)
    return user


@router.post("/login", response_model=Token)
async def login(form: OAuth2PasswordRequestForm = Depends(), db: AsyncSession = Depends(get_db)):
    user = await user_service.authenticate_user(db, form.username, form.password)
    return Token(
        access_token=create_access_token(str(user.id), user.role),
        refresh_token=create_refresh_token(str(user.id), user.role),
    )


@router.post("/refresh", response_model=Token)
async def refresh(body: RefreshRequest, db: AsyncSession = Depends(get_db)):
    payload = decode_token(body.refresh_token)
    if not payload or payload.get("type") != "refresh":
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid refresh token")
    import uuid
    user = await user_service.get_user_by_id(db, uuid.UUID(payload["sub"]))
    return Token(
        access_token=create_access_token(str(user.id), user.role),
        refresh_token=create_refresh_token(str(user.id), user.role),
    )


@router.get("/me", response_model=UserOut)
async def me(current: User = Depends(get_current_user)):
    return current
