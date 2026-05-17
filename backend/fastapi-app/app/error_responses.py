"""Standardized error response models and helpers for the FastAPI application.

All error responses follow the format:
{
    "code": "ERROR_CODE",        # machine-readable string enum
    "message": "Human readable",  # user-facing description
    "details": null | any         # optional extra context
}
"""

from __future__ import annotations

from enum import Enum
from typing import Any, Optional

from fastapi import HTTPException, status
from pydantic import BaseModel


class ErrorCode(str, Enum):
    """Machine-readable error codes returned in every error response."""

    # Authentication / Authorization
    INVALID_CREDENTIALS = "INVALID_CREDENTIALS"
    TOKEN_EXPIRED = "TOKEN_EXPIRED"
    TOKEN_INVALID = "TOKEN_INVALID"
    INSUFFICIENT_PERMISSIONS = "INSUFFICIENT_PERMISSIONS"
    BETA_ACCESS_DENIED = "BETA_ACCESS_DENIED"

    # Resource errors
    NOT_FOUND = "NOT_FOUND"
    ALREADY_EXISTS = "ALREADY_EXISTS"
    RESOURCE_LOCKED = "RESOURCE_LOCKED"

    # Request errors
    VALIDATION_ERROR = "VALIDATION_ERROR"
    BAD_REQUEST = "BAD_REQUEST"
    RATE_LIMIT_EXCEEDED = "RATE_LIMIT_EXCEEDED"

    # Server errors
    INTERNAL_ERROR = "INTERNAL_ERROR"
    SERVICE_UNAVAILABLE = "SERVICE_UNAVAILABLE"


class ErrorResponse(BaseModel):
    """Standardized error response body."""

    code: str
    message: str
    details: Optional[Any] = None


# ---------------------------------------------------------------------------
# Helper: create a FastAPI HTTPException that will be caught by our
#         global handler and rendered as a standardized ErrorResponse.
# ---------------------------------------------------------------------------

def api_exception(
    status_code: int,
    code: ErrorCode | str,
    message: str,
    details: Any = None,
) -> HTTPException:
    """Return an HTTPException whose ``detail`` is an ``ErrorResponse`` dict.

    Usage in routers::

        raise api_exception(
            status_code=404,
            code=ErrorCode.NOT_FOUND,
            message="Profile not found",
        )
    """
    payload = ErrorResponse(code=str(code), message=message, details=details)
    return HTTPException(status_code=status_code, detail=payload.model_dump())


# ---------------------------------------------------------------------------
# Convenience shapers for the most common status codes
# ---------------------------------------------------------------------------

def not_found(message: str = "Resource not found", details: Any = None) -> HTTPException:
    return api_exception(status.HTTP_404_NOT_FOUND, ErrorCode.NOT_FOUND, message, details)


def unauthorized(message: str = "Authentication required", details: Any = None) -> HTTPException:
    return api_exception(status.HTTP_401_UNAUTHORIZED, ErrorCode.INVALID_CREDENTIALS, message, details)


def forbidden(message: str = "Insufficient permissions", details: Any = None) -> HTTPException:
    return api_exception(status.HTTP_403_FORBIDDEN, ErrorCode.INSUFFICIENT_PERMISSIONS, message, details)


def bad_request(message: str = "Bad request", details: Any = None) -> HTTPException:
    return api_exception(status.HTTP_400_BAD_REQUEST, ErrorCode.BAD_REQUEST, message, details)


def conflict(message: str = "Resource already exists", details: Any = None) -> HTTPException:
    return api_exception(status.HTTP_409_CONFLICT, ErrorCode.ALREADY_EXISTS, message, details)


def validation_error(message: str = "Validation error", details: Any = None) -> HTTPException:
    return api_exception(status.HTTP_422_UNPROCESSABLE_ENTITY, ErrorCode.VALIDATION_ERROR, message, details)


def rate_limit(message: str = "Rate limit exceeded", details: Any = None) -> HTTPException:
    return api_exception(status.HTTP_429_TOO_MANY_REQUESTS, ErrorCode.RATE_LIMIT_EXCEEDED, message, details)


def internal_error(message: str = "An unexpected error occurred", details: Any = None) -> HTTPException:
    return api_exception(status.HTTP_500_INTERNAL_SERVER_ERROR, ErrorCode.INTERNAL_ERROR, message, details)
