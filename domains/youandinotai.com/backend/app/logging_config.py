"""Structured logging configuration for the YouAndINotAI platform.

Features:
- JSON output for machine-parseable logs
- Request ID (correlation_id) injection via contextvars
- Per-module log level configuration
- UTC timestamps with ISO 8601 format
- Exception and stack trace serialization
"""

import json
import logging
import logging.handlers
import os
import sys
from contextvars import ContextVar
from datetime import datetime, timezone
from typing import Any, Optional

# The API's log on disk. On by default, but only when the folder already exists,
# so a machine without it keeps logging to the console exactly as before.
DEFAULT_LOG_FILE = r"C:\ANTIGRAVITY\logs\dateapp-api.log"
LOG_FILE_MAX_BYTES = 5 * 1024 * 1024
LOG_FILE_BACKUP_COUNT = 5

# Context variable for request correlation ID
correlation_id_var: ContextVar[Optional[str]] = ContextVar(
    "correlation_id", default=None
)

# Per-module log level overrides
MODULE_LOG_LEVELS: dict[str, str] = {
    "youandinotai": "DEBUG",
    "youandinotai.api": "INFO",
    "youandinotai.auth": "INFO",
    "youandinotai.payments": "DEBUG",
    "youandinotai.webhooks": "DEBUG",
    "uvicorn": "WARNING",
    "uvicorn.access": "WARNING",
    "uvicorn.error": "INFO",
    "fastapi": "WARNING",
    "sqlalchemy.engine": "WARNING",
    "sqlalchemy.pool": "WARNING",
    "asyncio": "WARNING",
    "urllib3": "WARNING",
    "httpx": "WARNING",
}


class JSONFormatter(logging.Formatter):
    """Custom formatter that outputs log records as JSON.

    Includes:
    - ISO 8601 UTC timestamp
    - Correlation ID from context
    - Source file and line number
    - Structured extra fields
    - Exception stack traces
    """

    _EXCLUDED_FIELDS = frozenset(
        {
            "name",
            "msg",
            "args",
            "levelname",
            "levelno",
            "pathname",
            "filename",
            "module",
            "lineno",
            "funcName",
            "created",
            "msecs",
            "relativeCreated",
            "thread",
            "threadName",
            "processName",
            "process",
            "getMessage",
            "message",
            "exc_info",
            "exc_text",
            "stack_info",
            "taskName",
        }
    )

    def format(self, record: logging.LogRecord) -> str:
        """Format the log record as a JSON string."""
        log_record: dict[str, Any] = {
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "level": record.levelname,
            "logger": record.name,
            "message": record.getMessage(),
            "source": {
                "file": record.pathname,
                "line": record.lineno,
                "function": record.funcName,
            },
        }

        # Inject correlation ID from context variable
        cid = correlation_id_var.get(None)
        if cid:
            log_record["correlation_id"] = cid

        # Include any extra fields passed via `extra={...}`
        for key, value in record.__dict__.items():
            if key not in self._EXCLUDED_FIELDS and key not in log_record:
                log_record[key] = value

        # Serialize exception info
        if record.exc_info and record.exc_info[0] is not None:
            log_record["exception"] = {
                "type": record.exc_info[0].__name__,
                "message": str(record.exc_info[1]),
                "traceback": self.formatException(record.exc_info),
            }

        # Include stack info if present
        if record.stack_info:
            log_record["stack"] = record.stack_info

        return json.dumps(log_record, default=str, ensure_ascii=False)


class CorrelationIdFilter(logging.Filter):
    """Logging filter that injects the current correlation ID into every record."""

    def filter(self, record: logging.LogRecord) -> bool:
        cid = correlation_id_var.get(None)
        if cid:
            record.correlation_id = cid
        return True


def set_correlation_id(correlation_id: str) -> None:
    """Set the current request correlation ID in the context."""
    correlation_id_var.set(correlation_id)


def get_correlation_id() -> Optional[str]:
    """Get the current request correlation ID from the context."""
    return correlation_id_var.get(None)


def clear_correlation_id() -> None:
    """Clear the current request correlation ID."""
    correlation_id_var.set(None)


def resolve_log_file(log_file: Optional[str] = None) -> Optional[str]:
    """Pick the log file path, or None when disk logging should stay off.

    An explicit path is always used. With no path given, the default file is
    used only when its folder already exists.
    """
    if log_file is not None:
        return log_file or None
    if os.path.isdir(os.path.dirname(DEFAULT_LOG_FILE)):
        return DEFAULT_LOG_FILE
    return None


def setup_logging(
    level: str = "INFO",
    use_json: bool = True,
    log_file: Optional[str] = None,
) -> None:
    """Configure structured logging for the application.

    Args:
        level: Root logging level (DEBUG, INFO, WARNING, ERROR, CRITICAL)
        use_json: Whether to output logs in JSON format (default: True)
        log_file: File path to write logs to. Defaults to the rotating
            dateapp-api.log when its folder exists, and stays off otherwise.
    """
    root_logger = logging.getLogger()
    root_logger.setLevel(level.upper())

    # Remove existing handlers to avoid duplicates on re-init
    for handler in root_logger.handlers[:]:
        root_logger.removeHandler(handler)

    # Shared formatter
    if use_json:
        formatter: logging.Formatter = JSONFormatter()
    else:
        formatter = logging.Formatter(
            "%(asctime)s - %(name)s - %(levelname)s - %(message)s"
        )

    # Shared filter for correlation ID injection
    cid_filter = CorrelationIdFilter()

    # Console handler (stdout — Docker captures this)
    console_handler = logging.StreamHandler(sys.stdout)
    console_handler.setFormatter(formatter)
    console_handler.addFilter(cid_filter)
    root_logger.addHandler(console_handler)

    # Rotating file handler: 5 files of 5 MB. On by default when the folder
    # exists, so a reset request leaves a trace instead of only a console line.
    resolved_log_file = resolve_log_file(log_file)
    if resolved_log_file:
        file_handler = logging.handlers.RotatingFileHandler(
            resolved_log_file,
            maxBytes=LOG_FILE_MAX_BYTES,
            backupCount=LOG_FILE_BACKUP_COUNT,
            encoding="utf-8",
        )
        file_handler.setFormatter(formatter)
        file_handler.addFilter(cid_filter)
        root_logger.addHandler(file_handler)

    # Apply per-module log levels
    for module_name, module_level in MODULE_LOG_LEVELS.items():
        logging.getLogger(module_name).setLevel(module_level.upper())

    # Suppress overly noisy third-party loggers
    for noisy in ("hpack", "httpcore", "botocore", "boto3"):
        logging.getLogger(noisy).setLevel("WARNING")


def get_logger(name: str) -> logging.Logger:
    """Get a configured logger instance.

    Usage:
        logger = get_logger(__name__)
        logger.info("Something happened", extra={"key": "value"})
    """
    return logging.getLogger(name)
