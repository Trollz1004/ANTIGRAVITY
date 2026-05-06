import asyncio
from .http import http_probe

async def paperclip_probe():
    return await http_probe("http://127.0.0.1:3100/api/health")
