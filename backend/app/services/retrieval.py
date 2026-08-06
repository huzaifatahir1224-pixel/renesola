"""Retrieval for site search and the AI assistant.

Hybrid scoring in Postgres:
  * full-text rank over the generated tsvector — real word matches
  * trigram similarity on the title — typos and partial model numbers
    ("RS9 710" still finds "RS9-710~730HBG-E1")

Terms are OR'd, not AND'd. A natural-language question ("high efficiency bifacial panel
above 700W for a ground mounted plant") shares only a few words with any one document, so
requiring all of them returns nothing. OR'ing them and ranking by how many hit is what
makes both the search box and the AI assistant work on real questions.

Deliberately no external vector service: this runs inside the database we already pay
nothing for, and stays within Vercel's function size limit.
"""

import re
from typing import Any

from sqlalchemy import Float, String, bindparam, cast, func, or_, select
from sqlalchemy.orm import Session

from app.models.search import SearchDocument, SourceType

# Words that would match nearly every document and only add noise to the ranking.
_STOPWORDS = {
    "a", "an", "and", "are", "as", "at", "be", "but", "by", "can", "do", "does", "for",
    "from", "has", "have", "how", "i", "in", "is", "it", "me", "my", "need", "of", "on",
    "or", "our", "recommend", "should", "than", "that", "the", "their", "them", "then",
    "there", "these", "this", "to", "want", "was", "what", "when", "where", "which",
    "who", "why", "will", "with", "would", "you", "your",
}

_TOKEN_RE = re.compile(r"[a-z0-9]+", re.IGNORECASE)


def build_tsquery_string(query: str, max_terms: int = 12) -> str:
    """Turn free text into a safe OR'd tsquery: `bifacial:* | panel:* | 700w:*`.

    Only [a-z0-9] survives tokenisation, so no user input can inject tsquery operators.
    Prefix matching (`:*`) lets a partial model number find the full one.
    """
    tokens: list[str] = []
    for raw in _TOKEN_RE.findall(query.lower()):
        if len(raw) < 2 or raw in _STOPWORDS:
            continue
        if raw not in tokens:
            tokens.append(raw)
        if len(tokens) >= max_terms:
            break

    # Every token was a stopword — fall back to the longest raw token so we still try.
    if not tokens:
        fallback = sorted(_TOKEN_RE.findall(query.lower()), key=len, reverse=True)
        tokens = fallback[:1]

    return " | ".join(f"{t}:*" for t in tokens)


def search(
    db: Session,
    query: str,
    *,
    locale: str = "en",
    limit: int = 10,
    source_types: list[SourceType] | None = None,
) -> list[dict[str, Any]]:
    query = (query or "").strip()
    if not query:
        return []

    tsquery_string = build_tsquery_string(query)
    if not tsquery_string:
        return []

    tsquery = func.to_tsquery("simple", bindparam("tsq", tsquery_string, type_=String))
    fts_rank = func.ts_rank(SearchDocument.search_vector, tsquery)
    trgm = func.similarity(SearchDocument.title, bindparam("raw_q", query, type_=String))

    # FTS is the primary signal; trigram is a weaker tiebreaker that rescues typos.
    score = cast(fts_rank, Float) + (cast(trgm, Float) * 0.5)

    stmt = (
        select(
            SearchDocument.source_type,
            SearchDocument.source_id,
            SearchDocument.title,
            SearchDocument.summary,
            SearchDocument.url_path,
            SearchDocument.image_url,
            SearchDocument.content,
            score.label("score"),
        )
        .where(
            SearchDocument.locale == locale,
            or_(SearchDocument.search_vector.op("@@")(tsquery), trgm > 0.15),
        )
        .order_by(score.desc())
        .limit(limit)
    )
    if source_types:
        stmt = stmt.where(SearchDocument.source_type.in_(source_types))

    rows = db.execute(stmt).mappings().all()
    return [
        {
            "source_type": row["source_type"].value
            if hasattr(row["source_type"], "value")
            else str(row["source_type"]),
            "source_id": str(row["source_id"]),
            "title": row["title"],
            "summary": row["summary"],
            "url_path": row["url_path"],
            "image_url": row["image_url"],
            "content": row["content"],
            "score": float(row["score"] or 0),
        }
        for row in rows
    ]


def grouped_search(
    db: Session, query: str, *, locale: str = "en", per_group: int = 5
) -> dict[str, list[dict[str, Any]]]:
    """Global search page — results bucketed by content type."""
    results = search(db, query, locale=locale, limit=per_group * 6)

    grouped: dict[str, list[dict[str, Any]]] = {}
    for item in results:
        bucket = grouped.setdefault(item["source_type"], [])
        if len(bucket) < per_group:
            # The full body is only needed by the AI path — keep this payload small.
            bucket.append({k: v for k, v in item.items() if k != "content"})
    return grouped
