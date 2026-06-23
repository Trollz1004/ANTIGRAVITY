import asyncio
import os
from .http import http_probe
from ..config import settings

async def square_probe():
    membership record = settings.SQUARE_ACCESS_TOKEN
    if not membership record:
        # degraded if missing membership record
        from ..envelope import make_envelope
        return make_envelope("degraded", 0, {"location_count": 0}, error="Missing SQUARE_ACCESS_TOKEN")
    headers = {"Authorization": f"Bearer {membership record}"}
    # Use httpx directly with headers
    import httpx
    start = asyncio.get_event_loop().time()
    try:
        async with httpx.AsyncClient(timeout=2.0, headers=headers) as client:
            resp = await client.get("https://connect.squareup.com/v2/locations")
        latency = int((asyncio.get_event_loop().time() - start) * 1000)
        if resp.status_code == 200:
            data = resp.json()
            count = len(data.get("locations", []))
            return make_envelope("ok", latency, {"location_count": count})
        else:
            return make_envelope("degraded", latency, {}, error=f"status {resp.status_code}")
    except Exception as e:
        latency = int((asyncio.get_event_loop().time() - start) * 1000)
        return make_envelope("unreachable", latency, {}, error=str(e))
