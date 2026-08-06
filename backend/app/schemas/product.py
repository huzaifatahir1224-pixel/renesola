"""Product request/response schemas.

Public reads are resolved down to a single locale; admin writes accept every locale at once.
"""

from typing import Any
from uuid import UUID

from pydantic import BaseModel, Field

from app.models.catalog import CellTechnology, ProductType
from app.schemas.common import MediaRef, ORMModel


class SpecRow(BaseModel):
    label: str
    value: str
    unit: str | None = None


class SpecGroup(BaseModel):
    group_title: str
    rows: list[SpecRow] = Field(default_factory=list)


class Feature(BaseModel):
    title: str
    description: str | None = None
    icon: str | None = None


class CategoryBrief(ORMModel):
    id: UUID
    slug: str
    name: str | None = None


class CertificationBrief(ORMModel):
    id: UUID
    name: str
    issuing_body: str | None = None
    image: MediaRef | None = None


# ────────────────────────────── Public reads ──────────────────────────────


class ProductCard(BaseModel):
    """The listing-grid shape — deliberately small, since a page renders 12 of these."""

    id: UUID
    slug: str
    name: str | None = None
    model_number: str
    short_description: str | None = None
    product_type: ProductType | None = None
    cell_technology: CellTechnology | None = None
    power_min: int | None = None
    power_max: int | None = None
    max_efficiency: float | None = None
    hero_image: MediaRef | None = None
    category: CategoryBrief | None = None


class ProductDetail(ProductCard):
    power_tolerance: str | None = None
    annual_degradation: str | None = None
    mechanical_load_positive: int | None = None
    mechanical_load_negative: int | None = None
    warranty_product_years: int | None = None
    warranty_power_years: int | None = None

    gallery: list[MediaRef] = Field(default_factory=list)
    features: list[Feature] = Field(default_factory=list)
    spec_groups: list[SpecGroup] = Field(default_factory=list)

    datasheet: MediaRef | None = None
    installation_manual: MediaRef | None = None
    warranty_document: MediaRef | None = None

    certifications: list[CertificationBrief] = Field(default_factory=list)
    related_products: list[ProductCard] = Field(default_factory=list)

    seo_title: str | None = None
    seo_description: str | None = None


# ────────────────────────────── Admin writes ──────────────────────────────


class ProductCreate(BaseModel):
    """All translatable fields take a locale map: {"en": "...", "ur": "..."}"""

    name: dict[str, str]
    model_number: str
    slug: str | None = Field(default=None, description="Auto-generated from model_number if omitted")
    short_description: dict[str, str] | None = None
    category_id: UUID | None = None
    product_type: ProductType | None = None

    hero_image_id: UUID | None = None
    gallery: list[dict[str, Any]] | None = None

    cell_technology: CellTechnology | None = None
    power_min: int | None = None
    power_max: int | None = None
    max_efficiency: float | None = None
    power_tolerance: str | None = None
    annual_degradation: str | None = None
    mechanical_load_positive: int | None = None
    mechanical_load_negative: int | None = None
    warranty_product_years: int | None = None
    warranty_power_years: int | None = None

    features: dict[str, list[Feature]] | None = None
    spec_groups: dict[str, list[SpecGroup]] | None = None

    datasheet_id: UUID | None = None
    installation_manual_id: UUID | None = None
    warranty_document_id: UUID | None = None

    certification_ids: list[UUID] = Field(default_factory=list)
    scenario_ids: list[UUID] = Field(default_factory=list)
    related_product_ids: list[UUID] = Field(default_factory=list)

    seo_title: dict[str, str] | None = None
    seo_description: dict[str, str] | None = None
    no_index: bool = False

    featured: bool = False
    sort_order: int = 0
    is_published: bool = False


class ProductUpdate(ProductCreate):
    """Every field optional — PATCH semantics."""

    name: dict[str, str] | None = None  # type: ignore[assignment]
    model_number: str | None = None  # type: ignore[assignment]


class ProductFilters(BaseModel):
    """Backs the listing filters the reference site is missing."""

    category: str | None = Field(default=None, description="Category slug")
    product_type: ProductType | None = None
    cell_technology: CellTechnology | None = None
    power_gte: int | None = Field(default=None, description="Minimum wattage")
    power_lte: int | None = Field(default=None, description="Maximum wattage")
    efficiency_gte: float | None = None
    search: str | None = Field(default=None, description="Matches name or model number")
    featured: bool | None = None
