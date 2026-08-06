"""Search index backing the "AI intelligent answer" feature.

Every published product, post, case study, and scenario is flattened into a row of
searchable text here. Retrieval uses Postgres full-text search plus trigram similarity
(so typos and partial model numbers still match); Groq then writes the answer from the
rows we retrieved, which keeps it grounded in the real catalogue.

Deliberately no pgvector: generating embeddings needs a model that does not fit in
Vercel's 250 MB function limit, and Groq serves LLMs only, not embeddings.
"""

import enum
import uuid

from sqlalchemy import Computed, Enum, Index, String, Text
from sqlalchemy.dialects.postgresql import TSVECTOR, UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class SourceType(str, enum.Enum):
    PRODUCT = "product"
    POST = "post"
    CASE_STUDY = "case-study"
    SCENARIO = "scenario"
    DOWNLOAD = "download"
    PAGE = "page"


class SearchDocument(Base):
    __tablename__ = "search_documents"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    source_type: Mapped[SourceType] = mapped_column(
        Enum(SourceType, native_enum=False, length=32), nullable=False, index=True
    )
    source_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), nullable=False, index=True)
    locale: Mapped[str] = mapped_column(String(10), nullable=False, default="en", index=True)

    # Shown in the results list and cited by the AI answer.
    title: Mapped[str] = mapped_column(String(500), nullable=False)
    summary: Mapped[str | None] = mapped_column(Text, nullable=True)
    url_path: Mapped[str] = mapped_column(String(1000), nullable=False)
    image_url: Mapped[str | None] = mapped_column(String(1000), nullable=True)

    # Everything worth matching on, concatenated: name, model number, specs, body copy.
    content: Mapped[str] = mapped_column(Text, nullable=False)

    # Maintained by Postgres itself — no application code can let it drift.
    # 'simple' rather than 'english' so Urdu and Arabic content still tokenises.
    search_vector: Mapped[str] = mapped_column(
        TSVECTOR,
        Computed(
            "setweight(to_tsvector('simple', coalesce(title, '')), 'A') || "
            "setweight(to_tsvector('simple', coalesce(content, '')), 'B')",
            persisted=True,
        ),
        nullable=False,
    )

    __table_args__ = (
        Index("ix_search_documents_fts", "search_vector", postgresql_using="gin"),
        # Trigram index catches typos and partial model numbers ("RS9-710" → "RS9-710~730HBG-E1").
        Index(
            "ix_search_documents_title_trgm",
            "title",
            postgresql_using="gin",
            postgresql_ops={"title": "gin_trgm_ops"},
        ),
        Index("ix_search_documents_source", "source_type", "source_id", "locale", unique=True),
    )

    def __repr__(self) -> str:
        return f"<SearchDocument {self.source_type.value}:{self.title[:40]}>"
