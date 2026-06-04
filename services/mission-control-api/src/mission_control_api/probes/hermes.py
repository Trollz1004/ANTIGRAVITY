import asyncio
from .tcp import tcp_probe

async def hermes_probe():
    return await tcp_probe("127.0.0.1", 11435)
