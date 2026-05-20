"""Request size limit and JSON depth limit middleware for DoS protection.

Provides:
- RequestSizeLimitMiddleware: checks Content-Length against configurable max sizes.
- JsonDepthLimitMiddleware: validates nested JSON object/array depth.
- check_json_depth: recursive utility for depth validation.
- MaxBodySize: decorator for per-endpoint size limits.
"""

import json
import logging
from collections.abc import Callable
from functools import wraps
from typing import Any

from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware
from app.routers.rate_limits import record_request

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Default limits (bytes / depth)
# ---------------------------------------------------------------------------
DEFAULT_MAX_BODY_SIZE = 1_048_576       # 1 MB
DEFAULT_MAX_FILE_UPLOAD_SIZE = 10_485_760  # 10 MB
DEFAULT_MAX_JSON_DEPTH = 10

# Path prefixes that should use the larger file-upload limit
FILE_UPLOAD_PREFIXES = (
    "/api/v1/uploads",
    "/api/v1/media",
    "/api/v1/attachments",
)


# ---------------------------------------------------------------------------
# Utility: recursive depth check
# ---------------------------------------------------------------------------

def check_json_depth(obj: Any, max_depth: int = DEFAULT_MAX_JSON_DEPTH, current_depth: int = 0) -> bool:
    """Recursively check that *obj* does not exceed *max_depth* levels of nesting.

    Returns ``True`` if the object is within the depth limit, ``False`` otherwise.
    """
    if current_depth > max_depth:
        return False
    if isinstance(obj, dict):
        return all(check_json_depth(v, max_depth, current_depth + 1) for v in obj.values())
    if isinstance(obj, list):
        return all(check_json_depth(item, max_depth, current_depth + 1) for item in obj)
    return True


# ---------------------------------------------------------------------------
# Per-endpoint decorator
# ---------------------------------------------------------------------------

def MaxBodySize(max_bytes: int) -> Callable:
    """Decorator that tags an endpoint with a custom maximum body size.

    The ``RequestSizeLimitMiddleware`` reads ``request.state.max_body_size``
    (if set) and uses it instead of the global default.

    Usage::

        @app.post("/upload")
        @MaxBodySize(5 * 1024 * 1024)  # 5 MB
        async def upload(request: Request):
            ...
    """
    def decorator(endpoint: Callable) -> Callable:
        @wraps(endpoint)
        async def wrapper(*args, **kwargs):
            # The actual size check happens inside the middleware; this
            # decorator only stamps the limit onto request.state.
            request = kwargs.get("request") or next(
                (a for a in args if isinstance(a, Request)), None
            )
            if request is not None:
                request.state.max_body_size = max_bytes
            return await endpoint(*args, **kwargs)
        # Also store on the raw function for non-async / class-based views
        wrapper._max_body_size = max_bytes  # type: ignore[attr-defined]
        return wrapper
    return decorator


# ---------------------------------------------------------------------------
# Middleware: request body size limit
# ---------------------------------------------------------------------------

class RequestSizeLimitMiddleware(BaseHTTPMiddleware):
    """Reject requests whose body exceeds a configurable byte limit.

    * ``max_body_size`` – default limit for JSON / form submissions (default 1 MB).
    * ``max_file_upload_size`` – larger limit for known upload paths (default 10 MB).
    * ``file_upload_prefixes`` – path prefixes that qualify for the upload limit.

    If an endpoint is decorated with ``@MaxBodySize(N)``, that value takes
    precedence over the global defaults.
    """

    def __init__(
        self,
        app,
        max_body_size: int = DEFAULT_MAX_BODY_SIZE,
        max_file_upload_size: int = DEFAULT_MAX_FILE_UPLOAD_SIZE,
        file_upload_prefixes: tuple[str, ...] = FILE_UPLOAD_PREFIXES,
    ):
        super().__init__(app)
        self.max_body_size = max_body_size
        self.max_file_upload_size = max_file_upload_size
        self.file_upload_prefixes = file_upload_prefixes

    # ------------------------------------------------------------------
    # Helpers
    # ------------------------------------------------------------------

    def _effective_limit(self, request: Request) -> int:
        """Return the byte limit that applies to *request*."""
        # 1. Per-endpoint override via decorator
        limit = getattr(request.state, "max_body_size", None)
        if limit is not None:
            return int(limit)
        # 2. Upload paths get the larger limit
        path = request.url.path
        if any(path.startswith(prefix) for prefix in self.file_upload_prefixes):
            return self.max_file_upload_size
        # 3. Default
        return self.max_body_size

    # ------------------------------------------------------------------
    # Dispatch
    # ------------------------------------------------------------------

    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        # Only check methods that typically carry a body
        if request.method in ("POST", "PUT", "PATCH"):
            content_length = request.headers.get("content-length")
            if content_length is not None:
                try:
                    body_size = int(content_length)
                except (ValueError, TypeError):
                    body_size = 0

                limit = self._effective_limit(request)
                if body_size > limit:
                    logger.warning(
                        "Request body too large: %s > %s (path=%s, client=%s)",
                        body_size,
                        limit,
                        request.url.path,
                        request.client.host if request.client else "unknown",
                    )
                    return Response(
                        content=json.dumps({
                            "code": "PAYLOAD_TOO_LARGE",
                            "message": (
                                f"Request body exceeds the maximum allowed size of "
                                f"{limit} bytes."
                            ),
                        }),
                        status_code=413,
                        media_type="application/json",
                    )

        response = await call_next(request)
        record_request(request.url.path)
        return response


# ---------------------------------------------------------------------------
# Middleware: JSON depth limit
# ---------------------------------------------------------------------------

class JsonDepthLimitMiddleware(BaseHTTPMiddleware):
    """Validate that incoming JSON request bodies do not exceed a depth limit.

    Protects against deeply-nested JSON DoS attacks. Only requests with a
    ``Content-Type: application/json`` body are inspected.
    """

    def __init__(self, app, max_depth: int = DEFAULT_MAX_JSON_DEPTH):
        super().__init__(app)
        self.max_depth = max_depth

    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        # Only inspect methods that typically carry a JSON body
        if request.method in ("POST", "PUT", "PATCH"):
            content_type = request.headers.get("content-type", "")
            if "application/json" in content_type.lower():
                try:
                    body = await request.body()
                    if body:
                        data = json.loads(body)
                        if not check_json_depth(data, self.max_depth):
                            logger.warning(
                                "JSON depth exceeds limit %d (path=%s, client=%s)",
                                self.max_depth,
                                request.url.path,
                                request.client.host if request.client else "unknown",
                            )
                            return Response(
                                content=json.dumps({
                                    "code": "VALIDATION_ERROR",
                                    "message": (
                                        f"JSON body exceeds the maximum nesting depth "
                                        f"of {self.max_depth}."
                                    ),
                                }),
                                status_code=400,
                                media_type="application/json",
                            )
                except (json.JSONDecodeError, UnicodeDecodeError):
                    # Let FastAPI's own validation handle malformed JSON
                    pass

        response = await call_next(request)
        record_request(request.url.path)
        return response
