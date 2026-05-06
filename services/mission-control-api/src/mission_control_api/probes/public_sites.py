import asyncio
from .http import http_probe

async def youandinotai_site_probe():
    return await http_probe("https://youandinotai.com/")

async def api_youandinotai_probe():
    # GCR backend: no /health endpoint. Check API root — returns 200 or redirects.
    return await http_probe("https://api.youandinotai.com/")
