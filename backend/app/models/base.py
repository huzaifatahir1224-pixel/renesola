"""Shared column types and mixins used across every content model."""

import uuid
from datetime import datetime
from typing import Any

from sqlalchemy import Boolean, DateTime, Integer, String
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column

# Translatable text is stored as JSONB keyed by locale:
#   {"en": "Bifacial Module", "ur": "بائی فیشل ماڈیول"}
# One row per product regardless of how many languages it ships in.
Translatable = JSONB


def uuid_pk() -> Mapped[uuid.UUID]:
    return mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)


def translated(nullable: bool = True) -> Mapped[dict[str, Any] | None]:
    return mapped_column(Translatable, nullable=nullable, default=dict)


class SlugMixin:
    """URL identifier — indexed and unique, since every public page resolves by it."""

    slug: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)


class SortableMixin:
    sort_order: Mapped[int] = mapped_column(Integer, default=0, nullable=False)


class PublishableMixin:
    """Draft / published workflow with optional scheduling."""

    is_published: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False, index=True)
    published_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)


class SEOMixin:
    seo_title: Mapped[dict[str, Any] | None] = mapped_column(Translatable, nullable=True)
    seo_description: Mapped[dict[str, Any] | None] = mapped_column(Translatable, nullable=True)
    no_index: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
