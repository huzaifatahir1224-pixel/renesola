"""Keeps `search_documents` in sync with published content.

One flat row per (content item × locale), holding every word worth matching on. Both the
plain site search and the AI answer read from this table, so they never disagree.
"""

from typing import Any
from uuid import UUID

from sqlalchemy import delete, select
from sqlalchemy.orm import Session

from app.core.config import settings
from app.models.catalog import Product
from app.models.content import CaseStudy, Post, Scenario
from app.models.search import SearchDocument, SourceType
from app.schemas.common import pick, pick_list


def _locales() -> list[str]:
    return settings.SUPPORTED_LOCALES or [settings.DEFAULT_LOCALE]


def _upsert(
    db: Session,
    *,
    source_type: SourceType,
    source_id: UUID,
    locale: str,
    title: str,
    summary: str | None,
    url_path: str,
    content: str,
    image_url: str | None = None,
) -> None:
    existing = db.scalar(
        select(SearchDocument).where(
            SearchDocument.source_type == source_type,
            SearchDocument.source_id == source_id,
            SearchDocument.locale == locale,
        )
    )
    if existing:
        existing.title = title
        existing.summary = summary
        existing.url_path = url_path
        existing.content = content
        existing.image_url = image_url
        return

    db.add(
        SearchDocument(
            source_type=source_type,
            source_id=source_id,
            locale=locale,
            title=title,
            summary=summary,
            url_path=url_path,
            content=content,
            image_url=image_url,
        )
    )


def remove_from_index(db: Session, source_type: str, source_id: UUID) -> None:
    db.execute(
        delete(SearchDocument).where(
            SearchDocument.source_type == SourceType(source_type),
            SearchDocument.source_id == source_id,
        )
    )
    db.commit()


def reindex_product(db: Session, product: Product) -> None:
    if not product.is_published:
        remove_from_index(db, "product", product.id)
        return

    for locale in _locales():
        name = pick(product.name, locale) or product.model_number
        parts: list[str] = [name, product.model_number]

        if desc := pick(product.short_description, locale):
            parts.append(desc)

        # Specs are what buyers actually search for — fold them into the text.
        specs = [
            ("cell technology", product.cell_technology.value if product.cell_technology else None),
            ("power", f"{product.power_min}-{product.power_max}W" if product.power_min else None),
            ("efficiency", f"{product.max_efficiency}%" if product.max_efficiency else None),
            ("power tolerance", product.power_tolerance),
            ("annual degradation", product.annual_degradation),
            (
                "mechanical load",
                f"{product.mechanical_load_positive}Pa positive / "
                f"{product.mechanical_load_negative}Pa negative"
                if product.mechanical_load_positive or product.mechanical_load_negative
                else None,
            ),
            ("product type", product.product_type.value if product.product_type else None),
            (
                "warranty",
                f"{product.warranty_product_years} year product / "
                f"{product.warranty_power_years} year power"
                if product.warranty_power_years
                else None,
            ),
        ]
        parts.extend(f"{label}: {value}" for label, value in specs if value)

        for feature in pick_list(product.features, locale):
            parts.append(f"{feature.get('title', '')} {feature.get('description', '')}".strip())

        for group in pick_list(product.spec_groups, locale):
            for row in group.get("rows", []):
                parts.append(f"{row.get('label', '')}: {row.get('value', '')} {row.get('unit', '')}")

        parts.extend(cert.name for cert in product.certifications)

        _upsert(
            db,
            source_type=SourceType.PRODUCT,
            source_id=product.id,
            locale=locale,
            title=f"{name} — {product.model_number}",
            summary=pick(product.short_description, locale),
            url_path=f"/products/{product.slug}",
            content="\n".join(p for p in parts if p),
            image_url=product.hero_image.url if product.hero_image else None,
        )
    db.commit()


def reindex_post(db: Session, post: Post) -> None:
    if not post.is_published:
        remove_from_index(db, "post", post.id)
        return

    for locale in _locales():
        title = pick(post.title, locale) or ""
        body = pick(post.body, locale) or ""
        _upsert(
            db,
            source_type=SourceType.POST,
            source_id=post.id,
            locale=locale,
            title=title,
            summary=pick(post.excerpt, locale),
            url_path=f"/blog/{post.slug}",
            content="\n".join(
                filter(None, [title, pick(post.excerpt, locale), _strip_html(body), " ".join(post.tags or [])])
            ),
            image_url=post.cover_image.url if post.cover_image else None,
        )
    db.commit()


def reindex_case(db: Session, case: CaseStudy) -> None:
    if not case.is_published:
        remove_from_index(db, "case-study", case.id)
        return

    for locale in _locales():
        name = pick(case.project_name, locale) or ""
        location = " ".join(filter(None, [pick(case.city, locale), pick(case.country, locale)]))
        _upsert(
            db,
            source_type=SourceType.CASE_STUDY,
            source_id=case.id,
            locale=locale,
            title=name,
            summary=f"{location} — {case.capacity_label}" if case.capacity_label else location,
            url_path=f"/cases/{case.slug}",
            content="\n".join(
                filter(
                    None,
                    [
                        name,
                        location,
                        case.capacity_label,
                        case.system_type.value if case.system_type else None,
                        str(case.year) if case.year else None,
                        _strip_html(pick(case.description, locale) or ""),
                    ],
                )
            ),
            image_url=case.cover_image.url if case.cover_image else None,
        )
    db.commit()


def reindex_scenario(db: Session, scenario: Scenario) -> None:
    if not scenario.is_published:
        remove_from_index(db, "scenario", scenario.id)
        return

    for locale in _locales():
        name = pick(scenario.name, locale) or ""
        benefits = " ".join(
            f"{b.get('title', '')} {b.get('description', '')}"
            for b in pick_list(scenario.benefits, locale)
        )
        _upsert(
            db,
            source_type=SourceType.SCENARIO,
            source_id=scenario.id,
            locale=locale,
            title=name,
            summary=pick(scenario.intro, locale),
            url_path=f"/scenarios/{scenario.slug}",
            content="\n".join(
                filter(
                    None,
                    [name, pick(scenario.intro, locale), _strip_html(pick(scenario.body, locale) or ""), benefits],
                )
            ),
            image_url=scenario.hero_image.url if scenario.hero_image else None,
        )
    db.commit()


def _strip_html(value: Any) -> str:
    """Rich text arrives as HTML; the index only wants the words."""
    if not isinstance(value, str):
        return ""
    out, in_tag = [], False
    for char in value:
        if char == "<":
            in_tag = True
        elif char == ">":
            in_tag = False
        elif not in_tag:
            out.append(char)
    return " ".join("".join(out).split())


def rebuild_all(db: Session) -> dict[str, int]:
    """Full reindex — run after seeding or a bulk import."""
    db.execute(delete(SearchDocument))
    db.commit()

    counts = {"products": 0, "posts": 0, "cases": 0, "scenarios": 0}
    for product in db.scalars(select(Product).where(Product.is_published.is_(True))):
        reindex_product(db, product)
        counts["products"] += 1
    for post in db.scalars(select(Post).where(Post.is_published.is_(True))):
        reindex_post(db, post)
        counts["posts"] += 1
    for case in db.scalars(select(CaseStudy).where(CaseStudy.is_published.is_(True))):
        reindex_case(db, case)
        counts["cases"] += 1
    for scenario in db.scalars(select(Scenario).where(Scenario.is_published.is_(True))):
        reindex_scenario(db, scenario)
        counts["scenarios"] += 1
    return counts
