"""Tests for monitoring and error handling functionality."""

from unittest.mock import MagicMock, patch

import pytest

from app import monitoring


def test_metrics_collector():
    """Test that MetricsCollector works correctly."""
    collector = monitoring.MetricsCollector()

    # Test counter
    collector.increment_counter("test_counter")
    assert collector.counters["test_counter"] == 1

    collector.increment_counter("test_counter", 5)
    assert collector.counters["test_counter"] == 6

    # Test timer
    collector.record_timer("test_timer", 1.5)
    assert collector.timers["test_timer"] == 1.5

    # Test histogram
    collector.record_histogram("test_histogram", 10.0)
    collector.record_histogram("test_histogram", 20.0)
    assert collector.histograms["test_histogram"] == [10.0, 20.0]

    # Test get_metrics
    metrics = collector.get_metrics()
    assert "counters" in metrics
    assert "timers" in metrics
    assert "histograms" in metrics


@pytest.mark.asyncio
async def test_timing_decorator():
    """Test that timing_decorator works with async functions."""

    @monitoring.timing_decorator("test_async_func")
    async def async_func():
        return "test_result"

    result = await async_func()
    assert result == "test_result"

    # Check that metrics were recorded
    collector = monitoring.metrics_collector
    assert "test_async_func_calls" in collector.counters


def test_timing_decorator_sync():
    """Test that timing_decorator works with sync functions."""

    @monitoring.timing_decorator("test_sync_func")
    def sync_func():
        return "test_result"

    result = sync_func()
    assert result == "test_result"

    # Check that metrics were recorded
    collector = monitoring.metrics_collector
    assert "test_sync_func_calls" in collector.counters


@patch("app.monitoring.SENTRY_AVAILABLE", True)
@patch("app.monitoring.sentry_sdk")
def test_setup_monitoring_with_sentry(mock_sentry):
    """Test that setup_monitoring initializes Sentry when available."""
    mock_sentry.init = MagicMock()

    # Test with sentry available
    monitoring.setup_monitoring(sentry_dsn="https://test@test.ingest.sentry.io/123456")

    # Verify Sentry was initialized
    mock_sentry.init.assert_called_once()


@patch("app.monitoring.PROMETHEUS_AVAILABLE", True)
@patch("app.monitoring.start_http_server")
@patch("app.monitoring.Counter")
@patch("app.monitoring.Histogram")
@patch("app.monitoring.Gauge")
def test_setup_monitoring_with_prometheus(
    mock_gauge, mock_histogram, mock_counter, mock_start_server
):
    """Test that setup_monitoring initializes Prometheus when available."""
    # Test with prometheus available
    monitoring.setup_monitoring(prometheus_port=8000)

    # Verify Prometheus was initialized
    mock_start_server.assert_called_once_with(8000)


def test_setup_monitoring_without_dependencies():
    """Test that setup_monitoring handles missing dependencies gracefully."""
    # Test without any dependencies
    monitoring.setup_monitoring()

    # Should not crash and should log appropriately
    # We're not checking log output here, but the function should not raise
