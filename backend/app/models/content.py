"""Editorial content: scenarios, case studies, blog posts, downloads, certifications, offices, milestones."""

import enum
import uuid
from datetime import date
from typing import Any

from sqlalchemy import Boolean, Date, Enum, ForeignKey, Integer, String
from sqlalchemy.dialects.postgresql import ARRAY, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.models.associations import (
    case_products,
    product_certifications,
    product_scenarios,
    scenario_cases,
    scenario_products,
)
from app.models.base import (
    PublishableMixin,
    SEOMixin,
    SlugMixin,
    SortableMixin,
    Translatable,
)


class PostCategory(str, enum.Enum):
    COMPANY_NEWS = "company-news"
    INDUSTRY_NEWS = "industry-news"
    EXHIBITIONS = "exhibitions"


class SystemType(str, enum.Enum):
    RESIDENTIAL = "residential"
    COMMERCIAL = "commercial"
    UTILITY = "utility"


class DownloadCategory(str, enum.Enum):
    DATASHEET = "datasheet"
    COMPANY = "company"
    CERTIFICATE = "certificate"
    WARRANTY = "warranty"
    INSTALLATION = "installation"
    STORED_ENERGY = "stored-energy"
    REGIONAL = "regional"


class Scenario(Base, SlugMixin, SortableMixin, PublishableMixin, SEOMixin):
    """Distributed System → Industry & Commerce / Household; Ground Power Plants → Large Surface."""

    __tablename__ = "scenarios"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name: Mapped[dict[str, Any]] = mapped_column(Translatable, nullable=False, default=dict)
    intro: Mapped[dict[str, Any] | None] = mapped_column(Translatable, nullable=True)
    body: Mapped[dict[str, Any] | None] = mapped_column(Translatable, nullable=True)
    # [{"title": ..., "description": ...}, …] keyed by locale
    benefits: Mapped[dict[str, Any] | None] = mapped_column(Translatable, nullable=True, default=dict)

    parent_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("scenarios.id", ondelete="SET NULL"), nullable=True, index=True
    )
    parent: Mapped["Scenario | None"] = relationship(
        "Scenario", remote_side="Scenario.id", back_populates="children"
    )
    children: Mapped[list["Scenario"]] = relationship("Scenario", back_populates="parent")

    hero_image_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("media.id", ondelete="SET NULL"), nullable=True
    )
    hero_image = relationship("Media", foreign_keys=[hero_image_id], lazy="joined")
    system_diagram_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("media.id", ondelete="SET NULL"), nullable=True
    )
    system_diagram = relationship("Media", foreign_keys=[system_diagram_id])
    gallery: Mapped[list[dict[str, Any]] | None] = mapped_column(Translatable, nullable=True, default=list)

    products = relationship("Product", secondary=product_scenarios, back_populates="scenarios")
    recommended_products = relationship("Product", secondary=scenario_products)
    related_cases = relationship("CaseStudy", secondary=scenario_cases, back_populates="scenarios")

    def __repr__(self) -> str:
        return f"<Scenario {self.slug}>"


class CaseStudy(Base, SlugMixin, PublishableMixin, SEOMixin):
    """Installed projects — the proof tender committees and banks ask for."""

    __tablename__ = "case_studies"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    project_name: Mapped[dict[str, Any]] = mapped_column(Translatable, nullable=False, default=dict)
    city: Mapped[dict[str, Any] | None] = mapped_column(Translatable, nullable=True)
    country: Mapped[dict[str, Any] | None] = mapped_column(Translatable, nullable=True)
    description: Mapped[dict[str, Any] | None] = mapped_column(Translatable, nullable=True)

    capacity_value: Mapped[float | None] = mapped_column(nullable=True)
    capacity_unit: Mapped[str | None] = mapped_column(String(8), nullable=True, default="MW")
    # Normalised to kW so listings can sort and filter across mixed units.
    capacity_kw: Mapped[float | None] = mapped_column(nullable=True, index=True)

    system_type: Mapped[SystemType | None] = mapped_column(
        Enum(SystemType, native_enum=False, length=20), nullable=True, index=True
    )
    year: Mapped[int | None] = mapped_column(Integer, nullable=True, index=True)

    cover_image_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("media.id", ondelete="SET NULL"), nullable=True
    )
    cover_image = relationship("Media", foreign_keys=[cover_image_id], lazy="joined")
    gallery: Mapped[list[dict[str, Any]] | None] = mapped_column(Translatable, nullable=True, default=list)

    products = relationship("Product", secondary=case_products)
    scenarios = relationship("Scenario", secondary=scenario_cases, back_populates="related_cases")

    featured: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False, index=True)

    @property
    def capacity_label(self) -> str | None:
        if self.capacity_value is None:
            return None
        value = int(self.capacity_value) if self.capacity_value.is_integer() else self.capacity_value
        return f"{value}{self.capacity_unit or ''}"

    def __repr__(self) -> str:
        return f"<CaseStudy {self.slug}>"


class Post(Base, SlugMixin, PublishableMixin, SEOMixin):
    """Company News / Industry News / Exhibition Information."""

    __tablename__ = "posts"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    title: Mapped[dict[str, Any]] = mapped_column(Translatable, nullable=False, default=dict)
    excerpt: Mapped[dict[str, Any] | None] = mapped_column(Translatable, nullable=True)
    body: Mapped[dict[str, Any] | None] = mapped_column(Translatable, nullable=True)

    category: Mapped[PostCategory] = mapped_column(
        Enum(PostCategory, native_enum=False, length=32), nullable=False, index=True
    )
    tags: Mapped[list[str] | None] = mapped_column(ARRAY(String(80)), nullable=True, default=list)

    cover_image_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("media.id", ondelete="SET NULL"), nullable=True
    )
    cover_image = relationship("Media", foreign_keys=[cover_image_id], lazy="joined")

    author_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )
    author = relationship("User", foreign_keys=[author_id])

    view_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    featured: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False, index=True)

    def __repr__(self) -> str:
        return f"<Post {self.slug}>"


class Download(Base, SortableMixin):
    """The download centre — datasheets, certificates, manuals, warranties."""

    __tablename__ = "downloads"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    title: Mapped[dict[str, Any]] = mapped_column(Translatable, nullable=False, default=dict)
    category: Mapped[DownloadCategory] = mapped_column(
        Enum(DownloadCategory, native_enum=False, length=32), nullable=False, index=True
    )
    # e.g. "For Australia", "For Pakistan" — regional document variants
    region: Mapped[str | None] = mapped_column(String(120), nullable=True, index=True)

    file_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("media.id", ondelete="SET NULL"), nullable=True
    )
    file = relationship("Media", foreign_keys=[file_id], lazy="joined")
    thumbnail_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("media.id", ondelete="SET NULL"), nullable=True
    )
    thumbnail = relationship("Media", foreign_keys=[thumbnail_id])

    product_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("products.id", ondelete="SET NULL"), nullable=True
    )
    product = relationship("Product", foreign_keys=[product_id])

    download_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    is_published: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False, index=True)

    def __repr__(self) -> str:
        return f"<Download {self.category.value}>"


class Certification(Base, SortableMixin):
    """IEC / ISO / TUV / UL credentials shown on product pages and the honours page."""

    __tablename__ = "certifications"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    issuing_body: Mapped[str | None] = mapped_column(String(200), nullable=True)
    certificate_number: Mapped[str | None] = mapped_column(String(200), nullable=True)
    issued_year: Mapped[int | None] = mapped_column(Integer, nullable=True)
    valid_until: Mapped[date | None] = mapped_column(Date, nullable=True)
    description: Mapped[dict[str, Any] | None] = mapped_column(Translatable, nullable=True)

    image_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("media.id", ondelete="SET NULL"), nullable=True
    )
    image = relationship("Media", foreign_keys=[image_id], lazy="joined")

    show_on_honors_page: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    products = relationship(
        "Product", secondary=product_certifications, back_populates="certifications"
    )

    def __repr__(self) -> str:
        return f"<Certification {self.name}>"


class Office(Base, SortableMixin):
    """Global office locations rendered on the contact page."""

    __tablename__ = "offices"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    region_name: Mapped[dict[str, Any]] = mapped_column(Translatable, nullable=False, default=dict)
    address: Mapped[dict[str, Any] | None] = mapped_column(Translatable, nullable=True)
    phone: Mapped[str | None] = mapped_column(String(80), nullable=True)
    email: Mapped[str | None] = mapped_column(String(255), nullable=True)
    latitude: Mapped[float | None] = mapped_column(nullable=True)
    longitude: Mapped[float | None] = mapped_column(nullable=True)
    is_headquarters: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    def __repr__(self) -> str:
        return f"<Office {self.email}>"


class Milestone(Base, SortableMixin):
    """Company history timeline on the About page."""

    __tablename__ = "milestones"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    year: Mapped[int] = mapped_column(Integer, nullable=False, index=True)
    title: Mapped[dict[str, Any]] = mapped_column(Translatable, nullable=False, default=dict)
    description: Mapped[dict[str, Any] | None] = mapped_column(Translatable, nullable=True)

    image_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("media.id", ondelete="SET NULL"), nullable=True
    )
    image = relationship("Media", foreign_keys=[image_id])

    def __repr__(self) -> str:
        return f"<Milestone {self.year}>"
