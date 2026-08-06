"""SQLAlchemy engine, session factory, and declarative base.

Connection handling differs sharply between a long-lived server and a serverless
function, so the engine is configured from the environment rather than hard-coded.
"""

from collections.abc import Generator
from datetime import datetime

from sqlalchemy import DateTime, create_engine, func
from sqlalchemy.orm import DeclarativeBase, Mapped, Session, mapped_column, sessionmaker
from sqlalchemy.pool import NullPool

from app.core.config import settings

# Supabase's transaction pooler (port 6543) runs pgbouncer in transaction mode, which
# does not support prepared statements — psycopg creates them by default and the
# connection then fails with "prepared statement already exists".
_IS_TRANSACTION_POOLER = ":6543" in settings.DATABASE_URL

_connect_args: dict = {"connect_timeout": 15}
if _IS_TRANSACTION_POOLER:
    _connect_args["prepare_threshold"] = None

if settings.is_production or _IS_TRANSACTION_POOLER:
    # Serverless: every invocation is short-lived and may run in a fresh container, so
    # an in-process pool only holds connections the next request cannot reuse. NullPool
    # opens and closes per checkout and lets the external pooler do the pooling.
    _engine_kwargs: dict = {"poolclass": NullPool}
else:
    _engine_kwargs = {
        "pool_pre_ping": True,
        "pool_recycle": 1800,
        "pool_size": 10,
        "max_overflow": 20,
    }

engine = create_engine(
    settings.DATABASE_URL,
    echo=settings.DEBUG and not settings.is_production,
    connect_args=_connect_args,
    **_engine_kwargs,
)

SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False, expire_on_commit=False)


class Base(DeclarativeBase):
    """Declarative base with timestamps every table gets."""

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
    )


def get_db() -> Generator[Session, None, None]:
    """FastAPI dependency — yields a session and always closes it."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
