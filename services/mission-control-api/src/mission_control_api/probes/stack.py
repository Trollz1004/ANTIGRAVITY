import asyncio
from .guardian import guardian_probe

async def stack_probe():
    # Reuse guardian output
    return await guardian_probe()
