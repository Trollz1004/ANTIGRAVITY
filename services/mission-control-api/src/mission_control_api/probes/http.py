import asyncio

import httpx

from ..envelope import make_envelope


async def http_probe(url: str, timeout: float = 2.5):
    start = asyncio.get_event_loop().time()
    try:
        async with httpx.AsyncClient(timeout=timeout) as client:
            resp = await client.get(url)
        latency = int((asyncio.get_event_loop().time() - start) * 1000)
        status = "ok" if resp.status_code == 200 else "degraded"
        details = {
            "status_code": resp.status_code,
            "url": url,
        }
        ctype = resp.headers.get("content-type", "")
        if "application/json" in ctype:
            try:
                details["json"] = resp.json()
            except Exception as je:
                details["body_preview"] = resp.text[:500]
                details["json_parse_error"] = type(je).__name__ + ": " + str(je)
        else:
            details["body_preview"] = resp.text[:500]
            details["content_type"] = ctype
        return make_envelope(status, latency, details)
    except Exception as e:
        latency = int((asyncio.get_event_loop().time() - start) * 1000)
        # NEVER swallow the error — surface class + message + url so the dashboard
        # shows the real failure (DNS / refused / TLS / timeout / 401 / etc.)
        err_class = type(e).__name__
        err_msg = str(e) or repr(e) or "<empty exception>"
        return make_envelope(
            "unreachable",
            latency,
            {"url": url, "error_class": err_class},
            error=f"{err_class}: {err_msg}",
        )
