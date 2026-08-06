"""Media library — image and PDF uploads."""

from typing import Annotated, Any
from uuid import UUID

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status
from sqlalchemy import func, select

from app.api.deps import DbSession, LocaleDep, PaginationDep, require_admin, require_editor
from app.core.config import settings
from app.models.media import Media
from app.schemas.common import MessageResponse
from app.services import storage
from app.services.serializers import media_ref

router = APIRouter(prefix="/media", tags=["media"])

MAX_IMAGE_BYTES = 10 * 1024 * 1024  # 10 MB
MAX_PDF_BYTES = 25 * 1024 * 1024  # 25 MB
ALLOWED = {
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/gif",
    "image/svg+xml",
    "application/pdf",
}


@router.post("", status_code=status.HTTP_201_CREATED, dependencies=[Depends(require_editor)])
async def upload_media(
    db: DbSession,
    locale: LocaleDep,
    file: Annotated[UploadFile, File()],
    prefix: Annotated[str, Form()] = "",
    alt: Annotated[str | None, Form()] = None,
) -> dict[str, Any]:
    content_type = file.content_type or ""
    if content_type not in ALLOWED:
        raise HTTPException(
            status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            f"Unsupported type {content_type!r}. Allowed: {', '.join(sorted(ALLOWED))}",
        )

    content = await file.read()
    limit = MAX_PDF_BYTES if content_type == "application/pdf" else MAX_IMAGE_BYTES
    if len(content) > limit:
        raise HTTPException(
            status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            f"File is {len(content) // 1024 // 1024} MB; the limit is {limit // 1024 // 1024} MB",
        )

    try:
        stored = storage.upload(
            content, file.filename or "upload", prefix=prefix, content_type=content_type
        )
    except storage.StorageError as exc:
        raise HTTPException(status.HTTP_502_BAD_GATEWAY, str(exc)) from exc

    width, height = (None, None)
    if content_type.startswith("image/") and content_type != "image/svg+xml":
        width, height = storage.image_dimensions(content)

    media = Media(
        filename=file.filename or "upload",
        storage_path=stored["storage_path"],
        url=stored["url"],
        mime_type=stored["mime_type"],
        size_bytes=stored["size_bytes"],
        width=width,
        height=height,
        alt={locale: alt} if alt else {},
    )
    db.add(media)
    db.commit()
    db.refresh(media)

    result = media_ref(media, locale) or {}
    result["storage_backend"] = "supabase" if storage.storage_configured() else "local"
    return result


@router.get("", dependencies=[Depends(require_editor)])
def list_media(
    db: DbSession, locale: LocaleDep, page: PaginationDep, images_only: bool = False
) -> dict[str, Any]:
    stmt = select(Media)
    if images_only:
        stmt = stmt.where(Media.mime_type.like("image/%"))
    total = db.scalar(select(func.count()).select_from(stmt.subquery())) or 0
    rows = db.scalars(
        stmt.order_by(Media.created_at.desc()).offset(page.offset).limit(page.limit)
    ).all()
    return {
        "items": [{**(media_ref(m, locale) or {}), "filename": m.filename, "mime_type": m.mime_type} for m in rows],
        "total": total,
        "page": page.page,
        "per_page": page.per_page,
        "pages": max(1, -(-total // page.per_page)),
    }


@router.delete("/{media_id}", dependencies=[Depends(require_admin)])
def delete_media(db: DbSession, media_id: UUID) -> MessageResponse:
    media = db.get(Media, media_id)
    if media is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Media not found")
    storage.delete(media.storage_path)
    db.delete(media)
    db.commit()
    return MessageResponse(message="Media deleted")


@router.get("/storage-status", dependencies=[Depends(require_editor)])
def storage_status() -> dict[str, Any]:
    """Tells the admin UI whether uploads go to Supabase or the local fallback."""
    configured = storage.storage_configured()
    return {
        "backend": "supabase" if configured else "local",
        "configured": configured,
        "bucket": settings.SUPABASE_STORAGE_BUCKET if configured else None,
        "hint": None
        if configured
        else "Set SUPABASE_SERVICE_ROLE_KEY (sb_secret_...) to upload to Supabase Storage.",
    }
