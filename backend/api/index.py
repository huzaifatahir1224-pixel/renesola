"""Vercel serverless entrypoint.

Vercel's builder looks for a module-level ASGI callable named `app`. Keep this
unconditional — while `app` was assigned inside a try/except the builder could not see
it and never created the function, so every route returned a bare 404.
"""

import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.main import app  # noqa: E402

__all__ = ["app"]
