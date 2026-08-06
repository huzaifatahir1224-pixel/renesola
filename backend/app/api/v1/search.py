"""Global site search and the AI intelligent answer."""

from typing import Annotated, Any

from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel, Field

from app.api.deps import DbSession, LocaleDep, require_editor
from app.models.search import SourceType
from app.services.ai import answer_question
from app.services.retrieval import grouped_search, search
from app.services.search_index import rebuild_all

router = APIRouter(prefix="/search", tags=["search"])


@router.get("")
def global_search(
    db: DbSession,
    locale: LocaleDep,
    q: Annotated[str, Query(min_length=1, description="Search terms")],
    limit: Annotated[int, Query(ge=1, le=50)] = 20,
) -> dict[str, Any]:
    """Flat result list, ranked."""
    results = search(db, q, locale=locale, limit=limit)
    return {
        "query": q,
        "total": len(results),
        "results": [{k: v for k, v in r.items() if k != "content"} for r in results],
    }


@router.get("/grouped")
def grouped(
    db: DbSession,
    locale: LocaleDep,
    q: Annotated[str, Query(min_length=1)],
    per_group: Annotated[int, Query(ge=1, le=20)] = 5,
) -> dict[str, Any]:
    """Results bucketed by content type — products, blog, cases, scenarios."""
    return {"query": q, "groups": grouped_search(db, q, locale=locale, per_group=per_group)}


class AskRequest(BaseModel):
    question: str = Field(min_length=2, max_length=1000)
    locale: str | None = None
    source_types: list[SourceType] | None = None
    top_k: int = Field(default=6, ge=1, le=12)


@router.post("/ask")
def ask(db: DbSession, locale: LocaleDep, payload: AskRequest) -> dict[str, Any]:
    """AI intelligent answer — retrieve from the catalogue, then let Groq write the reply.

    Sources are returned alongside the answer so the frontend can render clickable
    citations and the visitor can verify every claim.
    """
    resolved_locale = payload.locale or locale
    sources = search(
        db,
        payload.question,
        locale=resolved_locale,
        limit=payload.top_k,
        source_types=payload.source_types,
    )

    result = answer_question(payload.question, sources)
    return {
        "question": payload.question,
        "answer": result["answer"],
        "model": result["model"],
        "sources": [{k: v for k, v in s.items() if k != "content"} for s in sources],
    }


@router.post("/reindex", dependencies=[Depends(require_editor)])
def reindex(db: DbSession) -> dict[str, Any]:
    """Rebuild the whole search index — run after a bulk import or a locale change."""
    return {"reindexed": rebuild_all(db)}
