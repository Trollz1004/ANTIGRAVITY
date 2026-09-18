"""Compatibility helpers for tests and legacy imports.

The live middleware is Redis-backed (`rate_limit_redis.py`). Older benchmark
fixtures still import `reset_rate_limits`; keep that reset scoped to in-process
dashboard counters so tests can isolate request statistics without touching
Redis.
"""

import time
from collections import defaultdict

from app.routers import rate_limits


def reset_rate_limits() -> None:
    """Reset in-process rate-limit statistics used by dashboard tests."""
    rate_limits._request_counts = defaultdict(int)
    rate_limits._requests_this_minute = 0
    rate_limits._total_today = 0
    rate_limits._window_start = time.time()
    rate_limits._day_start = time.time()
