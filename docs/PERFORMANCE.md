# Performance Benchmarks

## Overview

The ANTIGRAVITY platform includes a performance benchmark suite that measures API endpoint latency and validates against defined SLOs (Service Level Objectives). Benchmarks run as pytest tests in `backend/fastapi-app/tests/benchmarks/`.

## SLO Definitions

| Endpoint Type | p50 Target | p95 Target | p99 Target |
|---------------|-----------|-----------|-----------|
| Health check | < 10ms | < 50ms | < 100ms |
| Auth endpoints | < 50ms | < 200ms | < 500ms |
| Read (GET list) | < 50ms | < 200ms | < 500ms |
| Read (GET detail) | < 30ms | < 100ms | < 200ms |
| Write (POST/PUT) | < 100ms | < 300ms | < 500ms |

## Running Benchmarks

### Run all benchmarks
```bash
cd backend/fastapi-app
python -m pytest tests/benchmarks/ -v
```

### Run with JSON report
```bash
./scripts/run-benchmarks.sh http://localhost:8000
```

### Run specific benchmark
```bash
python -m pytest tests/benchmarks/test_health_benchmark.py -v
```

## Benchmark Structure

```
tests/benchmarks/
├── __init__.py
├── conftest.py          # Shared fixtures and test client setup
├── utils.py             # Latency measurement helpers
├── test_health_benchmark.py
├── test_auth_benchmark.py
├── test_posts_benchmark.py
└── test_events_benchmark.py
```

## Interpreting Results

- **PASS**: All latency percentiles are within SLO thresholds
- **FAIL**: At least one percentile exceeds the threshold
- Results include p50, p95, p99, mean, min, max latency measurements

## Historical Tracking

Benchmark results are output as JSON for historical comparison. Store results in `benchmark-results/` for trend analysis.

## Performance Optimization Tips

1. **Database queries**: Use `selectinload` for relationships to avoid N+1 queries
2. **Response caching**: Use the Redis caching layer (see `docs/CACHING.md`)
3. **Connection pooling**: Ensure database connection pool is properly configured
4. **Compression**: Enable gzip middleware for responses > 1KB
5. **Pagination**: Always paginate list endpoints to limit response size
