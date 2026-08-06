"""Password hashing and JWT issuing/verification.

Uses the `bcrypt` package directly rather than passlib — passlib 1.7.4 is unmaintained
and raises on bcrypt >= 4.1.
"""

from datetime import UTC, datetime, timedelta
from typing import Any

import bcrypt
import jwt

from app.core.config import settings

# bcrypt hashes at most 72 bytes and errors on anything longer.
_MAX_PASSWORD_BYTES = 72


def _prepare(password: str) -> bytes:
    return password.encode("utf-8")[:_MAX_PASSWORD_BYTES]


def hash_password(plain: str) -> str:
    return bcrypt.hashpw(_prepare(plain), bcrypt.gensalt()).decode("utf-8")


def verify_password(plain: str, hashed: str) -> bool:
    try:
        return bcrypt.checkpw(_prepare(plain), hashed.encode("utf-8"))
    except (ValueError, TypeError):
        return False


def create_access_token(subject: str, extra: dict[str, Any] | None = None) -> str:
    expire = datetime.now(UTC) + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    payload: dict[str, Any] = {"sub": subject, "exp": expire, "iat": datetime.now(UTC)}
    if extra:
        payload.update(extra)
    return jwt.encode(payload, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


def decode_access_token(token: str) -> dict[str, Any] | None:
    """Returns the claims, or None if the token is invalid or expired."""
    try:
        return jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
    except jwt.PyJWTError:
        return None
