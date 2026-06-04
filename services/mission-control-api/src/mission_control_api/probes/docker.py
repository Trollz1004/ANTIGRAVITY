import asyncio
from .shell import shell_probe

async def docker_probe():
    return await shell_probe("docker ps --format '{\"id\":\"{{.ID}}\",\"image\":\"{{.Image}}\",\"status\":\"{{.Status}}\"}'")
