"""Scenarios, case studies, blog posts, downloads, certifications, offices, milestones."""

from typing import Annotated, Any
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel
from slugify import slugify
from sqlalchemy import Text, cast, func, select
from sqlalchemy.orm import selectinload

from app.api.deps import DbSession, LocaleDep, PaginationDep, require_admin, require_editor
from app.models.content import (
    CaseStudy,
    Certification,
    Download,
    DownloadCategory,
    Milestone,
    Office,
    Post,
    PostCategory,
    Scenario,
    SystemType,
)
from app.schemas.common import MessageResponse
from app.services.search_index import reindex_case, reindex_post, reindex_scenario, remove_from_index
from app.services.serializers import (
    case_out,
    certification_out,
    download_out,
    milestone_out,
    office_out,
    post_out,
    scenario_out,
)

router = APIRouter(tags=["content"])

_UNIT_TO_KW = {"kW": 1.0, "MW": 1000.0, "GW": 1_000_000.0}


def _paginate(db: DbSession, stmt, page: PaginationDep, serialize) -> dict[str, Any]:
    total = db.scalar(select(func.count()).select_from(stmt.subquery())) or 0
    rows = db.scalars(stmt.offset(page.offset).limit(page.limit)).all()
    return {
        "items": [serialize(r) for r in rows],
        "total": total,
        "page": page.page,
        "per_page": page.per_page,
        "pages": max(1, -(-total // page.per_page)),
    }


def _slug_for(db: DbSession, model, base: str, exclude_id: UUID | None = None) -> str:
    candidate = slugify(base) or "item"
    n = 1
    while True:
        stmt = select(model.id).where(model.slug == candidate)
        if exclude_id:
            stmt = stmt.where(model.id != exclude_id)
        if db.scalar(stmt) is None:
            return candidate
        n += 1
        candidate = f"{slugify(base)}-{n}"


# ══════════════════════════════ Scenarios ══════════════════════════════


class ScenarioWrite(BaseModel):
    name: dict[str, str] | None = None
    slug: str | None = None
    intro: dict[str, str] | None = None
    body: dict[str, str] | None = None
    benefits: dict[str, list[dict[str, Any]]] | None = None
    parent_id: UUID | None = None
    hero_image_id: UUID | None = None
    system_diagram_id: UUID | None = None
    gallery: list[dict[str, Any]] | None = None
    recommended_product_ids: list[UUID] | None = None
    seo_title: dict[str, str] | None = None
    seo_description: dict[str, str] | None = None
    sort_order: int = 0
    is_published: bool = False


@router.get("/scenarios")
def list_scenarios(db: DbSession, locale: LocaleDep) -> list[dict[str, Any]]:
    rows = db.scalars(
        select(Scenario)
        .where(Scenario.is_published.is_(True), Scenario.parent_id.is_(None))
        .options(selectinload(Scenario.children))
        .order_by(Scenario.sort_order)
    ).all()
    out = []
    for root in rows:
        data = scenario_out(root, locale)
        data["children"] = [
            scenario_out(c, locale) for c in sorted(root.children, key=lambda s: s.sort_order)
        ]
        out.append(data)
    return out


@router.get("/scenarios/{slug}")
def get_scenario(db: DbSession, locale: LocaleDep, slug: str) -> dict[str, Any]:
    scenario = db.scalar(
        select(Scenario)
        .where(Scenario.slug == slug, Scenario.is_published.is_(True))
        .options(
            selectinload(Scenario.recommended_products),
            selectinload(Scenario.related_cases),
            selectinload(Scenario.children),
        )
    )
    if scenario is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Scenario not found")
    return scenario_out(scenario, locale, detail=True)


@router.post("/scenarios", status_code=status.HTTP_201_CREATED, dependencies=[Depends(require_editor)])
def create_scenario(db: DbSession, locale: LocaleDep, payload: ScenarioWrite) -> dict[str, Any]:
    data = payload.model_dump(exclude={"slug", "recommended_product_ids"})
    scenario = Scenario(**data)
    scenario.slug = _slug_for(
        db, Scenario, payload.slug or next(iter((payload.name or {}).values()), "scenario")
    )
    db.add(scenario)
    db.commit()
    db.refresh(scenario)
    reindex_scenario(db, scenario)
    return scenario_out(scenario, locale, detail=True)


@router.patch("/scenarios/{scenario_id}", dependencies=[Depends(require_editor)])
def update_scenario(
    db: DbSession, locale: LocaleDep, scenario_id: UUID, payload: ScenarioWrite
) -> dict[str, Any]:
    scenario = db.get(Scenario, scenario_id)
    if scenario is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Scenario not found")
    data = payload.model_dump(exclude_unset=True, exclude={"recommended_product_ids"})
    if data.get("slug"):
        data["slug"] = _slug_for(db, Scenario, data["slug"], exclude_id=scenario_id)
    for key, value in data.items():
        setattr(scenario, key, value)
    db.commit()
    db.refresh(scenario)
    reindex_scenario(db, scenario)
    return scenario_out(scenario, locale, detail=True)


@router.delete("/scenarios/{scenario_id}", dependencies=[Depends(require_admin)])
def delete_scenario(db: DbSession, scenario_id: UUID) -> MessageResponse:
    scenario = db.get(Scenario, scenario_id)
    if scenario is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Scenario not found")
    remove_from_index(db, "scenario", scenario.id)
    db.delete(scenario)
    db.commit()
    return MessageResponse(message="Scenario deleted")


# ══════════════════════════════ Case studies ══════════════════════════════


class CaseWrite(BaseModel):
    project_name: dict[str, str] | None = None
    slug: str | None = None
    city: dict[str, str] | None = None
    country: dict[str, str] | None = None
    description: dict[str, str] | None = None
    capacity_value: float | None = None
    capacity_unit: str | None = "MW"
    system_type: SystemType | None = None
    year: int | None = None
    cover_image_id: UUID | None = None
    gallery: list[dict[str, Any]] | None = None
    seo_title: dict[str, str] | None = None
    seo_description: dict[str, str] | None = None
    featured: bool = False
    is_published: bool = False


@router.get("/cases")
def list_cases(
    db: DbSession,
    locale: LocaleDep,
    page: PaginationDep,
    system_type: SystemType | None = None,
    country: Annotated[str | None, Query()] = None,
) -> dict[str, Any]:
    stmt = select(CaseStudy).where(CaseStudy.is_published.is_(True))
    if system_type:
        stmt = stmt.where(CaseStudy.system_type == system_type)
    if country:
        # `country` is JSONB across locales — cast to text so one match covers every language.
        stmt = stmt.where(func.lower(cast(CaseStudy.country, Text)).contains(country.lower()))
    stmt = stmt.order_by(CaseStudy.capacity_kw.desc().nullslast(), CaseStudy.created_at.desc())
    return _paginate(db, stmt, page, lambda c: case_out(c, locale))


@router.get("/cases/{slug}")
def get_case(db: DbSession, locale: LocaleDep, slug: str) -> dict[str, Any]:
    case = db.scalar(
        select(CaseStudy)
        .where(CaseStudy.slug == slug, CaseStudy.is_published.is_(True))
        .options(selectinload(CaseStudy.products))
    )
    if case is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Case study not found")
    return case_out(case, locale, detail=True)


def _set_capacity(case: CaseStudy) -> None:
    if case.capacity_value is not None:
        case.capacity_kw = case.capacity_value * _UNIT_TO_KW.get(case.capacity_unit or "MW", 1000.0)


@router.post("/cases", status_code=status.HTTP_201_CREATED, dependencies=[Depends(require_editor)])
def create_case(db: DbSession, locale: LocaleDep, payload: CaseWrite) -> dict[str, Any]:
    case = CaseStudy(**payload.model_dump(exclude={"slug"}))
    case.slug = _slug_for(
        db, CaseStudy, payload.slug or next(iter((payload.project_name or {}).values()), "case")
    )
    _set_capacity(case)
    db.add(case)
    db.commit()
    db.refresh(case)
    reindex_case(db, case)
    return case_out(case, locale, detail=True)


@router.patch("/cases/{case_id}", dependencies=[Depends(require_editor)])
def update_case(db: DbSession, locale: LocaleDep, case_id: UUID, payload: CaseWrite) -> dict[str, Any]:
    case = db.get(CaseStudy, case_id)
    if case is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Case study not found")
    data = payload.model_dump(exclude_unset=True)
    if data.get("slug"):
        data["slug"] = _slug_for(db, CaseStudy, data["slug"], exclude_id=case_id)
    for key, value in data.items():
        setattr(case, key, value)
    _set_capacity(case)
    db.commit()
    db.refresh(case)
    reindex_case(db, case)
    return case_out(case, locale, detail=True)


@router.delete("/cases/{case_id}", dependencies=[Depends(require_admin)])
def delete_case(db: DbSession, case_id: UUID) -> MessageResponse:
    case = db.get(CaseStudy, case_id)
    if case is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Case study not found")
    remove_from_index(db, "case-study", case.id)
    db.delete(case)
    db.commit()
    return MessageResponse(message="Case study deleted")


# ══════════════════════════════ Blog posts ══════════════════════════════


class PostWrite(BaseModel):
    title: dict[str, str] | None = None
    slug: str | None = None
    excerpt: dict[str, str] | None = None
    body: dict[str, str] | None = None
    category: PostCategory | None = None
    tags: list[str] | None = None
    cover_image_id: UUID | None = None
    author_id: UUID | None = None
    published_at: str | None = None
    seo_title: dict[str, str] | None = None
    seo_description: dict[str, str] | None = None
    featured: bool = False
    is_published: bool = False


@router.get("/posts")
def list_posts(
    db: DbSession,
    locale: LocaleDep,
    page: PaginationDep,
    category: PostCategory | None = None,
    tag: Annotated[str | None, Query()] = None,
) -> dict[str, Any]:
    stmt = select(Post).where(Post.is_published.is_(True))
    if category:
        stmt = stmt.where(Post.category == category)
    if tag:
        stmt = stmt.where(Post.tags.any(tag))
    stmt = stmt.order_by(Post.published_at.desc().nullslast(), Post.created_at.desc())
    return _paginate(db, stmt, page, lambda p: post_out(p, locale))


@router.get("/posts/{slug}")
def get_post(db: DbSession, locale: LocaleDep, slug: str) -> dict[str, Any]:
    post = db.scalar(select(Post).where(Post.slug == slug, Post.is_published.is_(True)))
    if post is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Post not found")
    post.view_count += 1
    db.commit()
    db.refresh(post)
    return post_out(post, locale, detail=True)


@router.post("/posts", status_code=status.HTTP_201_CREATED, dependencies=[Depends(require_editor)])
def create_post(db: DbSession, locale: LocaleDep, payload: PostWrite) -> dict[str, Any]:
    if payload.category is None:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "category is required")
    post = Post(**payload.model_dump(exclude={"slug"}))
    post.slug = _slug_for(db, Post, payload.slug or next(iter((payload.title or {}).values()), "post"))
    db.add(post)
    db.commit()
    db.refresh(post)
    reindex_post(db, post)
    return post_out(post, locale, detail=True)


@router.patch("/posts/{post_id}", dependencies=[Depends(require_editor)])
def update_post(db: DbSession, locale: LocaleDep, post_id: UUID, payload: PostWrite) -> dict[str, Any]:
    post = db.get(Post, post_id)
    if post is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Post not found")
    data = payload.model_dump(exclude_unset=True)
    if data.get("slug"):
        data["slug"] = _slug_for(db, Post, data["slug"], exclude_id=post_id)
    for key, value in data.items():
        setattr(post, key, value)
    db.commit()
    db.refresh(post)
    reindex_post(db, post)
    return post_out(post, locale, detail=True)


@router.delete("/posts/{post_id}", dependencies=[Depends(require_admin)])
def delete_post(db: DbSession, post_id: UUID) -> MessageResponse:
    post = db.get(Post, post_id)
    if post is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Post not found")
    remove_from_index(db, "post", post.id)
    db.delete(post)
    db.commit()
    return MessageResponse(message="Post deleted")


# ══════════════════════════════ Downloads ══════════════════════════════


class DownloadWrite(BaseModel):
    title: dict[str, str] | None = None
    category: DownloadCategory | None = None
    region: str | None = None
    file_id: UUID | None = None
    thumbnail_id: UUID | None = None
    product_id: UUID | None = None
    sort_order: int = 0
    is_published: bool = True


@router.get("/downloads")
def list_downloads(
    db: DbSession,
    locale: LocaleDep,
    page: PaginationDep,
    category: DownloadCategory | None = None,
    region: Annotated[str | None, Query()] = None,
) -> dict[str, Any]:
    stmt = select(Download).where(Download.is_published.is_(True))
    if category:
        stmt = stmt.where(Download.category == category)
    if region:
        stmt = stmt.where(Download.region == region)
    stmt = stmt.order_by(Download.sort_order, Download.created_at.desc())
    return _paginate(db, stmt, page, lambda d: download_out(d, locale))


@router.post("/downloads/{download_id}/count")
def increment_download(db: DbSession, download_id: UUID) -> MessageResponse:
    """Called by the frontend when a file is actually downloaded."""
    item = db.get(Download, download_id)
    if item is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Download not found")
    item.download_count += 1
    db.commit()
    return MessageResponse(message="Counted")


@router.post("/downloads", status_code=status.HTTP_201_CREATED, dependencies=[Depends(require_editor)])
def create_download(db: DbSession, locale: LocaleDep, payload: DownloadWrite) -> dict[str, Any]:
    if payload.category is None:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "category is required")
    item = Download(**payload.model_dump())
    db.add(item)
    db.commit()
    db.refresh(item)
    return download_out(item, locale)


@router.patch("/downloads/{download_id}", dependencies=[Depends(require_editor)])
def update_download(
    db: DbSession, locale: LocaleDep, download_id: UUID, payload: DownloadWrite
) -> dict[str, Any]:
    item = db.get(Download, download_id)
    if item is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Download not found")
    for key, value in payload.model_dump(exclude_unset=True).items():
        setattr(item, key, value)
    db.commit()
    db.refresh(item)
    return download_out(item, locale)


@router.delete("/downloads/{download_id}", dependencies=[Depends(require_admin)])
def delete_download(db: DbSession, download_id: UUID) -> MessageResponse:
    item = db.get(Download, download_id)
    if item is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Download not found")
    db.delete(item)
    db.commit()
    return MessageResponse(message="Download deleted")


# ══════════════════════ Certifications / offices / milestones ══════════════════════


class CertificationWrite(BaseModel):
    name: str | None = None
    issuing_body: str | None = None
    certificate_number: str | None = None
    issued_year: int | None = None
    description: dict[str, str] | None = None
    image_id: UUID | None = None
    show_on_honors_page: bool = True
    sort_order: int = 0


@router.get("/certifications")
def list_certifications(db: DbSession, locale: LocaleDep, honors_only: bool = False) -> list[dict[str, Any]]:
    stmt = select(Certification)
    if honors_only:
        stmt = stmt.where(Certification.show_on_honors_page.is_(True))
    rows = db.scalars(stmt.order_by(Certification.sort_order)).all()
    return [certification_out(c, locale) for c in rows]


@router.post("/certifications", status_code=status.HTTP_201_CREATED, dependencies=[Depends(require_editor)])
def create_certification(db: DbSession, locale: LocaleDep, payload: CertificationWrite) -> dict[str, Any]:
    if not payload.name:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "name is required")
    cert = Certification(**payload.model_dump())
    db.add(cert)
    db.commit()
    db.refresh(cert)
    return certification_out(cert, locale)


@router.patch("/certifications/{cert_id}", dependencies=[Depends(require_editor)])
def update_certification(
    db: DbSession, locale: LocaleDep, cert_id: UUID, payload: CertificationWrite
) -> dict[str, Any]:
    cert = db.get(Certification, cert_id)
    if cert is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Certification not found")
    for key, value in payload.model_dump(exclude_unset=True).items():
        setattr(cert, key, value)
    db.commit()
    db.refresh(cert)
    return certification_out(cert, locale)


@router.delete("/certifications/{cert_id}", dependencies=[Depends(require_admin)])
def delete_certification(db: DbSession, cert_id: UUID) -> MessageResponse:
    cert = db.get(Certification, cert_id)
    if cert is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Certification not found")
    db.delete(cert)
    db.commit()
    return MessageResponse(message="Certification deleted")


class OfficeWrite(BaseModel):
    region_name: dict[str, str] | None = None
    address: dict[str, str] | None = None
    phone: str | None = None
    email: str | None = None
    latitude: float | None = None
    longitude: float | None = None
    is_headquarters: bool = False
    sort_order: int = 0


@router.get("/offices")
def list_offices(db: DbSession, locale: LocaleDep) -> list[dict[str, Any]]:
    rows = db.scalars(
        select(Office).order_by(Office.is_headquarters.desc(), Office.sort_order)
    ).all()
    return [office_out(o, locale) for o in rows]


@router.post("/offices", status_code=status.HTTP_201_CREATED, dependencies=[Depends(require_editor)])
def create_office(db: DbSession, locale: LocaleDep, payload: OfficeWrite) -> dict[str, Any]:
    office = Office(**payload.model_dump())
    db.add(office)
    db.commit()
    db.refresh(office)
    return office_out(office, locale)


@router.patch("/offices/{office_id}", dependencies=[Depends(require_editor)])
def update_office(db: DbSession, locale: LocaleDep, office_id: UUID, payload: OfficeWrite) -> dict[str, Any]:
    office = db.get(Office, office_id)
    if office is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Office not found")
    for key, value in payload.model_dump(exclude_unset=True).items():
        setattr(office, key, value)
    db.commit()
    db.refresh(office)
    return office_out(office, locale)


@router.delete("/offices/{office_id}", dependencies=[Depends(require_admin)])
def delete_office(db: DbSession, office_id: UUID) -> MessageResponse:
    office = db.get(Office, office_id)
    if office is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Office not found")
    db.delete(office)
    db.commit()
    return MessageResponse(message="Office deleted")


class MilestoneWrite(BaseModel):
    year: int | None = None
    title: dict[str, str] | None = None
    description: dict[str, str] | None = None
    image_id: UUID | None = None
    sort_order: int = 0


@router.get("/milestones")
def list_milestones(db: DbSession, locale: LocaleDep) -> list[dict[str, Any]]:
    rows = db.scalars(select(Milestone).order_by(Milestone.year.desc())).all()
    return [milestone_out(m, locale) for m in rows]


@router.post("/milestones", status_code=status.HTTP_201_CREATED, dependencies=[Depends(require_editor)])
def create_milestone(db: DbSession, locale: LocaleDep, payload: MilestoneWrite) -> dict[str, Any]:
    if payload.year is None:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "year is required")
    milestone = Milestone(**payload.model_dump())
    db.add(milestone)
    db.commit()
    db.refresh(milestone)
    return milestone_out(milestone, locale)


@router.patch("/milestones/{milestone_id}", dependencies=[Depends(require_editor)])
def update_milestone(
    db: DbSession, locale: LocaleDep, milestone_id: UUID, payload: MilestoneWrite
) -> dict[str, Any]:
    milestone = db.get(Milestone, milestone_id)
    if milestone is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Milestone not found")
    for key, value in payload.model_dump(exclude_unset=True).items():
        setattr(milestone, key, value)
    db.commit()
    db.refresh(milestone)
    return milestone_out(milestone, locale)


@router.delete("/milestones/{milestone_id}", dependencies=[Depends(require_admin)])
def delete_milestone(db: DbSession, milestone_id: UUID) -> MessageResponse:
    milestone = db.get(Milestone, milestone_id)
    if milestone is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Milestone not found")
    db.delete(milestone)
    db.commit()
    return MessageResponse(message="Milestone deleted")
