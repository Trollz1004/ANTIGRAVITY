from __future__ import annotations

import socket
import ssl
from datetime import datetime, timezone
from urllib.parse import urlparse

import httpx

from ..config import PUBLIC_SURFACES
from ..status import Check


def _cert_days(host: str) -> int | None:
    try:
        context = ssl.create_default_context()
        with socket.create_connection((host, 443), timeout=4) as sock:
            with context.wrap_socket(sock, server_hostname=host) as wrapped:
                cert = wrapped.getpeercert()
        expires = datetime.strptime(cert["notAfter"], "%b %d %H:%M:%S %Y %Z").replace(tzinfo=timezone.utc)
        return (expires - datetime.now(timezone.utc)).days
    except Exception:
        return None


def probe_pages() -> list[Check]:
    checks: list[Check] = []
    for url in PUBLIC_SURFACES:
        host = urlparse(url).hostname or url
        try:
            response = httpx.get(url, timeout=8, follow_redirects=True)
            days = _cert_days(host)
            ok = response.status_code == 200 and (days is not None and days > 30)
            status = "green" if ok else "yellow" if response.status_code == 200 else "red"
            checks.append(Check(host, status, f"HTTP {response.status_code}", {"cert_days_remaining": days}))
        except httpx.HTTPError as exc:
            checks.append(Check(host, "red", "HTTP probe failed", {"error": str(exc)}))
    checks.append(Check("paperweight", "yellow", "pending scaffold", {}))
    return checks
