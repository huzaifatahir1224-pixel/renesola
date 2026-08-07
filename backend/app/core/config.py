"""Application settings, loaded from environment variables."""

from functools import lru_cache
from typing import Annotated

from pydantic import field_validator
from pydantic_settings import BaseSettings, NoDecode, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
        # Values pasted into a hosting dashboard routinely pick up a trailing newline.
        # An unnoticed one turns a database name into "postgres\n" or an API key into a
        # rejected credential, so strip every string setting.
        str_strip_whitespace=True,
    )

    # ── App ──
    PROJECT_NAME: str = "ReneSola Pakistan"
    ENVIRONMENT: str = "development"
    DEBUG: bool = True
    API_V1_PREFIX: str = "/api/v1"
    FRONTEND_URL: str = "http://localhost:3000"
    # NoDecode: stop pydantic-settings from JSON-parsing these before our validator runs,
    # so plain `a,b,c` works in .env.
    BACKEND_CORS_ORIGINS: Annotated[list[str], NoDecode] = ["http://localhost:3000"]

    # ── Database ──
    DATABASE_URL: str

    # ── Supabase ──
    SUPABASE_URL: str = ""
    SUPABASE_ANON_KEY: str = ""
    SUPABASE_SERVICE_ROLE_KEY: str = ""
    SUPABASE_STORAGE_BUCKET: str = "media"

    # ── Groq ──
    GROQ_API_KEY: str = ""
    GROQ_MODEL: str = "llama-3.3-70b-versatile"
    GROQ_BASE_URL: str = "https://api.groq.com"

    @field_validator("GROQ_BASE_URL", mode="before")
    @classmethod
    def normalise_groq_base_url(cls, v: str) -> str:
        """Keep the host only — the SDK appends `/openai/v1` itself.

        The Groq client also reads GROQ_BASE_URL from the environment, so a value that
        already carries the path produces `/openai/v1/openai/v1/chat/completions` and a
        404 that looks nothing like a configuration problem.
        """
        if not isinstance(v, str) or not v.strip():
            return "https://api.groq.com"
        v = v.strip().rstrip("/")
        for suffix in ("/openai/v1", "/openai"):
            if v.endswith(suffix):
                v = v[: -len(suffix)]
        return v.rstrip("/") or "https://api.groq.com"

    # ── Auth ──
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24

    # ── Email ──
    SMTP_HOST: str = ""
    SMTP_PORT: int = 587
    SMTP_USER: str = ""
    SMTP_PASSWORD: str = ""
    EMAIL_FROM: str = "noreply@example.com"
    SALES_EMAIL: str = ""
    SERVICE_EMAIL: str = ""

    # ── Localization ──
    DEFAULT_LOCALE: str = "en"
    SUPPORTED_LOCALES: Annotated[list[str], NoDecode] = ["en", "ur"]

    @field_validator("BACKEND_CORS_ORIGINS", "SUPPORTED_LOCALES", mode="before")
    @classmethod
    def split_comma_separated(cls, v: str | list[str]) -> list[str]:
        """Allow `A,B,C` in .env as well as a real JSON list."""
        if isinstance(v, str):
            return [item.strip() for item in v.split(",") if item.strip()]
        return v

    @field_validator("DATABASE_URL", mode="before")
    @classmethod
    def normalise_database_driver(cls, v: str) -> str:
        """Pin the URL to the driver we actually ship.

        Supabase hands out `postgresql://…`, plenty of guides suggest
        `postgresql+asyncpg://…`, and SQLAlchemy would then try to import a DBAPI that
        is not installed — failing at import with a bare ModuleNotFoundError. This app
        is synchronous and ships psycopg, so any Postgres URL is coerced to it.
        """
        if not isinstance(v, str) or not v:
            return v
        v = v.strip()
        for prefix in ("postgresql+asyncpg://", "postgresql+psycopg2://", "postgresql://", "postgres://"):
            if v.startswith(prefix):
                return "postgresql+psycopg://" + v[len(prefix) :]
        return v

    @property
    def is_production(self) -> bool:
        return self.ENVIRONMENT.lower() in {"production", "prod"}


@lru_cache
def get_settings() -> Settings:
    return Settings()  # type: ignore[call-arg]


settings = get_settings()
