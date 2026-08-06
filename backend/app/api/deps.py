"""Shared FastAPI dependencies: DB session, current user, and role guards."""

from collections.abc import Callable
from typing import Annotated
from uuid import UUID

from fastapi import Depends, HTTPException, Query, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.database import get_db
from app.core.security import decode_access_token
from app.models.user import User, UserRole

oauth2_scheme = OAuth2PasswordBearer(
    tokenUrl=f"{settings.API_V1_PREFIX}/auth/login", auto_error=False
)

DbSession = Annotated[Session, Depends(get_db)]


def get_current_user(
    db: DbSession,
    token: Annotated[str | None, Depends(oauth2_scheme)],
) -> User:
    credentials_error = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Not authenticated",
        headers={"WWW-Authenticate": "Bearer"},
    )
    if not token:
        raise credentials_error

    claims = decode_access_token(token)
    if not claims or not claims.get("sub"):
        raise credentials_error

    try:
        user_id = UUID(claims["sub"])
    except (ValueError, TypeError):
        raise credentials_error from None

    user = db.get(User, user_id)
    if user is None or not user.is_active:
        raise credentials_error
    return user


CurrentUser = Annotated[User, Depends(get_current_user)]


def require_roles(*roles: UserRole) -> Callable[[User], User]:
    """Guard a route to specific roles: `Depends(require_roles(UserRole.ADMIN))`."""

    def guard(user: CurrentUser) -> User:
        if user.role not in roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Requires one of: {', '.join(r.value for r in roles)}",
            )
        return user

    return guard


# Content editing — admins and editors
require_editor = require_roles(UserRole.ADMIN, UserRole.EDITOR)
# Destructive actions and user management — admins only
require_admin = require_roles(UserRole.ADMIN)
# Lead inbox — admins and sales
require_sales = require_roles(UserRole.ADMIN, UserRole.SALES)


class Pagination:
    """Standard `?page=&per_page=` handling."""

    def __init__(
        self,
        page: Annotated[int, Query(ge=1)] = 1,
        per_page: Annotated[int, Query(ge=1, le=100)] = 12,
    ) -> None:
        self.page = page
        self.per_page = per_page
        self.offset = (page - 1) * per_page
        self.limit = per_page


PaginationDep = Annotated[Pagination, Depends(Pagination)]


def get_locale(
    locale: Annotated[str | None, Query(description="Content language, e.g. en, ur")] = None,
) -> str:
    """Falls back to the default locale when the requested one isn't supported."""
    if locale and locale in settings.SUPPORTED_LOCALES:
        return locale
    return settings.DEFAULT_LOCALE


LocaleDep = Annotated[str, Depends(get_locale)]
