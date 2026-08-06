"""File storage.

Primary target is Supabase Storage. That needs the *secret* API key (`sb_secret_...`) —
the publishable key cannot write. Until it is set, uploads fall back to the local
`uploads/` directory so development is never blocked; the returned URL shape is the same
either way, so switching later changes nothing downstream.
"""

import logging
import mimetypes
import uuid
from datetime import UTC, datetime
from pathlib import Path

import httpx

from app.core.config import settings

logger = logging.getLogger(__name__)

LOCAL_UPLOAD_DIR = Path("uploads")


class StorageError(RuntimeError):
    pass


def storage_configured() -> bool:
    return bool(settings.SUPABASE_URL and settings.SUPABASE_SERVICE_ROLE_KEY)


def _auth_headers() -> dict[str, str]:
    """Supabase's newer `sb_secret_…` keys are not JWTs — Storage rejects them on
    Authorization alone ("Invalid Compact JWS") and requires the `apikey` header.
    Sending both keeps this working with legacy service-role JWTs too."""
    key = settings.SUPABASE_SERVICE_ROLE_KEY
    return {"apikey": key, "Authorization": f"Bearer {key}"}


def _object_path(filename: str, prefix: str = "") -> str:
    """Date-sharded, collision-proof key: 2026/08/ab12cd34-datasheet.pdf"""
    safe = Path(filename).name.replace(" ", "-")
    stamp = datetime.now(UTC).strftime("%Y/%m")
    parts = [p for p in (prefix.strip("/"), stamp, f"{uuid.uuid4().hex[:8]}-{safe}") if p]
    return "/".join(parts)


def upload(content: bytes, filename: str, *, prefix: str = "", content_type: str | None = None) -> dict:
    """Returns {storage_path, url, mime_type, size_bytes}."""
    mime = content_type or mimetypes.guess_type(filename)[0] or "application/octet-stream"
    path = _object_path(filename, prefix)

    if not storage_configured():
        return _upload_local(content, path, mime)

    bucket = settings.SUPABASE_STORAGE_BUCKET
    endpoint = f"{settings.SUPABASE_URL}/storage/v1/object/{bucket}/{path}"
    try:
        response = httpx.post(
            endpoint,
            content=content,
            headers={**_auth_headers(), "Content-Type": mime, "x-upsert": "true"},
            timeout=60,
        )
        response.raise_for_status()
    except httpx.HTTPError as exc:
        raise StorageError(f"Supabase upload failed: {exc}") from exc

    return {
        "storage_path": path,
        "url": f"{settings.SUPABASE_URL}/storage/v1/object/public/{bucket}/{path}",
        "mime_type": mime,
        "size_bytes": len(content),
    }


def _upload_local(content: bytes, path: str, mime: str) -> dict:
    destination = LOCAL_UPLOAD_DIR / path
    destination.parent.mkdir(parents=True, exist_ok=True)
    destination.write_bytes(content)
    logger.info("Supabase secret key not set — stored %s locally", path)
    return {
        "storage_path": path,
        "url": f"/uploads/{path}",
        "mime_type": mime,
        "size_bytes": len(content),
    }


def delete(storage_path: str) -> None:
    if not storage_configured():
        target = LOCAL_UPLOAD_DIR / storage_path
        target.unlink(missing_ok=True)
        return

    bucket = settings.SUPABASE_STORAGE_BUCKET
    try:
        httpx.request(
            "DELETE",
            f"{settings.SUPABASE_URL}/storage/v1/object/{bucket}/{storage_path}",
            headers=_auth_headers(),
            timeout=30,
        ).raise_for_status()
    except httpx.HTTPError:
        # A missing remote object should not block deleting the database row.
        logger.warning("Could not delete %s from Supabase Storage", storage_path)


def image_dimensions(content: bytes) -> tuple[int | None, int | None]:
    try:
        import io

        from PIL import Image

        with Image.open(io.BytesIO(content)) as img:
            return img.width, img.height
    except Exception:
        return None, None
