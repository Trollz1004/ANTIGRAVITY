import asyncio
from .shell import shell_probe

async def cloudflare_probe():
    return await shell_probe("wrangler pages project list --json")
