"""
Workaround for an opentelemetry-instrumentation-fastapi==0.63b1 bug that turns
every CORS preflight (OPTIONS) request into a 500 Internal Server Error.

Root cause (verified by in-process repro today, 2026-09-03):
  When an OPTIONS preflight reaches a route that resolves to an included
  sub-router (`_IncludedRouter`), the match inside the otel middleware is
  `Match.PARTIAL` (because the route only declares POST/PUT, not OPTIONS).
  The otel function `opentelemetry.instrumentation.fastapi._get_route_details`
  has this code:

      if match == Match.FULL:
          try:
              route = starlette_route.path
          except AttributeError:
              route = scope.get("path")
          break
      if match == Match.PARTIAL:
          route = starlette_route.path        # <-- AttributeError here

  `_IncludedRouter` has no `.path` attribute (it has `.prefix` and `.routes`).
  The FULL branch is wrapped in try/except, but the PARTIAL branch is not, so
  the AttributeError escapes the middleware. FastAPI's @app.exception_handler
  cannot catch exceptions raised inside middleware, so Starlette returns a
  bare `text/plain` 500 — exactly what Playwright and curl see on
  https://api.youandinotai.com/api/v1/auth/register today.

Fix: re-define `_get_route_details` on the otel module so the PARTIAL branch
mirrors the FULL branch's try/except. Safe — when `.path` is missing we fall
back to the raw request path, which is what otel already does in the FULL
branch.

This shim is idempotent. Import it once, BEFORE
`opentelemetry.instrumentation.fastapi.FastAPIInstrumentor.instrument_app(app)`
is called. The natural place is `app/main.py` immediately before
`setup_telemetry(app=app, engine=engine)`.
"""
from __future__ import annotations

import logging
from typing import Any

from starlette.routing import Match

logger = logging.getLogger(__name__)


def apply() -> None:
    """Idempotently replace the otel _get_route_details with a safe version."""
    try:
        from opentelemetry.instrumentation import fastapi as _otel_fastapi
    except Exception as exc:  # pragma: no cover - otel not installed
        logger.debug("otel-instrumentation-fastapi not present: %s", exc)
        return

    if getattr(_otel_fastapi, "_antigravity_cors_safe", False):
        return  # already patched this process

    def _get_route_details(scope: dict[str, Any]):
        """Return the matched route's path, or the raw scope path if unavailable.

        Mirrors the upstream function but guards the PARTIAL match branch with
        the same try/except the FULL match branch already has, so an
        _IncludedRouter (which has no `.path`) does not crash preflight.
        """
        route = None
        for starlette_route in scope["app"].routes:
            match, _ = (
                starlette_route.matches(scope)
                if hasattr(starlette_route, "matches")
                else (Match.NONE, None)
            )
            if match == Match.FULL:
                try:
                    route = starlette_route.path
                except AttributeError:
                    route = scope.get("path")
                break
            if match == Match.PARTIAL:
                try:
                    route = starlette_route.path
                except AttributeError:
                    route = scope.get("path")
        return route

    _otel_fastapi._get_route_details = _get_route_details
    _otel_fastapi._antigravity_cors_safe = True
    logger.info(
        "Applied ANT-108 CORS-preflight workaround to "
        "opentelemetry.instrumentation.fastapi._get_route_details"
    )
