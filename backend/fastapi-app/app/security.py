"""Security middleware and utilities for the YouAndINotAI platform."""

import logging
from typing import Callable

from fastapi import HTTPException, Request, Response, status
from fastapi.security import HTTPBearer
from starlette.middleware.base import BaseHTTPMiddleware

logger = logging.getLogger("youandinotai.security")


class InputValidationMiddleware(BaseHTTPMiddleware):
    """Input validation middleware for security protection."""

    # Suspicious patterns that might indicate attacks
    SUSPICIOUS_PATTERNS = [
        "' OR 1=1",  # SQL injection
        "UNION SELECT",  # SQL injection
        "<script>",  # XSS
        "javascript:",  # XSS
        "DROP TABLE",  # SQL injection
        "DELETE FROM",  # SQL injection
        "../../../",  # Path traversal
        "%3Cscript%3E",  # URL encoded XSS
        "{{7*7}}",  # Template injection
        "${7*7}",  # Template injection
    ]

    MAX_CONTENT_LENGTH = 10 * 1024 * 1024  # 10MB max request body

    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        # Check request body size
        if request.headers.get("content-length"):
            try:
                content_length = int(request.headers["content-length"])
                if content_length > self.MAX_CONTENT_LENGTH:
                    logger.warning(f"Request body too large: {content_length} bytes")
                    raise HTTPException(
                        status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                        detail="Request body too large",
                    )
            except ValueError:
                pass  # Invalid content-length header

        # Check for suspicious patterns in query parameters
        for key, value in request.query_params.items():
            if self._contains_suspicious_pattern(
                key
            ) or self._contains_suspicious_pattern(value):
                logger.warning(
                    f"Suspicious pattern detected in query param: {key}={value}"
                )
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Invalid input detected",
                )

        # Check for suspicious patterns in path
        if self._contains_suspicious_pattern(request.url.path):
            logger.warning(f"Suspicious pattern detected in path: {request.url.path}")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid path"
            )

        # For POST/PUT requests, check body content
        if request.method in ["POST", "PUT", "PATCH"]:
            try:
                body = await request.body()
                if body and len(body) <= self.MAX_CONTENT_LENGTH:
                    body_str = body.decode("utf-8", errors="ignore")
                    if self._contains_suspicious_pattern(body_str):
                        logger.warning("Suspicious pattern detected in request body")
                        raise HTTPException(
                            status_code=status.HTTP_400_BAD_REQUEST,
                            detail="Invalid input detected",
                        )
            except Exception as e:
                logger.warning(f"Error reading request body: {e}")
                # Continue processing, don't block on body read errors

        response = await call_next(request)
        return response

    def _contains_suspicious_pattern(self, text: str) -> bool:
        """Check if text contains suspicious patterns."""
        if not text:
            return False

        text_lower = text.lower()
        for pattern in self.SUSPICIOUS_PATTERNS:
            if pattern.lower() in text_lower:
                return True
        return False


class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    """Security headers middleware with enhanced protections."""

    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        response = await call_next(request)

        # Add additional security headers
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        response.headers["Strict-Transport-Security"] = (
            "max-age=31536000; includeSubDomains; preload"
        )

        # Enhanced Content Security Policy
        response.headers["Content-Security-Policy"] = (
            "default-src 'self'; "
            "script-src 'self' 'unsafe-inline'; "
            "style-src 'self' 'unsafe-inline'; "
            "img-src 'self' data: https:; "
            "font-src 'self'; "
            "connect-src 'self'; "
            "frame-ancestors 'none'; "
            "upgrade-insecure-requests;"
        )

        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        response.headers["Permissions-Policy"] = (
            "geolocation=(), microphone=(), camera=()"
        )

        # Prevent MIME type sniffing
        response.headers["X-Content-Type-Options"] = "nosniff"

        return response


# Reusable security utilities
def require_auth(credentials=HTTPBearer()):
    """Dependency for requiring authentication with enhanced security."""
    return credentials
