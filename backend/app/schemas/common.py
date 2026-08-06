"""Shared response envelopes and translatable-field helpers."""

from typing import Any, Generic, TypeVar

from pydantic import BaseModel, ConfigDict, Field

T = TypeVar("T")


class ORMModel(BaseModel):
    model_config = ConfigDict(from_attributes=True)


class Paginated(BaseModel, Generic[T]):
    items: list[T]
    total: int
    page: int
    per_page: int
    pages: int

    @classmethod
    def build(cls, items: list[T], total: int, page: int, per_page: int) -> "Paginated[T]":
        return cls(
            items=items,
            total=total,
            page=page,
            per_page=per_page,
            pages=max(1, -(-total // per_page)),  # ceil division
        )


class MediaRef(ORMModel):
    id: str
    url: str
    alt: str | None = None
    width: int | None = None
    height: int | None = None
    sizes: dict[str, Any] | None = None


def pick(field: dict[str, Any] | None, locale: str, fallback: str = "en") -> str | None:
    """Resolve a translatable JSONB field down to one language.

    Falls back to the default locale, then to any value present, so a half-translated
    record still renders something rather than a blank page.
    """
    if not field:
        return None
    if isinstance(field, str):
        return field
    value = field.get(locale) or field.get(fallback)
    if value:
        return value
    for candidate in field.values():
        if candidate:
            return candidate
    return None


def pick_list(field: dict[str, Any] | None, locale: str, fallback: str = "en") -> list[Any]:
    """Same as `pick`, for translatable fields holding lists (features, spec groups)."""
    if not field:
        return []
    if isinstance(field, list):
        return field
    value = field.get(locale) or field.get(fallback)
    if isinstance(value, list):
        return value
    for candidate in field.values():
        if isinstance(candidate, list) and candidate:
            return candidate
    return []


class TranslatedInput(BaseModel):
    """Admin write payload — accepts every locale at once: {"en": "...", "ur": "..."}"""

    model_config = ConfigDict(extra="allow")


class MessageResponse(BaseModel):
    message: str
    detail: str | None = Field(default=None)
