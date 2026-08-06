"""Product category tree — drives the mega menu and the listing sidebar."""

from typing import Any
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from slugify import slugify
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.api.deps import DbSession, LocaleDep, require_admin, require_editor
from app.models.catalog import Category
from app.schemas.common import MessageResponse
from app.services.serializers import category_out

router = APIRouter(prefix="/categories", tags=["categories"])


class CategoryCreate(BaseModel):
    name: dict[str, str]
    slug: str | None = None
    description: dict[str, str] | None = None
    parent_id: UUID | None = None
    banner_image_id: UUID | None = None
    sort_order: int = 0


class CategoryUpdate(CategoryCreate):
    name: dict[str, str] | None = None  # type: ignore[assignment]


@router.get("/tree")
def category_tree(db: DbSession, locale: LocaleDep) -> list[dict[str, Any]]:
    """Nested top-level categories with their children — one call builds the whole menu."""
    roots = db.scalars(
        select(Category)
        .where(Category.parent_id.is_(None))
        .options(selectinload(Category.children).selectinload(Category.banner_image))
        .order_by(Category.sort_order)
    ).all()
    return [category_out(c, locale, with_children=True) for c in roots]


@router.get("")
def list_categories(db: DbSession, locale: LocaleDep) -> list[dict[str, Any]]:
    rows = db.scalars(select(Category).order_by(Category.sort_order)).all()
    return [category_out(c, locale) for c in rows]


@router.get("/{slug}")
def get_category(db: DbSession, locale: LocaleDep, slug: str) -> dict[str, Any]:
    category = db.scalar(
        select(Category).where(Category.slug == slug).options(selectinload(Category.children))
    )
    if category is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Category not found")
    return category_out(category, locale, with_children=True)


def _unique_slug(db: DbSession, base: str, exclude_id: UUID | None = None) -> str:
    candidate = slugify(base) or "category"
    n = 1
    while True:
        stmt = select(Category.id).where(Category.slug == candidate)
        if exclude_id:
            stmt = stmt.where(Category.id != exclude_id)
        if db.scalar(stmt) is None:
            return candidate
        n += 1
        candidate = f"{slugify(base)}-{n}"


@router.post("", status_code=status.HTTP_201_CREATED, dependencies=[Depends(require_editor)])
def create_category(db: DbSession, locale: LocaleDep, payload: CategoryCreate) -> dict[str, Any]:
    data = payload.model_dump(exclude={"slug"})
    category = Category(**data)
    category.slug = _unique_slug(db, payload.slug or next(iter(payload.name.values()), "category"))
    db.add(category)
    db.commit()
    db.refresh(category)
    return category_out(category, locale)


@router.patch("/{category_id}", dependencies=[Depends(require_editor)])
def update_category(
    db: DbSession, locale: LocaleDep, category_id: UUID, payload: CategoryUpdate
) -> dict[str, Any]:
    category = db.get(Category, category_id)
    if category is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Category not found")
    if payload.parent_id == category_id:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "A category cannot be its own parent")

    data = payload.model_dump(exclude_unset=True)
    if data.get("slug"):
        data["slug"] = _unique_slug(db, data["slug"], exclude_id=category_id)
    for key, value in data.items():
        setattr(category, key, value)
    db.commit()
    db.refresh(category)
    return category_out(category, locale)


@router.delete("/{category_id}", dependencies=[Depends(require_admin)])
def delete_category(db: DbSession, category_id: UUID) -> MessageResponse:
    category = db.get(Category, category_id)
    if category is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Category not found")
    db.delete(category)
    db.commit()
    return MessageResponse(message="Category deleted")
