"""Performance benchmarks for the /api/health endpoint."""

import pytest
from fastapi.testclient import TestClient

from tests.benchmarks.utils import assert_slo, measure_latency


@pytest.mark.parametrize("n_requests", [100])
def test_health_endpoint_latency(benchmark_client: TestClient, n_requests: int):
    """Benchmark GET /api/health to ensure it meets latency SLOs."""
    print(f"\nBenchmarking GET /api/health with {n_requests} requests...")
    stats = measure_latency(benchmark_client, "GET", "/api/health", n=n_requests)

    print(f"Health Endpoint Latency (n={n_requests}):")
    print(f"  p50: {stats['p50']:.2f} ms")
    print(f"  p95: {stats['p95']:.2f} ms")
    print(f"  p99: {stats['p99']:.2f} ms")
    print(f"  Mean: {stats['mean']:.2f} ms")
    print(f"  Min: {stats['min']:.2f} ms")
    print(f"  Max: {stats['max']:.2f} ms")

    violations = assert_slo(
        stats, "/api/health", p50_limit=50.0, p95_limit=50.0, p99_limit=100.0
    )

    assert not violations, "\n".join(violations)
