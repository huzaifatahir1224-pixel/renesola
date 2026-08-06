"""Product catalogue — public reads plus admin CRUD."""

from typing import Annotated, Any
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from slugify import slugify
from sqlalchemy import Text, cast, func, or_, select
from sqlalchemy.orm import selectinload

from app.api.deps import DbSession, LocaleDep, PaginationDep, require_admin, require_editor
from app.models.catalog import Category, CellTechnology, Product, ProductType
from app.models.content import Certification, Scenario
from app.models.media import Media
from app.schemas.common import MessageResponse
from app.schemas.product import ProductCreate, ProductUpdate
from app.services.search_index import reindex_product, remove_from_index
from app.services.serializers import product_card, product_detail

router = APIRouter(prefix="/products", tags=["products"])


def _detail_query():
    return select(Product).options(
        selectinload(Product.category),
        selectinload(Product.certifications).selectinload(Certification.image),
        selectinload(Product.scenarios),
        selectinload(Product.related_products).selectinload(Product.category),
        selectinload(Product.datasheet),
        selectinload(Product.installation_manual),
        selectinload(Product.warranty_document),
    )


def _unique_slug(db: DbSession, base: str, exclude_id: UUID | None = None) -> str:
    """Append -2, -3 … until the slug is free."""
    candidate = slugify(base) or "product"
    n = 1
    while True:
        stmt = select(Product.id).where(Product.slug == candidate)
        if exclude_id:
            stmt = stmt.where(Product.id != exclude_id)
        if db.scalar(stmt) is None:
            return candidate
        n += 1
        candidate = f"{slugify(base)}-{n}"


# ────────────────────────────── Public ──────────────────────────────


@router.get("")
def list_products(
    db: DbSession,
    locale: LocaleDep,
    page: PaginationDep,
    category: Annotated[str | None, Query(description="Category slug")] = None,
    product_type: ProductType | None = None,
    cell_technology: CellTechnology | None = None,
    power_gte: Annotated[int | None, Query(description="Minimum wattage")] = None,
    power_lte: Annotated[int | None, Query(description="Maximum wattage")] = None,
    efficiency_gte: float | None = None,
    search: Annotated[str | None, Query(description="Matches name or model number")] = None,
    featured: bool | None = None,
) -> dict[str, Any]:
    """Filtering the reference site does not offer: by power, efficiency, and cell type."""
    stmt = select(Product).where(Product.is_published.is_(True))

    if category:
        cat = db.scalar(select(Category).where(Category.slug == category))
        if cat is None:
            raise HTTPException(status.HTTP_404_NOT_FOUND, "Category not found")
        # Include every descendant so "Photovoltaic Modules" returns the whole subtree.
        ids = [cat.id]
        frontier = [cat]
        while frontier:
            node = frontier.pop()
            for child in node.children:
                ids.append(child.id)
                frontier.append(child)
        stmt = stmt.where(Product.category_id.in_(ids))

    if product_type:
        stmt = stmt.where(Product.product_type == product_type)
    if cell_technology:
        stmt = stmt.where(Product.cell_technology == cell_technology)
    if power_gte is not None:
        stmt = stmt.where(Product.power_max >= power_gte)
    if power_lte is not None:
        stmt = stmt.where(Product.power_min <= power_lte)
    if efficiency_gte is not None:
        stmt = stmt.where(Product.max_efficiency >= efficiency_gte)
    if featured is not None:
        stmt = stmt.where(Product.featured.is_(featured))
    if search:
        term = f"%{search.lower()}%"
        # `name` is JSONB across locales — cast to text so one LIKE covers every language.
        stmt = stmt.where(
            or_(
                func.lower(Product.model_number).like(term),
                func.lower(cast(Product.name, Text)).like(term),
            )
        )

    total = db.scalar(select(func.count()).select_from(stmt.subquery())) or 0
    rows = db.scalars(
        stmt.options(selectinload(Product.category))
        .order_by(Product.sort_order, Product.model_number)
        .offset(page.offset)
        .limit(page.limit)
    ).all()

    return {
        "items": [product_card(p, locale) for p in rows],
        "total": total,
        "page": page.page,
        "per_page": page.per_page,
        "pages": max(1, -(-total // page.per_page)),
    }


@router.get("/{slug}")
def get_product(db: DbSession, locale: LocaleDep, slug: str) -> dict[str, Any]:
    product = db.scalar(
        _detail_query().where(Product.slug == slug, Product.is_published.is_(True))
    )
    if product is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Product not found")

    def lookup(media_id: str | None) -> Media | None:
        return db.get(Media, UUID(media_id)) if media_id else None

    return product_detail(product, locale, lookup)


# ────────────────────────────── Admin ──────────────────────────────


@router.get("/admin/all", dependencies=[Depends(require_editor)])
def admin_list_products(db: DbSession, locale: LocaleDep, page: PaginationDep) -> dict[str, Any]:
    """Includes drafts — the admin listing."""
    stmt = select(Product)
    total = db.scalar(select(func.count()).select_from(stmt.subquery())) or 0
    rows = db.scalars(
        stmt.options(selectinload(Product.category))
        .order_by(Product.sort_order, Product.model_number)
        .offset(page.offset)
        .limit(page.limit)
    ).all()
    return {
        "items": [{**product_card(p, locale), "is_published": p.is_published} for p in rows],
        "total": total,
        "page": page.page,
        "per_page": page.per_page,
        "pages": max(1, -(-total // page.per_page)),
    }


def _apply_relations(db: DbSession, product: Product, payload: ProductCreate | ProductUpdate) -> None:
    if payload.certification_ids is not None:
        product.certifications = list(
            db.scalars(select(Certification).where(Certification.id.in_(payload.certification_ids)))
        )
    if payload.scenario_ids is not None:
        product.scenarios = list(
            db.scalars(select(Scenario).where(Scenario.id.in_(payload.scenario_ids)))
        )
    if payload.related_product_ids is not None:
        product.related_products = list(
            db.scalars(
                select(Product).where(
                    Product.id.in_(payload.related_product_ids), Product.id != product.id
                )
            )
        )


@router.post("", status_code=status.HTTP_201_CREATED, dependencies=[Depends(require_editor)])
def create_product(db: DbSession, locale: LocaleDep, payload: ProductCreate) -> dict[str, Any]:
    scalar_fields = payload.model_dump(
        exclude={"certification_ids", "scenario_ids", "related_product_ids", "features", "spec_groups", "slug"}
    )
    product = Product(**scalar_fields)
    product.slug = _unique_slug(db, payload.slug or payload.model_number)

    if payload.features:
        product.features = {
            loc: [f.model_dump() for f in items] for loc, items in payload.features.items()
        }
    if payload.spec_groups:
        product.spec_groups = {
            loc: [g.model_dump() for g in items] for loc, items in payload.spec_groups.items()
        }

    db.add(product)
    db.flush()
    _apply_relations(db, product, payload)
    db.commit()
    db.refresh(product)

    reindex_product(db, product)
    return product_detail(product, locale)


@router.patch("/{product_id}", dependencies=[Depends(require_editor)])
def update_product(
    db: DbSession, locale: LocaleDep, product_id: UUID, payload: ProductUpdate
) -> dict[str, Any]:
    product = db.get(Product, product_id)
    if product is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Product not found")

    data = payload.model_dump(
        exclude_unset=True,
        exclude={"certification_ids", "scenario_ids", "related_product_ids", "features", "spec_groups"},
    )
    if "slug" in data and data["slug"]:
        data["slug"] = _unique_slug(db, data["slug"], exclude_id=product_id)
    for key, value in data.items():
        setattr(product, key, value)

    if payload.features is not None:
        product.features = {
            loc: [f.model_dump() for f in items] for loc, items in payload.features.items()
        }
    if payload.spec_groups is not None:
        product.spec_groups = {
            loc: [g.model_dump() for g in items] for loc, items in payload.spec_groups.items()
        }

    _apply_relations(db, product, payload)
    db.commit()
    db.refresh(product)

    reindex_product(db, product)
    return product_detail(product, locale)


@router.delete("/{product_id}", dependencies=[Depends(require_admin)])
def delete_product(db: DbSession, product_id: UUID) -> MessageResponse:
    product = db.get(Product, product_id)
    if product is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Product not found")
    remove_from_index(db, "product", product.id)
    db.delete(product)
    db.commit()
    return MessageResponse(message="Product deleted")
