import asyncio
import httpx
from ..envelope import make_envelope

async def http_probe(url: str, timeout: float = 2.0):
    start = asyncio.get_event_loop().time()
    try:
        async with httpx.AsyncClient(timeout=timeout) as client:
            resp = await client.get(url)
        latency = int((asyncio.get_event_loop().time() - start) * 1000)
        status = "ok" if resp.status_code == 200 else "degraded"
        details = {"status_code": resp.status_code, "json": resp.json() if "application/json" in resp.headers.get("content-type", "") else resp.text}
        return make_envelope(status, latency, details)
    except Exception as e:
        latency = int((asyncio.get_event_loop().time() - start) * 1000)
        return make_envelope("unreachable", latency, {}, error=str(e))
