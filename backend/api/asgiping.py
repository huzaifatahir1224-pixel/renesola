"""Probe: a minimal ASGI app with no dependencies.

Paired with ping.py to isolate the failure:
  ping ok + asgiping ok   -> runtime and ASGI both fine; the fault is in our imports
  ping ok + asgiping fail -> the runtime does not serve bare ASGI callables here
  ping fail               -> the Python runtime itself is not working

Delete once the deployment is healthy.
"""

import json
import sys


async def app(scope, receive, send):
    if scope.get("type") != "http":
        return
    body = json.dumps({"asgi": "ok", "python_version": sys.version}).encode("utf-8")
    await send(
        {
            "type": "http.response.start",
            "status": 200,
            "headers": [(b"content-type", b"application/json"), (b"cache-control", b"no-store")],
        }
    )
    await send({"type": "http.response.body", "body": body})
