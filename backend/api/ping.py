"""Probe: the most basic Vercel Python function there is.

No third-party imports, no package imports, no ASGI. If /api/ping fails, the Python
runtime itself is not working and nothing about our application code is the cause.

Delete once the deployment is healthy.
"""

import json
import os
import sys
from http.server import BaseHTTPRequestHandler


class handler(BaseHTTPRequestHandler):  # noqa: N801 - Vercel requires this exact name
    def do_GET(self):
        root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        try:
            root_contents = sorted(os.listdir(root))
        except OSError as exc:
            root_contents = ["<unreadable: " + str(exc) + ">"]

        app_dir = os.path.join(root, "app")
        try:
            app_contents = sorted(os.listdir(app_dir)) if os.path.isdir(app_dir) else []
        except OSError as exc:
            app_contents = ["<unreadable: " + str(exc) + ">"]

        api_dir = os.path.join(root, "api")
        try:
            api_contents = sorted(os.listdir(api_dir)) if os.path.isdir(api_dir) else []
        except OSError as exc:
            api_contents = ["<unreadable: " + str(exc) + ">"]

        # Can the real application be imported from here?
        try:
            from app.main import app as _real_app  # noqa: F401

            app_import = "ok"
        except Exception as exc:  # noqa: BLE001
            app_import = type(exc).__name__ + ": " + str(exc)[:200]

        # Can the third-party dependencies even be imported?
        deps = {}
        for name in ("fastapi", "sqlalchemy", "psycopg", "pydantic", "groq", "httpx"):
            try:
                __import__(name)
                deps[name] = "ok"
            except Exception as exc:  # noqa: BLE001
                deps[name] = type(exc).__name__ + ": " + str(exc)[:80]

        expected = [
            "DATABASE_URL",
            "SECRET_KEY",
            "SUPABASE_URL",
            "SUPABASE_SERVICE_ROLE_KEY",
            "GROQ_API_KEY",
            "ENVIRONMENT",
        ]

        payload = {
            "ping": "pong",
            "python_version": sys.version,
            "cwd": os.getcwd(),
            "root": root,
            "root_contents": root_contents,
            "app_package_present": os.path.isdir(app_dir),
            "app_contents": app_contents,
            "api_contents": api_contents,
            "app_main_import": app_import,
            "dependencies": deps,
            "env_set": [n for n in expected if os.environ.get(n)],
            "env_missing": [n for n in expected if not os.environ.get(n)],
        }

        body = json.dumps(payload, indent=2).encode("utf-8")
        self.send_response(200)
        self.send_header("Content-Type", "application/json")
        self.send_header("Cache-Control", "no-store")
        self.end_headers()
        self.wfile.write(body)
