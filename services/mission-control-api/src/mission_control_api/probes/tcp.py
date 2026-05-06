import asyncio
from ..envelope import make_envelope

async def tcp_probe(host: str, port: int, timeout: float = 2.0):
    start = asyncio.get_event_loop().time()
    try:
        reader, writer = await asyncio.wait_for(asyncio.open_connection(host, port), timeout)
        writer.close()
        await writer.wait_closed()
        latency = int((asyncio.get_event_loop().time() - start) * 1000)
        return make_envelope("ok", latency, {"host": host, "port": port})
    except Exception as e:
        latency = int((asyncio.get_event_loop().time() - start) * 1000)
        return make_envelope("unreachable", latency, {}, error=str(e))
