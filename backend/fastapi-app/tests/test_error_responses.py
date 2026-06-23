"""Tests for app.error_responses — standardized error shapes."""

import pytest
from fastapi import HTTPException

from app.error_responses import (
    ErrorCode,
    ErrorResponse,
    api_exception,
    bad_request,
    conflict,
    forbidden,
    internal_error,
    not_found,
    rate_limit,
    service_unavailable,
    unauthorized,
    validation_error,
)


# ── ErrorCode enum ──


class TestErrorCode:
    def test_all_codes_are_strings(self):
        for code in ErrorCode:
            assert isinstance(code.value, str)

    def test_specific_codes_exist(self):
        assert ErrorCode.INVALID_CREDENTIALS == "INVALID_CREDENTIALS"
        assert ErrorCode.NOT_FOUND == "NOT_FOUND"
        assert ErrorCode.ALREADY_EXISTS == "ALREADY_EXISTS"
        assert ErrorCode.VALIDATION_ERROR == "VALIDATION_ERROR"
        assert ErrorCode.BAD_REQUEST == "BAD_REQUEST"
        assert ErrorCode.RATE_LIMIT_EXCEEDED == "RATE_LIMIT_EXCEEDED"
        assert ErrorCode.INTERNAL_ERROR == "INTERNAL_ERROR"
        assert ErrorCode.SERVICE_UNAVAILABLE == "SERVICE_UNAVAILABLE"
        assert ErrorCode.INSUFFICIENT_PERMISSIONS == "INSUFFICIENT_PERMISSIONS"
        assert ErrorCode.BETA_ACCESS_DENIED == "BETA_ACCESS_DENIED"
        assert ErrorCode.RESOURCE_LOCKED == "RESOURCE_LOCKED"


# ── ErrorResponse model ──


class TestErrorResponse:
    def test_minimal(self):
        resp = ErrorResponse(code="TEST", message="msg")
        assert resp.code == "TEST"
        assert resp.message == "msg"
        assert resp.details is None

    def test_with_details(self):
        resp = ErrorResponse(code="X", message="y", details={"key": "val"})
        assert resp.details == {"key": "val"}

    def test_model_dump(self):
        resp = ErrorResponse(code="C", message="M", details=[1, 2])
        d = resp.model_dump()
        assert d == {"code": "C", "message": "M", "details": [1, 2]}


# ── api_exception helper ──


class TestApiException:
    def test_returns_http_exception(self):
        exc = api_exception(400, ErrorCode.BAD_REQUEST, "bad")
        assert isinstance(exc, HTTPException)
        assert exc.status_code == 400
        assert exc.detail["code"] == "BAD_REQUEST"
        assert exc.detail["message"] == "bad"

    def test_string_code(self):
        exc = api_exception(500, "CUSTOM_CODE", "oops")
        assert exc.detail["code"] == "CUSTOM_CODE"

    def test_with_details(self):
        exc = api_exception(422, ErrorCode.VALIDATION_ERROR, "nope", details={"f": 1})
        assert exc.detail["details"] == {"f": 1}


# ── Convenience shapers ──


class TestConvenienceShapers:
    def test_not_found_defaults(self):
        exc = not_found()
        assert exc.status_code == 404
        assert exc.detail["code"] == "NOT_FOUND"

    def test_not_found_custom(self):
        exc = not_found("Profile missing", details={"id": 42})
        assert exc.detail["message"] == "Profile missing"
        assert exc.detail["details"] == {"id": 42}

    def test_unauthorized(self):
        exc = unauthorized()
        assert exc.status_code == 401

    def test_forbidden(self):
        exc = forbidden()
        assert exc.status_code == 403

    def test_bad_request(self):
        exc = bad_request("nope")
        assert exc.status_code == 400
        assert exc.detail["message"] == "nope"

    def test_conflict(self):
        exc = conflict()
        assert exc.status_code == 409
        assert exc.detail["code"] == "ALREADY_EXISTS"

    def test_validation_error(self):
        exc = validation_error()
        assert exc.status_code == 422

    def test_rate_limit(self):
        exc = rate_limit()
        assert exc.status_code == 429

    def test_internal_error(self):
        exc = internal_error()
        assert exc.status_code == 500

    def test_service_unavailable(self):
        exc = service_unavailable()
        assert exc.status_code == 503
