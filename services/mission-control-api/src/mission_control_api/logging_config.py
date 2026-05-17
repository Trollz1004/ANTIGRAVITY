"""
Structured JSON logging configuration for Mission Control API.

Usage:
    from mission_control_api.logging_config import setup_logging, get_logger
    setup_logging()
    logger = get_logger(__name__)
"""

import logging
import logging.handlers
import json
import sys
import uuid
from datetime import datetime, timezone
from typing import Any, Optional


class JSONFormatter(logging.Formatter):
    """Custom JSON formatter that outputs structured log records.

    Each log entry includes:
      - timestamp (ISO 8601 UTC)
      - level
      - logger name
      - message
      - module, function, line
      - request_id (if available via LogContext)
      - duration_ms (if available via LogContext)
      - user_id (if available via LogContext)
      - any extra fields passed via the 'extra' kwarg
    """

    def format(self, record: logging.LogRecord) -> str:
        # Build the base log entry
        entry: dict[str, Any] = {
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "level": record.levelname,
            "logger": record.name,
            "message": record.getMessage(),
            "module": record.module,
            "function": record.funcName,
            "line": record.lineno,
        }

        # Attach context fields if present on the record
        request_id = getattr(record, "request_id", None)
        if request_id:
            entry["request_id"] = request_id

        duration_ms = getattr(record, "duration_ms", None)
        if duration_ms is not None:
            entry["duration_ms"] = duration_ms

        user_id = getattr(record, "user_id", None)
        if user_id:
            entry["user_id"] = user_id

        # Attach any extra fields from the 'extra' kwarg
        # (skip standard LogRecord attributes to avoid noise)
        standard_attrs = {
            "name", "msg", "args", "created", "filename", "funcName",
            "levelname", "levelno", "lineno", "module", "msecs",
            "pathname", "process", "processName", "relativeCreated",
            "stack_info", "thread", "threadName", "exc_info", "exc_text",
            "message", "taskName", "request_id", "duration_ms", "user_id",
        }
        for key, value in record.__dict__.items():
            if key not in standard_attrs and not key.startswith("_"):
                entry[key] = value

        # Include exception info if present
        if record.exc_info and record.exc_info[0] is not None:
            entry["exception"] = self.formatException(record.exc_info)

        return json.dumps(entry, default=str)


class LogContext:
    """Thread-safe / async-safe context carrier for per-request log fields.

    Usage in middleware:
        LogContext.set_request_id(request_id)
        LogContext.set_user_id(user_id)
        LogContext.set_duration_ms(duration_ms)

    Usage in logger calls (automatic via JSONFormatter):
        logger.info("request handled")
        # request_id, duration_ms, user_id are attached automatically
        # if they were set in the current context.

    NOTE: In an async context (FastAPI/Starlette), use
    contextvars via the middleware setting request.state instead.
    This class provides a simple module-level fallback.
    """

    _request_id: Optional[str] = None
    _user_id: Optional[str] = None
    _duration_ms: Optional[int] = None

    @classmethod
    def set_request_id(cls, value: Optional[str]) -> None:
        cls._request_id = value

    @classmethod
    def get_request_id(cls) -> Optional[str]:
        return cls._request_id

    @classmethod
    def set_user_id(cls, value: Optional[str]) -> None:
        cls._user_id = value

    @classmethod
    def get_user_id(cls) -> Optional[str]:
        return cls._user_id

    @classmethod
    def set_duration_ms(cls, value: Optional[int]) -> None:
        cls._duration_ms = value

    @classmethod
    def get_duration_ms(cls) -> Optional[int]:
        return cls._duration_ms

    @classmethod
    def clear(cls) -> None:
        cls._request_id = None
        cls._user_id = None
        cls._duration_ms = None


class ContextFilter(logging.Filter):
    """Injects LogContext fields into every LogRecord so the JSONFormatter can use them."""

    def filter(self, record: logging.LogRecord) -> bool:
        record.request_id = LogContext.get_request_id()
        record.duration_ms = LogContext.get_duration_ms()
        record.user_id = LogContext.get_user_id()
        return True


def setup_logging(level: str = "INFO") -> None:
    """Configure root logger with JSON formatter and console handler.

    Args:
        level: Logging level string (DEBUG, INFO, WARNING, ERROR, CRITICAL).
    """
    root_logger = logging.getLogger()
    root_logger.setLevel(getattr(logging, level.upper(), logging.INFO))

    # Remove existing handlers to avoid duplicates on re-init
    for handler in root_logger.handlers[:]:
        root_logger.removeHandler(handler)

    handler = logging.StreamHandler(sys.stdout)
    handler.setFormatter(JSONFormatter())
    handler.addFilter(ContextFilter())
    root_logger.addHandler(handler)

    # Also configure the uvicorn loggers to use JSON
    for uvicorn_name in ("uvicorn", "uvicorn.access", "uvicorn.error", "fastapi"):
        uv_logger = logging.getLogger(uvicorn_name)
        uv_logger.handlers.clear()
        uv_logger.propagate = True  # let root logger handle it


def get_logger(name: str) -> logging.Logger:
    """Get a logger instance that will emit JSON-formatted records.

    Args:
        name: Logger name, typically __name__.

    Returns:
        Configured logging.Logger instance.
    """
    return logging.getLogger(name)


def new_request_id() -> str:
    """Generate a new unique request ID."""
    return uuid.uuid4().hex[:16]
