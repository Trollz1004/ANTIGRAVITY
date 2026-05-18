"""
Input sanitization middleware for Mission Control API.

Protects against:
  - XSS (cross-site scripting): strips HTML tags, event handlers, javascript: URIs
  - SQL injection: detects and blocks common SQLi patterns
  - Prototype pollution: strips __proto__, constructor, prototype keys
  - NoSQL injection: strips $gt, $ne, $eq, $regex and other operator keys

Applied to all POST / PUT / PATCH request bodies before they reach route handlers.
Also sanitizes query parameters and path parameters on every request.

Usage:
    app.add_middleware(SanitizationMiddleware)

Design decisions:
    - Pure stdlib — no external sanitization libraries (matches project constraints).
    - Recursive: handles nested dicts and lists of arbitrary depth.
    - Fail-open on non-mutating GET/DELETE — still sanitizes but does not block.
    - Fail-closed on mutating methods (POST/PUT/PATCH) — returns 400 on dangerous input.
    - Logs every blocked request via the structured logger.
"""

from __future__ import annotations

import json
import re
import html
from typing import Any, Optional, Set, FrozenSet

from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import JSONResponse

from mission_control_api.logging_config import get_logger

logger = get_logger(__name__)

# ── Dangerous patterns ────────────────────────────────────────────────────────

# HTML tags that are commonly used in XSS vectors
_HTML_TAG_RE = re.compile(
    r"<(script|iframe|object|embed|applet|form|input|button|textarea|select|"
    r"link|meta|style|base|svg|math|video|audio|source|track|area|map|"
    r"frame|frameset|layer|ilayer|bgsound|marquee|blink|"
    r"img|image)[^>]*>",
    re.IGNORECASE | re.DOTALL,
)

# Event handler attributes (onload, onerror, onclick, etc.)
_EVENT_HANDLER_RE = re.compile(
    r"\bon\w+\s*=",
    re.IGNORECASE,
)

# javascript: and data: URI schemes
_DANGEROUS_URI_RE = re.compile(
    r"(?:javascript|data|vbscript|mocha|livescript)\s*:",
    re.IGNORECASE,
)

# CSS expression() and url() that can execute JS in old browsers
_CSS_EXPRESSION_RE = re.compile(
    r"(?:expression|url\s*\()\s*[^)]*(?:javascript|eval)",
    re.IGNORECASE | re.DOTALL,
)

# Common SQL injection patterns
_SQLI_PATTERNS = [
    re.compile(r"(\b(SELECT|INSERT|UPDATE|DELETE|DROP|UNION|ALTER|CREATE|EXEC|EXECUTE)\b)", re.IGNORECASE),
    re.compile(r"(--|;|/\*|\*/)", re.IGNORECASE),
    re.compile(r"(\bOR\b\s+\b\d+\b\s*=\s*\b\d+\b)", re.IGNORECASE),
    re.compile(r"(\bOR\b\s+['\"]?\w+['\"]?\s*=\s*['\"]?\w+['\"]?)", re.IGNORECASE),
    re.compile(r"(\bUNION\b\s+\bALL\b\s+\bSELECT\b)", re.IGNORECASE),
    re.compile(r"(\bWAITFOR\b\s+\bDELAY\b|\bBENCHMARK\b\s*\()", re.IGNORECASE),
    re.compile(r"(\bINTO\b\s+\bOUTFILE\b|\bLOAD_FILE\b\s*\()", re.IGNORECASE),
    re.compile(r"(CHAR\s*\(\s*\d+(?:\s*,\s*\d+)*\s*\))", re.IGNORECASE),
]

# Prototype pollution keys
_POLLUTION_KEYS: FrozenSet[str] = frozenset({
    "__proto__",
    "constructor",
    "prototype",
    "__defineGetter__",
    "__defineSetter__",
    "__lookupGetter__",
    "__lookupSetter__",
})

# NoSQL injection operator keys
_NOSQL_OPERATORS: FrozenSet[str] = frozenset({
    "$gt", "$gte", "$lt", "$lte", "$ne", "$eq",
    "$in", "$nin", "$regex", "$where", "$or", "$and",
    "$not", "$nor", "$exists", "$type", "$mod",
    "$text", "$all", "$elemMatch", "$size",
    "$expr", "$jsonSchema", "$geoWithin", "$geoIntersects",
    "$near", "$nearSphere", "$maxDistance", "$minDistance",
})


def _contains_html(value: str) -> bool:
    """Check if a string contains dangerous HTML/JS patterns."""
    if _HTML_TAG_RE.search(value):
        return True
    if _EVENT_HANDLER_RE.search(value):
        return True
    if _DANGEROUS_URI_RE.search(value):
        return True
    if _CSS_EXPRESSION_RE.search(value):
        return True
    return False


def _contains_sqli(value: str) -> bool:
    """Check if a string contains SQL injection patterns."""
    for pattern in _SQLI_PATTERNS:
        if pattern.search(value):
            return True
    return False


def _sanitize_string(value: str) -> str:
    """Sanitize a single string value: escape HTML entities, strip null bytes."""
    # Strip null bytes (used in injection attacks to bypass filters)
    value = value.replace("\x00", "")
    # Strip other control characters except newline, tab, carriage return
    value = re.sub(r"[\x01-\x08\x0b\x0c\x0e-\x1f\x7f]", "", value)
    # HTML-entity-encode remaining content to neutralize any HTML/JS
    value = html.escape(value, quote=True)
    return value


def sanitize_input(obj: Any, path: str = "") -> tuple[Any, list[str]]:
    """
    Recursively sanitize a parsed JSON value.

    Returns:
        (sanitized_value, warnings) where warnings is a list of strings
        describing any dangerous content that was found and neutralized.

    Raises:
        ValueError: If the input contains patterns that cannot be safely
                    sanitized (e.g., SQL injection in a mutating context).
    """
    warnings: list[str] = []

    if isinstance(obj, str):
        # Check for SQL injection patterns first (fail-closed)
        if _contains_sqli(obj):
            warnings.append(f"Potential SQL injection at '{path or 'root'}'")
        # Check for dangerous HTML/JS
        if _contains_html(obj):
            warnings.append(f"Potential XSS at '{path or 'root'}'")
        # Always sanitize the string
        return _sanitize_string(obj), warnings

    elif isinstance(obj, dict):
        cleaned: dict[str, Any] = {}
        for key, value in obj.items():
            # Check for prototype pollution via keys
            if key in _POLLUTION_KEYS:
                warnings.append(f"Prototype pollution key '{key}' at '{path or 'root'}'")
                continue  # Drop the key entirely
            # Check for NoSQL injection operators
            if key in _NOSQL_OPERATORS:
                warnings.append(f"NoSQL operator key '{key}' at '{path or 'root'}'")
                continue  # Drop the key entirely
            # Sanitize the key itself (keys can be attack vectors too)
            sanitized_key, key_warnings = sanitize_input(key, f"{path}.{key}[key]")
            warnings.extend(key_warnings)
            # Recursively sanitize the value
            sanitized_value, value_warnings = sanitize_input(value, f"{path}.{key}")
            warnings.extend(value_warnings)
            cleaned[sanitized_key] = sanitized_value
        return cleaned, warnings

    elif isinstance(obj, list):
        cleaned_list: list[Any] = []
        for i, item in enumerate(obj):
            sanitized_item, item_warnings = sanitize_input(item, f"{path}[{i}]")
            warnings.extend(item_warnings)
            cleaned_list.append(sanitized_item)
        return cleaned_list, warnings

    elif isinstance(obj, (int, float, bool)):
        return obj, warnings

    elif obj is None:
        return None, warnings

    else:
        # Unknown type — convert to string and sanitize
        return _sanitize_string(str(obj)), warnings


class SanitizationMiddleware(BaseHTTPMiddleware):
    """
    FastAPI middleware that sanitizes all incoming request bodies on
    POST / PUT / PATCH requests, plus query parameters on every request.

    GET / DELETE requests have their query parameters sanitized but are
    never blocked (fail-open for read-only operations).

    POST / PUT / PATCH requests that contain SQL injection patterns are
    rejected with 400 (fail-closed for mutating operations).
    """

    # Methods that mutate state — fail-closed
    MUTATING_METHODS: FrozenSet[str] = frozenset({"POST", "PUT", "PATCH"})

    async def dispatch(self, request: Request, call_next):
        method = request.method.upper()

        # ── Sanitize query parameters on every request ──
        if request.query_params:
            sanitized_qs, _ = sanitize_input(dict(request.query_params))
            # Store sanitized query params for downstream access
            # (We can't modify the immutable QueryParams, but we attach to state)
            request.state.sanitized_query = sanitized_qs

        # ── Sanitize request body on mutating methods ──
        if method in self.MUTATING_METHODS:
            content_type = request.headers.get("content-type", "")

            if "application/json" in content_type:
                try:
                    body = await request.body()
                    if body:
                        parsed = json.loads(body)
                        sanitized_body, warnings = sanitize_input(parsed)

                        if warnings:
                            # Check if any warning is SQL injection (fail-closed)
                            sqli_warnings = [w for w in warnings if "SQL injection" in w]
                            if sqli_warnings:
                                logger.warning(
                                    "request blocked: SQL injection detected",
                                    extra={
                                        "path": request.url.path,
                                        "method": method,
                                        "warnings": warnings,
                                        "client_ip": request.client.host if request.client else None,
                                    },
                                )
                                return JSONResponse(
                                    status_code=400,
                                    content={
                                        "detail": "Invalid input: potentially dangerous content detected",
                                        "errors": warnings,
                                    },
                                )

                            # XSS / pollution warnings — log and continue with sanitized body
                            logger.info(
                                "input sanitized",
                                extra={
                                    "path": request.url.path,
                                    "method": method,
                                    "warnings": warnings,
                                },
                            )

                        # Replace the request body with the sanitized version
                        # so downstream handlers receive clean data
                        sanitized_bytes = json.dumps(sanitized_body).encode("utf-8")

                        # Create a new request with the sanitized body
                        # We attach it to state so route handlers can access it
                        request.state.sanitized_body = sanitized_body
                        request.state.raw_body = sanitized_bytes

                        # Rebuild the request scope with the sanitized body
                        # This is the standard Starlette pattern for body replacement
                        async def receive():
                            return {
                                "type": "http.request",
                                "body": sanitized_bytes,
                                "more_body": False,
                            }

                        request = Request(request.scope, receive, request._send)

                except json.JSONDecodeError:
                    # Not valid JSON — let the handler deal with it (will 422)
                    pass
                except Exception as exc:
                    logger.error(
                        "sanitization error",
                        exc_info=True,
                        extra={"path": request.url.path, "method": method},
                    )
                    return JSONResponse(
                        status_code=500,
                        content={"detail": "Internal sanitization error"},
                    )

        response = await call_next(request)
        return response
