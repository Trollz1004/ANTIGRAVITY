import asyncio
from .http import http_probe

async def youandinotai_site_probe():
    return await http_probe("https://youandinotai.com/")

async def api_youandinotai_probe():
    return await http_probe("https://api.youandinotai.com/health")
