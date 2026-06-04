import asyncio
from .http import http_probe

async def openclaw_probe():
    return await http_probe("http://127.0.0.1:18789/")
