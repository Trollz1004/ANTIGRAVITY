"""Simple test to verify monitoring and logging functionality."""

import logging
import sys
from app.logging_config import setup_logging, JSONFormatter
from app.monitoring import MetricsCollector, setup_monitoring


def test_logging():
    """Test structured logging functionality."""
    print("Testing structured logging...")

    # Setup logging
    setup_logging(level="DEBUG")

    # Get logger
    logger = logging.getLogger("test")

    # Test logging with extra fields
    logger.info(
        "Test message with extra fields",
        extra={"user_id": "123", "action": "test_action"},
    )

    print("Logging test completed successfully!")


def test_metrics():
    """Test metrics collection functionality."""
    print("Testing metrics collection...")

    # Create metrics collector
    collector = MetricsCollector()

    # Test counter
    collector.increment_counter("test_counter", 5)
    assert collector.counters["test_counter"] == 5

    # Test timer
    collector.record_timer("test_timer", 1.5)
    assert collector.timers["test_timer"] == 1.5

    # Test histogram
    collector.record_histogram("test_histogram", 10.0)
    collector.record_histogram("test_histogram", 20.0)
    assert len(collector.histograms["test_histogram"]) == 2

    print("Metrics test completed successfully!")


def test_monitoring_setup():
    """Test monitoring setup functionality."""
    print("Testing monitoring setup...")

    # This should not raise any exceptions
    setup_monitoring()

    print("Monitoring setup test completed successfully!")


if __name__ == "__main__":
    print("Running monitoring and logging tests...")
    test_logging()
    test_metrics()
    test_monitoring_setup()
    print("All tests passed!")
