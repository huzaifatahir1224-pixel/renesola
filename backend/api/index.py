"""Vercel serverless entrypoint.

Vercel's builder looks for a module-level ASGI callable named `app`. Keep this file
canonical and unconditional — when `app` was assigned inside a try/except the builder
did not recognise it and never created the function at all.

Diagnostics live in api/ping.py, which needs no imports and stays reachable even when
this module cannot load.
"""

import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.main import app  # noqa: E402

__all__ = ["app"]
