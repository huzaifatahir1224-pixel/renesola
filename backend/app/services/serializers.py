"""Turn ORM rows into locale-resolved dicts for the public API.

Storage keeps every language in one JSONB column; the public API hands the frontend
exactly one language. All that flattening happens here so routers stay thin.
"""

from typing import Any

from app.models.catalog import Category, Product
from app.models.content import CaseStudy, Certification, Download, Milestone, Office, Post, Scenario
from app.models.media import Media
from app.schemas.common import pick, pick_list


def media_ref(media: Media | None, locale: str = "en") -> dict[str, Any] | None:
    if media is None:
        return None
    return {
        "id": str(media.id),
        "url": media.url,
        "alt": pick(media.alt, locale),
        "width": media.width,
        "height": media.height,
        "sizes": media.sizes or {},
    }


def _gallery(items: list[dict[str, Any]] | None, resolver, locale: str) -> list[dict[str, Any]]:
    """Gallery is stored as [{"media_id": ...}]; resolve each id to a full media ref."""
    if not items:
        return []
    out = []
    for entry in items:
        media = resolver(entry.get("media_id"))
        ref = media_ref(media, locale)
        if ref:
            out.append(ref)
    return out


def category_brief(category: Category | None, locale: str) -> dict[str, Any] | None:
    if category is None:
        return None
    return {"id": str(category.id), "slug": category.slug, "name": pick(category.name, locale)}


def category_out(category: Category, locale: str, with_children: bool = False) -> dict[str, Any]:
    data: dict[str, Any] = {
        "id": str(category.id),
        "slug": category.slug,
        "name": pick(category.name, locale),
        "description": pick(category.description, locale),
        "parent_id": str(category.parent_id) if category.parent_id else None,
        "banner_image": media_ref(category.banner_image, locale),
        "sort_order": category.sort_order,
    }
    if with_children:
        data["children"] = [
            category_out(child, locale, with_children=True)
            for child in sorted(category.children, key=lambda c: c.sort_order)
        ]
    return data


def product_card(product: Product, locale: str) -> dict[str, Any]:
    return {
        "id": str(product.id),
        "slug": product.slug,
        "name": pick(product.name, locale),
        "model_number": product.model_number,
        "short_description": pick(product.short_description, locale),
        "product_type": product.product_type.value if product.product_type else None,
        "cell_technology": product.cell_technology.value if product.cell_technology else None,
        "power_min": product.power_min,
        "power_max": product.power_max,
        "max_efficiency": float(product.max_efficiency) if product.max_efficiency else None,
        "hero_image": media_ref(product.hero_image, locale),
        "category": category_brief(product.category, locale),
    }


def product_detail(product: Product, locale: str, media_lookup=lambda _: None) -> dict[str, Any]:
    data = product_card(product, locale)
    data.update(
        {
            "power_tolerance": product.power_tolerance,
            "annual_degradation": product.annual_degradation,
            "mechanical_load_positive": product.mechanical_load_positive,
            "mechanical_load_negative": product.mechanical_load_negative,
            "warranty_product_years": product.warranty_product_years,
            "warranty_power_years": product.warranty_power_years,
            "gallery": _gallery(product.gallery, media_lookup, locale),
            "features": pick_list(product.features, locale),
            "spec_groups": pick_list(product.spec_groups, locale),
            "datasheet": media_ref(product.datasheet, locale),
            "installation_manual": media_ref(product.installation_manual, locale),
            "warranty_document": media_ref(product.warranty_document, locale),
            "certifications": [certification_out(c, locale) for c in product.certifications],
            "related_products": [product_card(p, locale) for p in product.related_products],
            "scenarios": [
                {"id": str(s.id), "slug": s.slug, "name": pick(s.name, locale)}
                for s in product.scenarios
            ],
            "seo_title": pick(product.seo_title, locale),
            "seo_description": pick(product.seo_description, locale),
        }
    )
    return data


def certification_out(cert: Certification, locale: str) -> dict[str, Any]:
    return {
        "id": str(cert.id),
        "name": cert.name,
        "issuing_body": cert.issuing_body,
        "certificate_number": cert.certificate_number,
        "issued_year": cert.issued_year,
        "description": pick(cert.description, locale),
        "image": media_ref(cert.image, locale),
    }


def scenario_out(scenario: Scenario, locale: str, detail: bool = False) -> dict[str, Any]:
    data: dict[str, Any] = {
        "id": str(scenario.id),
        "slug": scenario.slug,
        "name": pick(scenario.name, locale),
        "intro": pick(scenario.intro, locale),
        "hero_image": media_ref(scenario.hero_image, locale),
        "parent_id": str(scenario.parent_id) if scenario.parent_id else None,
        "sort_order": scenario.sort_order,
    }
    if detail:
        data.update(
            {
                "body": pick(scenario.body, locale),
                "benefits": pick_list(scenario.benefits, locale),
                "system_diagram": media_ref(scenario.system_diagram, locale),
                "recommended_products": [
                    product_card(p, locale) for p in scenario.recommended_products
                ],
                "related_cases": [case_out(c, locale) for c in scenario.related_cases],
                "seo_title": pick(scenario.seo_title, locale),
                "seo_description": pick(scenario.seo_description, locale),
            }
        )
    return data


def case_out(case: CaseStudy, locale: str, detail: bool = False) -> dict[str, Any]:
    data: dict[str, Any] = {
        "id": str(case.id),
        "slug": case.slug,
        "project_name": pick(case.project_name, locale),
        "city": pick(case.city, locale),
        "country": pick(case.country, locale),
        "capacity_label": case.capacity_label,
        "capacity_kw": case.capacity_kw,
        "system_type": case.system_type.value if case.system_type else None,
        "year": case.year,
        "cover_image": media_ref(case.cover_image, locale),
    }
    if detail:
        data.update(
            {
                "description": pick(case.description, locale),
                "products": [product_card(p, locale) for p in case.products],
                "seo_title": pick(case.seo_title, locale),
                "seo_description": pick(case.seo_description, locale),
            }
        )
    return data


def post_out(post: Post, locale: str, detail: bool = False) -> dict[str, Any]:
    data: dict[str, Any] = {
        "id": str(post.id),
        "slug": post.slug,
        "title": pick(post.title, locale),
        "excerpt": pick(post.excerpt, locale),
        "category": post.category.value,
        "tags": post.tags or [],
        "published_at": post.published_at.isoformat() if post.published_at else None,
        "cover_image": media_ref(post.cover_image, locale),
    }
    if detail:
        data.update(
            {
                "body": pick(post.body, locale),
                "view_count": post.view_count,
                "seo_title": pick(post.seo_title, locale),
                "seo_description": pick(post.seo_description, locale),
            }
        )
    return data


def download_out(download: Download, locale: str) -> dict[str, Any]:
    return {
        "id": str(download.id),
        "title": pick(download.title, locale),
        "category": download.category.value,
        "region": download.region,
        "file": media_ref(download.file, locale),
        "thumbnail": media_ref(download.thumbnail, locale),
        "download_count": download.download_count,
    }


def office_out(office: Office, locale: str) -> dict[str, Any]:
    return {
        "id": str(office.id),
        "region_name": pick(office.region_name, locale),
        "address": pick(office.address, locale),
        "phone": office.phone,
        "email": office.email,
        "latitude": office.latitude,
        "longitude": office.longitude,
        "is_headquarters": office.is_headquarters,
    }


def milestone_out(milestone: Milestone, locale: str) -> dict[str, Any]:
    return {
        "id": str(milestone.id),
        "year": milestone.year,
        "title": pick(milestone.title, locale),
        "description": pick(milestone.description, locale),
        "image": media_ref(milestone.image, locale),
    }
