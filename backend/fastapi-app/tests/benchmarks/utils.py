"""Benchmark utility functions for latency measurement and statistical analysis."""

import time
import statistics
from typing import Any

from fastapi.testclient import TestClient


def measure_latency(
    client: TestClient,
    method: str,
    url: str,
    n: int = 100,
    **kwargs: Any,
) -> dict[str, float]:
    """Measure latency statistics for an endpoint over N sequential requests.

    Args:
        client: FastAPI TestClient instance.
        method: HTTP method (e.g., 'GET', 'POST').
        url: Endpoint URL path.
        n: Number of requests to issue.
        **kwargs: Additional kwargs passed to the client request.

    Returns:
        Dict with p50, p95, p99, mean, min, max latencies in milliseconds.
    """
    latencies: list[float] = []
    client_func = getattr(client, method.lower())

    for _ in range(n):
        start = time.perf_counter()
        response = client_func(url, **kwargs)
        elapsed_ms = (time.perf_counter() - start) * 1000
        latencies.append(elapsed_ms)

    latencies.sort()
    return {
        "p50": _percentile(latencies, 50),
        "p95": _percentile(latencies, 95),
        "p99": _percentile(latencies, 99),
        "mean": statistics.mean(latencies),
        "min": latencies[0],
        "max": latencies[-1],
        "n": n,
    }


def _percentile(sorted_data: list[float], percentile: float) -> float:
    """Compute the given percentile from a sorted list of values.

    Uses linear interpolation between closest ranks.
    """
    if not sorted_data:
        return 0.0
    n = len(sorted_data)
    rank = (percentile / 100) * (n - 1)
    lower = int(rank)
    upper = min(lower + 1, n - 1)
    fraction = rank - lower
    return sorted_data[lower] + fraction * (sorted_data[upper] - sorted_data[lower])


def assert_slo(
    stats: dict[str, float],
    slo_name: str,
    p50_limit: float | None = None,
    p95_limit: float | None = None,
    p99_limit: float | None = None,
) -> list[str]:
    """Assert latency percentiles against SLO limits.

    Returns a list of violation messages (empty if all pass).
    """
    violations: list[str] = []
    if p50_limit is not None and stats["p50"] > p50_limit:
        violations.append(
            f"{slo_name} p50 {stats['p50']:.1f}ms exceeds {p50_limit}ms"
        )
    if p95_limit is not None and stats["p95"] > p95_limit:
        violations.append(
            f"{slo_name} p95 {stats['p95']:.1f}ms exceeds {p95_limit}ms"
        )
    if p99_limit is not None and stats["p99"] > p99_limit:
        violations.append(
            f"{slo_name} p99 {stats['p99']:.1f}ms exceeds {p99_limit}ms"
        )
    return violations
