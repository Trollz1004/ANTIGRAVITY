from __future__ import annotations

import httpx

from ..status import Check
from .common import tcp_open


T5500 = "192.168.0.15"


def probe_t5500_services() -> list[Check]:
    checks: list[Check] = []
    for name, port in (
        ("uandinotai-postgres", 5432),
        ("qdrant-http", 6333),
        ("qdrant-grpc", 6334),
        ("redis", 6379),
    ):
        ok = tcp_open(T5500, port)
        checks.append(Check(name, "green" if ok else "red", f"tcp {T5500}:{port}", {"open": ok}))

    try:
        response = httpx.get(f"http://{T5500}:3200/health", timeout=3)
        status = "green" if response.status_code < 500 else "red"
        checks.append(Check("openclaw-api", status, f"HTTP {response.status_code}", {"url": f"http://{T5500}:3200/health"}))
    except httpx.HTTPError as exc:
        checks.append(Check("openclaw-api", "red", "health endpoint failed", {"error": str(exc)}))
    return checks
