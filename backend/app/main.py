"""FastAPI application entrypoint."""

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy import text

from app.api.v1.router import api_router
from app.core.config import settings
from app.core.database import engine


@asynccontextmanager
async def lifespan(app: FastAPI):
    # pg_trgm powers fuzzy matching in search — must exist before the first query.
    with engine.connect() as conn:
        conn.execute(text("CREATE EXTENSION IF NOT EXISTS pg_trgm"))
        conn.commit()
    yield
    engine.dispose()


app = FastAPI(
    title=settings.PROJECT_NAME,
    version="0.1.0",
    description="CMS API, lead capture, and Groq-powered AI search for a solar PV manufacturer.",
    openapi_url=f"{settings.API_V1_PREFIX}/openapi.json" if not settings.is_production else None,
    docs_url="/docs" if not settings.is_production else None,
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.BACKEND_CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


app.include_router(api_router, prefix=settings.API_V1_PREFIX)


@app.get("/health", tags=["system"])
def health() -> JSONResponse:
    """Liveness probe — also confirms the database is reachable."""
    try:
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        db_ok = True
    except Exception:
        db_ok = False

    return JSONResponse(
        status_code=200 if db_ok else 503,
        content={
            "status": "ok" if db_ok else "degraded",
            "database": "connected" if db_ok else "unreachable",
            "environment": settings.ENVIRONMENT,
        },
    )
