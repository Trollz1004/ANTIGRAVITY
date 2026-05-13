"""Security middleware and utilities for the YouAndINotAI platform."""

import logging
import time
from collections import defaultdict
from typing import Callable

from fastapi import HTTPException, Request, Response, status
from fastapi.security import HTTPBearer
from starlette.middleware.base import BaseHTTPMiddleware

logger = logging.getLogger("youandinotai.security")


class RateLimitMiddleware(BaseHTTPMiddleware):
    """Rate limiting middleware for security protection."""

    def __init__(
        self,
        app,
        calls_per_minute: int = 60,
        ban_threshold: int = 100,
        ban_duration: int = 3600,  # 1 hour
    ):
        super().__init__(app)
        self.calls_per_minute = calls_per_minute
        self.ban_threshold = ban_threshold
        self.ban_duration = ban_duration

        # Track request counts per IP
        self.requests = defaultdict(list)  # ip -> [timestamps]
        self.banned_ips = {}  # ip -> ban_expiry_timestamp

    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        client_ip = self._get_client_ip(request)

        # Check if IP is banned
        current_time = time.time()
        if client_ip in self.banned_ips:
            if current_time < self.banned_ips[client_ip]:
                logger.warning(f"Blocked request from banned IP: {client_ip}")
                raise HTTPException(
                    status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                    detail="IP temporarily banned due to excessive requests",
                )
            else:
                # Ban expired, remove from banned list
                del self.banned_ips[client_ip]

        # Clean old requests (older than 1 minute)
        cutoff_time = current_time - 60
        self.requests[client_ip] = [
            timestamp
            for timestamp in self.requests[client_ip]
            if timestamp > cutoff_time
        ]

        # Check rate limit
        if len(self.requests[client_ip]) >= self.calls_per_minute:
            logger.warning(f"Rate limit exceeded for IP: {client_ip}")

            # Add to ban list if threshold exceeded
            if len(self.requests[client_ip]) >= self.ban_threshold:
                self.banned_ips[client_ip] = current_time + self.ban_duration
                logger.warning(f"IP {client_ip} banned for {self.ban_duration} seconds")

            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="Rate limit exceeded",
            )

        # Record this request
        self.requests[client_ip].append(current_time)

        response = await call_next(request)
        return response

    def _get_client_ip(self, request: Request) -> str:
        """Extract client IP address from request."""
        # Check for forwarded headers (from proxies/load balancers)
        forwarded_for = request.headers.get("X-Forwarded-For")
        if forwarded_for:
            # Take the first IP in the chain
            return forwarded_for.split(",")[0].strip()

        # Check for real IP header
        real_ip = request.headers.get("X-Real-IP")
        if real_ip:
            return real_ip

        # Fallback to client host
        if request.client:
            return request.client.host

        return "unknown"


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


def sanitize_input(text: str) -> str:
    """Sanitize user input to prevent XSS and other attacks."""
    if not text:
        return text

    # Remove or escape dangerous characters
    dangerous_chars = ["<", ">", '"', "'", "&"]
    for char in dangerous_chars:
        text = text.replace(char, "")

    # Limit length
    return text[:1000]  # Max 1000 characters


def validate_email(email: str) -> bool:
    """Basic email validation."""
    import re

    pattern = r"^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$"
    return re.match(pattern, email) is not None


def validate_password_strength(password: str) -> tuple[bool, str]:
    """Validate password strength."""
    if len(password) < 8:
        return False, "Password must be at least 8 characters long"

    if not any(c.isupper() for c in password):
        return False, "Password must contain at least one uppercase letter"

    if not any(c.islower() for c in password):
        return False, "Password must contain at least one lowercase letter"

    if not any(c.isdigit() for c in password):
        return False, "Password must contain at least one digit"

    return True, "Password is strong"


# Constants for security policies
MAX_LOGIN_ATTEMPTS = 5
LOGIN_LOCKOUT_DURATION = 900  # 15 minutes

# Track failed login attempts
failed_login_attempts = defaultdict(int)  # ip -> count
login_lockout_times = {}  # ip -> lockout_expiry_timestamp


def check_login_attempts(client_ip: str) -> bool:
    """Check if IP is locked out due to failed login attempts."""
    current_time = time.time()

    # Check if lockout expired
    if client_ip in login_lockout_times:
        if current_time > login_lockout_times[client_ip]:
            # Lockout expired, reset attempts
            del failed_login_attempts[client_ip]
            del login_lockout_times[client_ip]
        else:
            # Still locked out
            return False

    return True


def record_failed_login(client_ip: str):
    """Record a failed login attempt."""
    failed_login_attempts[client_ip] += 1

    if failed_login_attempts[client_ip] >= MAX_LOGIN_ATTEMPTS:
        # Lock out the IP
        login_lockout_times[client_ip] = time.time() + LOGIN_LOCKOUT_DURATION
        logger.warning(f"IP {client_ip} locked out due to failed login attempts")
