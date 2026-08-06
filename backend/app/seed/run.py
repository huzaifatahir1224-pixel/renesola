"""Seed the database with catalogue content and images.

    uv run python -m app.seed.run              # seed everything
    uv run python -m app.seed.run --no-images  # text only, much faster

Idempotent: records are matched by slug, so re-running updates rather than duplicates.
Images are pulled from the reference site's CDN, uploaded to Supabase Storage, and
recorded in `media`.
"""

import argparse
import re
import sys
from datetime import datetime
from typing import Any

import httpx
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.database import SessionLocal
from app.models.catalog import Category, CellTechnology, Product, ProductType
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
from app.models.media import Media
from app.seed import content as C
from app.services import storage
from app.services.search_index import rebuild_all

BROWSER_HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
        "(KHTML, like Gecko) Chrome/120.0 Safari/537.36"
    ),
    # The image CDN enforces hotlink protection and answers HTTP 567 without this.
    "Referer": "https://www.renesola-energy.com/",
    "Accept": "image/avif,image/webp,image/apng,image/*,*/*;q=0.8",
}

IMAGE_SOURCE_PAGES = [
    "https://www.renesola-energy.com/Products_detail/49.html",
    "https://www.renesola-energy.com/Products_detail/35.html",
    "https://www.renesola-energy.com/Case.html",
    "https://www.renesola-energy.com/Scenario/1.html",
    "https://www.renesola-energy.com/Blog.html",
]

_UNIT_TO_KW = {"kW": 1.0, "MW": 1000.0, "GW": 1_000_000.0}
_IMG_RE = re.compile(r"""(?:src|data-src)=["']([^"']+\.(?:jpg|jpeg|png|webp))""", re.I)


def log(message: str) -> None:
    print(message, flush=True)


# ────────────────────────────── Images ──────────────────────────────


def collect_image_urls(limit: int = 60) -> list[str]:
    """Scrape distinct image URLs from the reference site."""
    found: list[str] = []
    seen: set[str] = set()

    with httpx.Client(headers=BROWSER_HEADERS, timeout=30, follow_redirects=True) as client:
        for page in IMAGE_SOURCE_PAGES:
            try:
                response = client.get(page)
                response.raise_for_status()
            except httpx.HTTPError as exc:
                log(f"  ! could not read {page}: {exc}")
                continue

            for url in _IMG_RE.findall(response.text):
                if url.startswith("//"):
                    url = f"https:{url}"
                elif url.startswith("/"):
                    url = f"https://www.renesola-energy.com{url}"
                if not url.startswith("http") or url in seen:
                    continue
                seen.add(url)
                found.append(url)
                if len(found) >= limit:
                    return found
    return found


def fetch_and_store(db: Session, url: str, prefix: str, alt: str) -> Media | None:
    """Download one image and put it in Supabase Storage + the media table."""
    existing = db.scalar(select(Media).where(Media.filename == url.rsplit("/", 1)[-1][:200]))
    if existing:
        return existing

    try:
        with httpx.Client(headers=BROWSER_HEADERS, timeout=45, follow_redirects=True) as client:
            response = client.get(url)
            response.raise_for_status()
            payload = response.content
            content_type = response.headers.get("content-type", "image/jpeg").split(";")[0]
    except httpx.HTTPError as exc:
        log(f"  ! image download failed {url[:70]}: {exc}")
        return None

    if len(payload) < 1024:  # a placeholder or an error page, not a real image
        return None

    filename = url.rsplit("/", 1)[-1].split("?")[0][:200] or "image.jpg"
    if "." not in filename:
        filename += ".jpg"

    try:
        stored = storage.upload(payload, filename, prefix=prefix, content_type=content_type)
    except storage.StorageError as exc:
        log(f"  ! upload failed {filename}: {exc}")
        return None

    width, height = storage.image_dimensions(payload)
    media = Media(
        filename=filename,
        storage_path=stored["storage_path"],
        url=stored["url"],
        mime_type=stored["mime_type"],
        size_bytes=stored["size_bytes"],
        width=width,
        height=height,
        alt={"en": alt},
    )
    db.add(media)
    db.flush()
    return media


# ────────────────────────────── Seeding ──────────────────────────────


def seed_categories(db: Session) -> dict[str, Category]:
    lookup: dict[str, Category] = {}

    for parent_data in C.CATEGORIES:
        parent = db.scalar(select(Category).where(Category.slug == parent_data["slug"]))
        if parent is None:
            parent = Category(slug=parent_data["slug"])
            db.add(parent)
        parent.name = parent_data["name"]
        parent.description = parent_data.get("description")
        parent.sort_order = parent_data["sort_order"]
        db.flush()
        lookup[parent.slug] = parent

        for child_data in parent_data["children"]:
            child = db.scalar(select(Category).where(Category.slug == child_data["slug"]))
            if child is None:
                child = Category(slug=child_data["slug"])
                db.add(child)
            child.name = child_data["name"]
            child.parent_id = parent.id
            child.sort_order = child_data["sort_order"]
            db.flush()
            lookup[child.slug] = child

    db.commit()
    log(f"  categories: {len(lookup)}")
    return lookup


def seed_products(
    db: Session, categories: dict[str, Category], images: list[Media]
) -> dict[str, Product]:
    lookup: dict[str, Product] = {}

    for index, data in enumerate(C.PRODUCTS):
        product = db.scalar(select(Product).where(Product.slug == data["slug"]))
        if product is None:
            product = Product(slug=data["slug"])
            db.add(product)

        product.model_number = data["model_number"]
        product.name = data["name"]
        product.short_description = data.get("short_description")
        product.category_id = categories[data["category"]].id
        product.product_type = ProductType(data["product_type"]) if data.get("product_type") else None
        product.cell_technology = (
            CellTechnology(data["cell_technology"]) if data.get("cell_technology") else None
        )
        product.power_min = data.get("power_min")
        product.power_max = data.get("power_max")
        product.max_efficiency = data.get("max_efficiency")
        product.power_tolerance = data.get("power_tolerance", "0~+3%")
        product.annual_degradation = data.get("annual_degradation", "0.40% linear")
        product.mechanical_load_positive = data.get("mechanical_load_positive", 5400)
        product.mechanical_load_negative = data.get("mechanical_load_negative", 2400)
        product.warranty_product_years = data.get("warranty_product_years", 15)
        product.warranty_power_years = data.get("warranty_power_years", 30)
        product.features = data.get("features")
        product.spec_groups = data.get("specs")
        product.featured = data.get("featured", False)
        product.sort_order = index
        product.is_published = True
        product.seo_description = {
            "en": (data.get("short_description") or {}).get("en", "")[:160] or None
        }

        if images:
            product.hero_image_id = images[index % len(images)].id
            product.gallery = [
                {"media_id": str(images[(index + offset) % len(images)].id)} for offset in (1, 2, 3)
            ]

        db.flush()
        lookup[product.slug] = product

    # Certifications apply to every module.
    certs = list(db.scalars(select(Certification)))
    for product in lookup.values():
        product.certifications = certs

    # Related products: same category, excluding self.
    for product in lookup.values():
        siblings = [
            other
            for other in lookup.values()
            if other.category_id == product.category_id and other.id != product.id
        ]
        pool = siblings or [o for o in lookup.values() if o.id != product.id]
        product.related_products = pool[:4]

    db.commit()
    log(f"  products: {len(lookup)}")
    return lookup


def seed_scenarios(db: Session, products: dict[str, Product], images: list[Media]) -> None:
    count = 0
    for parent_data in C.SCENARIOS:
        parent = db.scalar(select(Scenario).where(Scenario.slug == parent_data["slug"]))
        if parent is None:
            parent = Scenario(slug=parent_data["slug"])
            db.add(parent)
        parent.name = parent_data["name"]
        parent.intro = parent_data.get("intro")
        parent.sort_order = parent_data["sort_order"]
        parent.is_published = True
        if images:
            parent.hero_image_id = images[count % len(images)].id
        db.flush()
        count += 1

        for child_data in parent_data["children"]:
            child = db.scalar(select(Scenario).where(Scenario.slug == child_data["slug"]))
            if child is None:
                child = Scenario(slug=child_data["slug"])
                db.add(child)
            child.name = child_data["name"]
            child.intro = child_data.get("intro")
            child.body = child_data.get("body")
            child.benefits = child_data.get("benefits")
            child.parent_id = parent.id
            child.sort_order = child_data["sort_order"]
            child.is_published = True
            if images:
                child.hero_image_id = images[count % len(images)].id
            db.flush()

            # Recommend products that suit the scenario.
            if "household" in child.slug:
                picks = ["rs41-430-450n-e3", "rsl-05k-wm", "rs-hyb-10k-3p"]
            elif "industry" in child.slug:
                picks = ["rs6-575-600n-e3", "rsess261-125k", "rs-hyb-10k-3p"]
            else:
                picks = ["rs9-710-730hbg-e1", "rs7-635-655nbg-e2", "rs6-580-605nbg-e3"]
            child.recommended_products = [products[s] for s in picks if s in products]
            count += 1

    db.commit()
    log(f"  scenarios: {count}")


def seed_cases(db: Session, products: dict[str, Product], images: list[Media]) -> None:
    for index, data in enumerate(C.CASES):
        case = db.scalar(select(CaseStudy).where(CaseStudy.slug == data["slug"]))
        if case is None:
            case = CaseStudy(slug=data["slug"])
            db.add(case)
        case.project_name = data["project_name"]
        case.city = data["city"]
        case.country = data["country"]
        case.capacity_value = data["capacity_value"]
        case.capacity_unit = data["capacity_unit"]
        case.capacity_kw = data["capacity_value"] * _UNIT_TO_KW[data["capacity_unit"]]
        case.system_type = SystemType(data["system_type"])
        case.year = data["year"]
        case.is_published = True
        case.featured = index < 3
        if images:
            case.cover_image_id = images[(index + 5) % len(images)].id
        db.flush()

        picks = list(products.values())[index % max(1, len(products)) :][:2]
        case.products = picks

    db.commit()
    log(f"  case studies: {len(C.CASES)}")


def seed_posts(db: Session, images: list[Media]) -> None:
    for index, data in enumerate(C.POSTS):
        post = db.scalar(select(Post).where(Post.slug == data["slug"]))
        if post is None:
            post = Post(slug=data["slug"])
            db.add(post)
        post.title = data["title"]
        post.excerpt = data.get("excerpt")
        post.body = data.get("body")
        post.category = PostCategory(data["category"])
        post.tags = data.get("tags", [])
        post.published_at = datetime.fromisoformat(data["published_at"])
        post.is_published = True
        post.featured = data.get("featured", False)
        post.seo_description = {"en": (data.get("excerpt") or {}).get("en", "")[:160] or None}
        if images:
            post.cover_image_id = images[(index + 11) % len(images)].id
        db.flush()

    db.commit()
    log(f"  blog posts: {len(C.POSTS)}")


def seed_simple(db: Session, products: dict[str, Product], images: list[Media]) -> None:
    for data in C.CERTIFICATIONS:
        cert = db.scalar(select(Certification).where(Certification.name == data["name"]))
        if cert is None:
            cert = Certification(name=data["name"])
            db.add(cert)
        cert.issuing_body = data.get("issuing_body")
        cert.description = data.get("description")
        cert.sort_order = data["sort_order"]
        cert.show_on_honors_page = True
        if images:
            cert.image_id = images[data["sort_order"] % len(images)].id
    db.commit()
    log(f"  certifications: {len(C.CERTIFICATIONS)}")

    for data in C.OFFICES:
        email = data["email"]
        office = db.scalar(select(Office).where(Office.email == email))
        if office is None:
            office = Office(email=email)
            db.add(office)
        office.region_name = data["region_name"]
        office.address = data["address"]
        office.phone = data.get("phone")
        office.latitude = data.get("latitude")
        office.longitude = data.get("longitude")
        office.is_headquarters = data.get("is_headquarters", False)
        office.sort_order = data["sort_order"]
    db.commit()
    log(f"  offices: {len(C.OFFICES)}")

    for data in C.MILESTONES:
        milestone = db.scalar(select(Milestone).where(Milestone.year == data["year"]))
        if milestone is None:
            milestone = Milestone(year=data["year"])
            db.add(milestone)
        milestone.title = data["title"]
        milestone.description = data.get("description")
    db.commit()
    log(f"  milestones: {len(C.MILESTONES)}")

    for data in C.DOWNLOADS:
        title_en = data["title"]["en"]
        existing = db.scalar(
            select(Download).where(Download.title["en"].astext == title_en)  # type: ignore[index]
        )
        if existing is None:
            existing = Download(title=data["title"], category=DownloadCategory(data["category"]))
            db.add(existing)
        existing.title = data["title"]
        existing.category = DownloadCategory(data["category"])
        existing.region = data.get("region")
        existing.sort_order = data["sort_order"]
        existing.is_published = True
        if data.get("product") and data["product"] in products:
            existing.product_id = products[data["product"]].id
    db.commit()
    log(f"  downloads: {len(C.DOWNLOADS)}")


def main() -> int:
    parser = argparse.ArgumentParser(description="Seed the ReneSola database.")
    parser.add_argument("--no-images", action="store_true", help="Skip downloading images")
    parser.add_argument("--image-limit", type=int, default=40)
    args = parser.parse_args()

    with SessionLocal() as db:
        images: list[Media] = []

        if not args.no_images:
            log("Collecting image URLs from the reference site…")
            urls = collect_image_urls(limit=args.image_limit)
            log(f"  found {len(urls)} candidate images")

            log("Downloading and uploading to Supabase Storage…")
            for i, url in enumerate(urls):
                media = fetch_and_store(db, url, prefix="catalogue", alt=f"ReneSola image {i + 1}")
                if media:
                    images.append(media)
                if (i + 1) % 10 == 0:
                    db.commit()
                    log(f"  {len(images)} stored / {i + 1} attempted")
            db.commit()
            log(f"  media records: {len(images)}")
        else:
            images = list(db.scalars(select(Media).where(Media.mime_type.like("image/%"))))
            log(f"Reusing {len(images)} existing images")

        log("Seeding content…")
        # Certifications must exist before products so the relation can be attached.
        seed_simple(db, {}, images)
        categories = seed_categories(db)
        products = seed_products(db, categories, images)
        seed_scenarios(db, products, images)
        seed_cases(db, products, images)
        seed_posts(db, images)
        seed_simple(db, products, images)  # re-run to link downloads to products

        log("Rebuilding search index…")
        counts = rebuild_all(db)
        log(f"  indexed: {counts}")

    log("Done.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
