"""Tests for app.rate_limit — in-process rate limit reset helpers."""

from app.rate_limit import reset_rate_limits
from app.routers.rate_limits import (
    EndpointStat,
    RateLimitConfig,
    RateLimitStatus,
    _reset_day_if_needed,
    _reset_window_if_needed,
    record_request,
)


class TestRecordRequest:
    def test_records_and_increments(self):
        reset_rate_limits()
        record_request("/api/v1/health")
        record_request("/api/v1/health")
        record_request("/api/v1/users")
        # Module-level globals are updated
        from app.routers import rate_limits
        assert rate_limits._requests_this_minute >= 3
        assert rate_limits._total_today >= 3


class TestResetHelpers:
    def test_reset_window(self):
        _reset_window_if_needed()

    def test_reset_day(self):
        _reset_day_if_needed()


class TestResponseModels:
    def test_endpoint_stat(self):
        es = EndpointStat(path="/api/v1/test", count=42)
        assert es.path == "/api/v1/test"
        assert es.count == 42

    def test_rate_limit_status(self):
        status = RateLimitStatus(
            requestsThisMinute=5,
            requestsPerMinute=60,
            resetInSeconds=30,
            totalRequestsToday=100,
            topEndpoints=[],
        )
        assert status.requestsThisMinute == 5

    def test_rate_limit_config(self):
        config = RateLimitConfig(
            requestsPerMinute=60, burstSize=10, windowSeconds=60
        )
        assert config.requestsPerMinute == 60


class TestResetRateLimits:
    def test_reset(self):
        record_request("/test/path")
        reset_rate_limits()
        from app.routers import rate_limits
        assert rate_limits._requests_this_minute == 0
        assert rate_limits._total_today == 0
