"""Monitoring and metrics utilities for the YouAndINotAI platform."""

import asyncio
import functools
import logging
import time
from typing import Any, Dict, Optional

try:
    import sentry_sdk
    from sentry_sdk.integrations.logging import LoggingIntegration

    SENTRY_AVAILABLE = True
except ImportError:
    SENTRY_AVAILABLE = False
    sentry_sdk = None

try:
    from prometheus_client import Counter, Gauge, Histogram, start_http_server

    PROMETHEUS_AVAILABLE = True
except ImportError:
    PROMETHEUS_AVAILABLE = False
    Counter = Histogram = Gauge = start_http_server = None

logger = logging.getLogger("youandinotai.monitoring")


# Metric names
REQUEST_COUNT = "youandinotai_http_requests_total"
REQUEST_DURATION = "youandinotai_http_request_duration_seconds"
REQUEST_IN_PROGRESS = "youandinotai_http_requests_in_progress"

# Prometheus metrics (initialized in setup_monitoring)
REQUEST_COUNTER = None
REQUEST_DURATION_HISTOGRAM = None
REQUEST_IN_PROGRESS_GAUGE = None


class MetricsCollector:
    """Simple in-memory metrics collector for basic monitoring."""

    def __init__(self):
        self.counters: Dict[str, int] = {}
        self.timers: Dict[str, float] = {}
        self.histograms: Dict[str, list] = {}

    def increment_counter(self, name: str, value: int = 1):
        """Increment a counter metric."""
        self.counters[name] = self.counters.get(name, 0) + value
        logger.debug(
            f"Counter {name} incremented by {value}, total: {self.counters[name]}"
        )

    def record_timer(self, name: str, duration: float):
        """Record a timing measurement."""
        self.timers[name] = self.timers.get(name, 0) + duration
        logger.debug(f"Timer {name} recorded duration: {duration:.4f}s")

    def record_histogram(self, name: str, value: float):
        """Record a histogram value."""
        if name not in self.histograms:
            self.histograms[name] = []
        self.histograms[name].append(value)
        logger.debug(f"Histogram {name} recorded value: {value}")

    def get_metrics(self) -> Dict[str, Any]:
        """Get current metrics snapshot."""
        return {
            "counters": self.counters.copy(),
            "timers": self.timers.copy(),
            "histograms": {k: v.copy() for k, v in self.histograms.items()},
        }


# Global metrics collector instance
metrics_collector = MetricsCollector()


def timing_decorator(metric_name: str):
    """Decorator to time function execution and record metrics."""

    def decorator(func):
        @functools.wraps(func)
        async def async_wrapper(*args, **kwargs):
            start_time = time.time()
            try:
                result = await func(*args, **kwargs)
                return result
            finally:
                duration = time.time() - start_time
                metrics_collector.record_timer(metric_name, duration)
                metrics_collector.increment_counter(f"{metric_name}_calls")

        @functools.wraps(func)
        def sync_wrapper(*args, **kwargs):
            start_time = time.time()
            try:
                result = func(*args, **kwargs)
                return result
            finally:
                duration = time.time() - start_time
                metrics_collector.record_timer(metric_name, duration)
                metrics_collector.increment_counter(f"{metric_name}_calls")

        # Return appropriate wrapper based on whether function is async
        return async_wrapper if asyncio.iscoroutinefunction(func) else sync_wrapper

    return decorator


def setup_monitoring(
    sentry_dsn: Optional[str] = None, prometheus_port: Optional[int] = None
) -> None:
    """Initialize monitoring integrations.

    Args:
        sentry_dsn: Sentry DSN for error tracking
        prometheus_port: Port to expose Prometheus metrics endpoint
    """
    logger.info("Setting up monitoring infrastructure")

    # Initialize Sentry integration
    if SENTRY_AVAILABLE and sentry_dsn:
        try:
            # Configure Sentry logging integration
            sentry_logging = LoggingIntegration(
                level=logging.INFO,  # Capture info and above as breadcrumbs
                event_level=logging.ERROR,  # Send errors as events
            )

            sentry_sdk.init(
                dsn=sentry_dsn,
                integrations=[sentry_logging],
                traces_sample_rate=1.0,  # 100% of transactions for performance monitoring
                profiles_sample_rate=1.0,  # 100% of transactions for profiling
            )
            logger.info("Sentry integration initialized successfully")
        except Exception as e:
            logger.error(f"Failed to initialize Sentry: {e}")
    elif sentry_dsn:
        logger.warning("Sentry DSN provided but sentry-sdk not available")
    else:
        logger.info("Sentry integration not configured (no DSN provided)")

    # Initialize Prometheus integration
    global REQUEST_COUNTER, REQUEST_DURATION_HISTOGRAM, REQUEST_IN_PROGRESS_GAUGE

    if PROMETHEUS_AVAILABLE and prometheus_port:
        try:
            # Create Prometheus metrics
            REQUEST_COUNTER = Counter(
                "youandinotai_http_requests_total",
                "Total HTTP requests",
                ["method", "endpoint", "status_code"],
            )

            REQUEST_DURATION_HISTOGRAM = Histogram(
                "youandinotai_http_request_duration_seconds",
                "HTTP request duration in seconds",
                ["method", "endpoint"],
            )

            REQUEST_IN_PROGRESS_GAUGE = Gauge(
                "youandinotai_http_requests_in_progress",
                "Number of HTTP requests in progress",
            )

            # Start Prometheus metrics server
            start_http_server(prometheus_port)
            logger.info(f"Prometheus metrics server started on port {prometheus_port}")
        except Exception as e:
            logger.error(f"Failed to initialize Prometheus: {e}")
    elif prometheus_port:
        logger.warning("Prometheus port provided but prometheus-client not available")
    else:
        logger.info("Prometheus integration not configured (no port provided)")


# Backward compatibility
setup_error_monitoring = setup_monitoring
