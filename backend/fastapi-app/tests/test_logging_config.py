"""Tests for app.logging_config — structured logging and correlation IDs."""

import json
import logging

from app.logging_config import (
    CorrelationIdFilter,
    JSONFormatter,
    MODULE_LOG_LEVELS,
    clear_correlation_id,
    get_correlation_id,
    get_logger,
    set_correlation_id,
    setup_logging,
)


class TestCorrelationId:
    def test_set_and_get(self):
        set_correlation_id("req-123")
        assert get_correlation_id() == "req-123"
        clear_correlation_id()

    def test_clear(self):
        set_correlation_id("req-456")
        clear_correlation_id()
        assert get_correlation_id() is None

    def test_default_is_none(self):
        clear_correlation_id()
        assert get_correlation_id() is None


class TestCorrelationIdFilter:
    def test_filter_injects_cid(self):
        filt = CorrelationIdFilter()
        record = logging.LogRecord(
            name="test", level=logging.INFO, pathname="", lineno=0, msg="hi",
            args=(), exc_info=None,
        )
        set_correlation_id("cid-abc")
        result = filt.filter(record)
        assert result is True
        assert record.correlation_id == "cid-abc"
        clear_correlation_id()

    def test_filter_without_cid(self):
        filt = CorrelationIdFilter()
        record = logging.LogRecord(
            name="test", level=logging.INFO, pathname="", lineno=0, msg="hi",
            args=(), exc_info=None,
        )
        clear_correlation_id()
        result = filt.filter(record)
        assert result is True


class TestJSONFormatter:
    def test_formats_json(self):
        fmt = JSONFormatter()
        record = logging.LogRecord(
            name="test.logger", level=logging.INFO, pathname="test.py",
            lineno=42, msg="hello %s", args=("world",), exc_info=None,
        )
        output = fmt.format(record)
        data = json.loads(output)
        assert data["level"] == "INFO"
        assert data["logger"] == "test.logger"
        assert data["message"] == "hello world"
        assert "timestamp" in data
        assert data["source"]["line"] == 42

    def test_includes_extra_fields(self):
        fmt = JSONFormatter()
        record = logging.LogRecord(
            name="test", level=logging.INFO, pathname="", lineno=0, msg="test",
            args=(), exc_info=None,
        )
        record.custom_field = "custom_value"
        output = fmt.format(record)
        data = json.loads(output)
        assert data.get("custom_field") == "custom_value"

    def test_includes_correlation_id(self):
        fmt = JSONFormatter()
        set_correlation_id("cid-xyz")
        record = logging.LogRecord(
            name="test", level=logging.INFO, pathname="", lineno=0, msg="hi",
            args=(), exc_info=None,
        )
        output = fmt.format(record)
        data = json.loads(output)
        assert data["correlation_id"] == "cid-xyz"
        clear_correlation_id()

    def test_includes_exception_info(self):
        fmt = JSONFormatter()
        try:
            raise ValueError("boom")
        except ValueError:
            import sys
            exc_info = sys.exc_info()
        record = logging.LogRecord(
            name="test", level=logging.ERROR, pathname="", lineno=0, msg="err",
            args=(), exc_info=exc_info,
        )
        output = fmt.format(record)
        data = json.loads(output)
        assert "exception" in data
        assert data["exception"]["type"] == "ValueError"
        assert "boom" in data["exception"]["message"]


class TestModuleLogLevels:
    def test_known_modules(self):
        assert "uvicorn" in MODULE_LOG_LEVELS
        assert "fastapi" in MODULE_LOG_LEVELS

    def test_all_valid_levels(self):
        valid = {"DEBUG", "INFO", "WARNING", "ERROR", "CRITICAL"}
        for module, level in MODULE_LOG_LEVELS.items():
            assert level.upper() in valid, f"{module} has invalid level {level}"


class TestSetupLogging:
    def test_setup_json(self):
        setup_logging(level="WARNING", use_json=True)
        root = logging.getLogger()
        assert root.level == logging.WARNING

    def test_setup_plaintext(self):
        setup_logging(level="INFO", use_json=False)
        root = logging.getLogger()
        assert root.level == logging.INFO


class TestGetLogger:
    def test_returns_logger(self):
        lgr = get_logger("test.module")
        assert isinstance(lgr, logging.Logger)
        assert lgr.name == "test.module"
