import asyncio
from typing import Optional
from ..envelope import make_envelope


async def shell_probe(command: str, timeout: float = 5.0, cwd: Optional[str] = None):
    start = asyncio.get_event_loop().time()
    try:
        proc = await asyncio.create_subprocess_shell(
            command,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE,
            cwd=cwd,
        )
        try:
            stdout, stderr = await asyncio.wait_for(proc.communicate(), timeout)
        except asyncio.TimeoutError:
            proc.kill()
            await proc.communicate()
            raise
        latency = int((asyncio.get_event_loop().time() - start) * 1000)
        status = "ok" if proc.returncode == 0 else "degraded"
        details = {
            "returncode": proc.returncode,
            "stdout": stdout.decode(errors="ignore"),
            "stderr": stderr.decode(errors="ignore"),
        }
        return make_envelope(status, latency, details)
    except Exception as e:
        latency = int((asyncio.get_event_loop().time() - start) * 1000)
        return make_envelope("unreachable", latency, {}, error=str(e))
