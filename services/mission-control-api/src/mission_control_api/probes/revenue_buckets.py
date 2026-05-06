import asyncio
from ..config import settings
from ..envelope import make_envelope

# Validate on import
if settings.RESERVE_PERCENT != 10:
    raise RuntimeError(f"RESERVE_PERCENT must be 10, got {settings.RESERVE_PERCENT}")

async def revenue_buckets_probe():
    details = {
        "reserve_percent": settings.RESERVE_PERCENT,
        "buckets": [
            {"label": f"Bucket {i}", "percent": 10} for i in range(1, 11)
        ]
    }
    return make_envelope("ok", 0, details)
