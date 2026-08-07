"""Vercel serverless entrypoint.

Vercel's Python runtime looks for a module-level ASGI callable named `app` inside
`api/`. Everything else lives in the `app` package one level up.

If that import fails the platform only surfaces FUNCTION_INVOCATION_FAILED, which says
nothing useful. So a failed import is caught here and served as a diagnostic response
instead — the traceback and enough environment facts to identify the cause. Only the
*names* of environment variables are reported, never their values.
"""

import json
import os
import sys
import traceback
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT))

_import_error: str | None = None

try:
    from app.main import app  # noqa: F401
except Exception:
    _import_error = traceback.format_exc()

    def _diagnostics() -> dict:
        expected = [
            "DATABASE_URL",
            "SECRET_KEY",
            "SUPABASE_URL",
            "SUPABASE_SERVICE_ROLE_KEY",
            "SUPABASE_STORAGE_BUCKET",
            "GROQ_API_KEY",
            "ENVIRONMENT",
            "BACKEND_CORS_ORIGINS",
        ]
        try:
            root_entries = sorted(p.name for p in ROOT.iterdir())
        except OSError as exc:
            root_entries = [f"<unreadable: {exc}>"]

        app_dir = ROOT / "app"
        try:
            app_entries = sorted(p.name for p in app_dir.iterdir()) if app_dir.is_dir() else []
        except OSError as exc:
            app_entries = [f"<unreadable: {exc}>"]

        return {
            "error": "backend failed to start",
            "python_version": sys.version,
            "root": str(ROOT),
            "root_contents": root_entries,
            "app_package_present": app_dir.is_dir(),
            "app_contents": app_entries,
            "env_vars_set": [name for name in expected if os.environ.get(name)],
            "env_vars_missing": [name for name in expected if not os.environ.get(name)],
            "traceback": _import_error.splitlines()[-40:],
        }

    async def app(scope, receive, send):  # type: ignore[no-redef]
        """Minimal ASGI app that reports why the real one could not load."""
        if scope["type"] != "http":
            return
        body = json.dumps(_diagnostics(), indent=2).encode()
        await send(
            {
                "type": "http.response.start",
                "status": 500,
                "headers": [
                    (b"content-type", b"application/json"),
                    (b"cache-control", b"no-store"),
                ],
            }
        )
        await send({"type": "http.response.body", "body": body})


__all__ = ["app"]
