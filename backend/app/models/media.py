"""Uploaded images and PDFs. Files live in Supabase Storage; rows here hold the metadata."""

import uuid
from typing import Any

from sqlalchemy import Integer, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base
from app.models.base import Translatable


class Media(Base):
    __tablename__ = "media"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    filename: Mapped[str] = mapped_column(String(500), nullable=False)
    storage_path: Mapped[str] = mapped_column(String(1000), nullable=False)
    url: Mapped[str] = mapped_column(String(1000), nullable=False)
    mime_type: Mapped[str] = mapped_column(String(120), nullable=False)
    size_bytes: Mapped[int] = mapped_column(Integer, nullable=False, default=0)

    # Images only
    width: Mapped[int | None] = mapped_column(Integer, nullable=True)
    height: Mapped[int | None] = mapped_column(Integer, nullable=True)

    # Responsive variants: {"thumbnail": {"url": ..., "width": 400}, "card": {...}}
    sizes: Mapped[dict[str, Any] | None] = mapped_column(Translatable, nullable=True, default=dict)

    alt: Mapped[dict[str, Any] | None] = mapped_column(Translatable, nullable=True, default=dict)
    caption: Mapped[dict[str, Any] | None] = mapped_column(Translatable, nullable=True, default=dict)

    @property
    def is_image(self) -> bool:
        return self.mime_type.startswith("image/")

    def __repr__(self) -> str:
        return f"<Media {self.filename}>"
