"""Product catalog — categories and products."""

import enum
import uuid
from typing import Any

from sqlalchemy import Boolean, Enum, ForeignKey, Integer, Numeric, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.models.associations import (
    product_certifications,
    product_related,
    product_scenarios,
)
from app.models.base import (
    PublishableMixin,
    SEOMixin,
    SlugMixin,
    SortableMixin,
    Translatable,
)


class CellTechnology(str, enum.Enum):
    N_TYPE = "n-type"
    HJT_TYPE = "hjt-type"
    BC = "bc"
    P_TYPE = "p-type"


class ProductType(str, enum.Enum):
    MONO_FACIAL = "mono-facial"
    BIFACIAL = "bifacial"
    INVERTER = "inverter"
    BATTERY = "battery"
    STORAGE_CABINET = "storage-cabinet"


class Category(Base, SlugMixin, SortableMixin):
    """Two-level taxonomy: PV Modules → Rene series, Energy Storage → Inverter/Battery/…"""

    __tablename__ = "categories"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name: Mapped[dict[str, Any]] = mapped_column(Translatable, nullable=False, default=dict)
    description: Mapped[dict[str, Any] | None] = mapped_column(Translatable, nullable=True)

    parent_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("categories.id", ondelete="SET NULL"), nullable=True, index=True
    )
    parent: Mapped["Category | None"] = relationship(
        "Category", remote_side="Category.id", back_populates="children"
    )
    children: Mapped[list["Category"]] = relationship(
        "Category", back_populates="parent", cascade="all", order_by="Category.sort_order"
    )

    banner_image_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("media.id", ondelete="SET NULL"), nullable=True
    )
    banner_image = relationship("Media", foreign_keys=[banner_image_id], lazy="joined")

    products: Mapped[list["Product"]] = relationship("Product", back_populates="category")

    def __repr__(self) -> str:
        return f"<Category {self.slug}>"


class Product(Base, SlugMixin, SortableMixin, PublishableMixin, SEOMixin):
    __tablename__ = "products"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    # ── Identity ──
    name: Mapped[dict[str, Any]] = mapped_column(Translatable, nullable=False, default=dict)
    model_number: Mapped[str] = mapped_column(String(160), nullable=False, index=True)
    short_description: Mapped[dict[str, Any] | None] = mapped_column(Translatable, nullable=True)

    category_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("categories.id", ondelete="SET NULL"), nullable=True, index=True
    )
    category: Mapped["Category | None"] = relationship("Category", back_populates="products")

    product_type: Mapped[ProductType | None] = mapped_column(
        Enum(ProductType, native_enum=False, length=32), nullable=True, index=True
    )

    # ── Images ──
    hero_image_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("media.id", ondelete="SET NULL"), nullable=True
    )
    hero_image = relationship("Media", foreign_keys=[hero_image_id], lazy="joined")
    # [{"media_id": "...", "sort": 0}, …]
    gallery: Mapped[list[dict[str, Any]] | None] = mapped_column(Translatable, nullable=True, default=list)

    # ── Key specs (filterable, so these stay real columns) ──
    cell_technology: Mapped[CellTechnology | None] = mapped_column(
        Enum(CellTechnology, native_enum=False, length=32), nullable=True, index=True
    )
    power_min: Mapped[int | None] = mapped_column(Integer, nullable=True, index=True)
    power_max: Mapped[int | None] = mapped_column(Integer, nullable=True, index=True)
    max_efficiency: Mapped[float | None] = mapped_column(Numeric(5, 2), nullable=True, index=True)
    power_tolerance: Mapped[str | None] = mapped_column(String(60), nullable=True)
    annual_degradation: Mapped[str | None] = mapped_column(String(60), nullable=True)
    mechanical_load_positive: Mapped[int | None] = mapped_column(Integer, nullable=True)
    mechanical_load_negative: Mapped[int | None] = mapped_column(Integer, nullable=True)
    warranty_product_years: Mapped[int | None] = mapped_column(Integer, nullable=True)
    warranty_power_years: Mapped[int | None] = mapped_column(Integer, nullable=True)

    # ── Display-only nested content (JSONB — never filtered on) ──
    # [{"title": ..., "description": ..., "icon": ...}, …] keyed by locale
    features: Mapped[dict[str, Any] | None] = mapped_column(Translatable, nullable=True, default=dict)
    # {"en": [{"group_title": "Electrical Data (STC)", "rows": [{"label","value","unit"}]}]}
    spec_groups: Mapped[dict[str, Any] | None] = mapped_column(Translatable, nullable=True, default=dict)

    # ── Documents ──
    datasheet_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("media.id", ondelete="SET NULL"), nullable=True
    )
    datasheet = relationship("Media", foreign_keys=[datasheet_id])
    installation_manual_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("media.id", ondelete="SET NULL"), nullable=True
    )
    installation_manual = relationship("Media", foreign_keys=[installation_manual_id])
    warranty_document_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("media.id", ondelete="SET NULL"), nullable=True
    )
    warranty_document = relationship("Media", foreign_keys=[warranty_document_id])

    # ── Relations ──
    certifications = relationship(
        "Certification", secondary=product_certifications, back_populates="products"
    )
    scenarios = relationship("Scenario", secondary=product_scenarios, back_populates="products")
    related_products = relationship(
        "Product",
        secondary=product_related,
        primaryjoin="Product.id == product_related.c.product_id",
        secondaryjoin="Product.id == product_related.c.related_id",
    )

    featured: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False, index=True)

    def __repr__(self) -> str:
        return f"<Product {self.model_number}>"
