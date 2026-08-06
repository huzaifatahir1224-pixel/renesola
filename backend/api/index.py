"""Vercel serverless entrypoint.

Vercel's Python runtime looks for a module-level ASGI callable named `app` inside
`api/`. Everything else lives in the `app` package one level up.
"""

import sys
from pathlib import Path

# Vercel runs this file with `api/` as the working directory, so the project root
# has to be on the path before `app.main` can be imported.
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app.main import app  # noqa: E402

__all__ = ["app"]
