"""Vercel serverless entrypoint.

Vercel's Python runtime looks for a module-level ASGI callable named `app` inside
`api/`. Everything else lives in the `app` package one level up.

When the entrypoint raises on import, Vercel surfaces only FUNCTION_INVOCATION_FAILED,
which identifies nothing. So the import is caught here and served as a diagnostic
response instead.

This file is deliberately written in the oldest syntax that still works: no PEP 604
unions, no walrus, no f-string nesting. If the runtime turns out to be an older Python
than expected, *this file must still parse* — otherwise it cannot report that fact.
Only the names of environment variables are reported, never their values.
"""

import json
import os
import sys
import traceback

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if ROOT not in sys.path:
    sys.path.insert(0, ROOT)

_IMPORT_ERROR = None

try:
    from app.main import app  # noqa: F401
except Exception:
    _IMPORT_ERROR = traceback.format_exc()

    EXPECTED_ENV = [
        "DATABASE_URL",
        "SECRET_KEY",
        "SUPABASE_URL",
        "SUPABASE_SERVICE_ROLE_KEY",
        "SUPABASE_STORAGE_BUCKET",
        "GROQ_API_KEY",
        "ENVIRONMENT",
        "BACKEND_CORS_ORIGINS",
    ]

    def _listdir(path):
        try:
            return sorted(os.listdir(path))
        except OSError as exc:
            return ["<unreadable: " + str(exc) + ">"]

    def _diagnostics():
        app_dir = os.path.join(ROOT, "app")
        app_present = os.path.isdir(app_dir)
        return {
            "error": "backend failed to start",
            "python_version": sys.version,
            "root": ROOT,
            "root_contents": _listdir(ROOT),
            "app_package_present": app_present,
            "app_contents": _listdir(app_dir) if app_present else [],
            "sys_path_head": sys.path[:5],
            "env_vars_set": [n for n in EXPECTED_ENV if os.environ.get(n)],
            "env_vars_missing": [n for n in EXPECTED_ENV if not os.environ.get(n)],
            "traceback": _IMPORT_ERROR.splitlines()[-40:],
        }

    async def app(scope, receive, send):  # noqa: F811
        """Minimal ASGI app that reports why the real one could not load."""
        if scope.get("type") != "http":
            return
        body = json.dumps(_diagnostics(), indent=2).encode("utf-8")
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
