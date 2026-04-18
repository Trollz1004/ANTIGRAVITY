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
    from prometheus_client import Counter, Histogram, Gauge, start_http_server

    PROMETHEUS_AVAILABLE = True
except ImportError:
    PROMETHEUS_AVAILABLE = False
    Counter = Histogram = Gauge = start_http_server = None

logger = logging.getLogger("youandinotai.monitoring")


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


# Placeholder for Sentry/Prometheus integration
def setup_monitoring() -> None:
    """Initialize monitoring integrations.

    This function sets up stubs for Sentry and Prometheus integration
    that can be implemented when ready.
    """
    logger.info("Setting up monitoring infrastructure")

    # Placeholder for Sentry initialization
    try:
        # This would be: import sentry_sdk; sentry_sdk.init(dsn=SENTRY_DSN)
        logger.info("Sentry integration stubbed - ready for implementation")
    except ImportError:
        logger.info("Sentry SDK not available - skipping integration")

    # Placeholder for Prometheus integration
    try:
        # This would be: from prometheus_client import start_http_server
        logger.info("Prometheus integration stubbed - ready for implementation")
    except ImportError:
        logger.info("Prometheus client not available - skipping integration")


# Backward compatibility
setup_error_monitoring = setup_monitoring
