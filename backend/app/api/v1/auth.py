"""Admin authentication — login, current user, password change."""

from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from pydantic import BaseModel, EmailStr
from sqlalchemy import select

from app.api.deps import CurrentUser, DbSession
from app.core.security import create_access_token, hash_password, verify_password
from app.models.user import User, UserRole
from app.schemas.common import MessageResponse, ORMModel

router = APIRouter(prefix="/auth", tags=["auth"])


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


class UserOut(ORMModel):
    id: UUID
    email: EmailStr
    name: str
    role: UserRole
    is_active: bool


class PasswordChange(BaseModel):
    current_password: str
    new_password: str


@router.post("/login", response_model=Token)
def login(
    db: DbSession,
    form: Annotated[OAuth2PasswordRequestForm, Depends()],
) -> Token:
    """OAuth2 password flow. `username` is the email address."""
    user = db.scalar(select(User).where(User.email == form.username.lower().strip()))

    # Same error either way — never reveal whether an email exists.
    if not user or not verify_password(form.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    if not user.is_active:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Account is disabled")

    return Token(access_token=create_access_token(str(user.id), {"role": user.role.value}))


@router.get("/me", response_model=UserOut)
def read_me(user: CurrentUser) -> User:
    return user


@router.post("/change-password", response_model=MessageResponse)
def change_password(db: DbSession, user: CurrentUser, payload: PasswordChange) -> MessageResponse:
    if not verify_password(payload.current_password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Current password is incorrect"
        )
    if len(payload.new_password) < 10:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="New password must be at least 10 characters",
        )

    user.hashed_password = hash_password(payload.new_password)
    db.commit()
    return MessageResponse(message="Password updated")
