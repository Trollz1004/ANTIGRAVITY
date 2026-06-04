import asyncio
from datetime import datetime, timezone

from .tcp import tcp_probe
from ..envelope import make_envelope, Envelope

T5500_HOST = "192.168.0.15"

T5500_SERVICES = [
    {"name": "postgres", "port": 5432, "label": "uandinotai-postgres"},
    {"name": "qdrant", "port": 6333, "label": "qdrant vectors"},
    {"name": "redis", "port": 6379, "label": "redis cache"},
    {"name": "openclaw_api", "port": 3200, "label": "OpenClaw API"},
]


async def t5500_postgres_probe() -> Envelope:
    env = await tcp_probe(T5500_HOST, 5432)
    if env.status == "ok":
        env.details.update({"label": "uandinotai-postgres", "service": "postgres"})
    return env


async def t5500_qdrant_probe() -> Envelope:
    env = await tcp_probe(T5500_HOST, 6333)
    if env.status == "ok":
        env.details.update({"label": "qdrant vectors", "service": "qdrant"})
    return env


async def t5500_redis_probe() -> Envelope:
    env = await tcp_probe(T5500_HOST, 6379)
    if env.status == "ok":
        env.details.update({"label": "redis cache", "service": "redis"})
    return env


async def t5500_openclaw_probe() -> Envelope:
    env = await tcp_probe(T5500_HOST, 3200)
    if env.status == "ok":
        env.details.update({"label": "OpenClaw API", "service": "openclaw_api"})
    return env


async def t5500_stack_probe() -> Envelope:
    started = datetime.now(timezone.utc)
    coros = {
        "postgres": tcp_probe(T5500_HOST, 5432),
        "qdrant": tcp_probe(T5500_HOST, 6333),
        "redis": tcp_probe(T5500_HOST, 6379),
        "openclaw_api": tcp_probe(T5500_HOST, 3200),
    }
    results = await asyncio.gather(*coros.values())
    services = []
    ok_count = 0
    for (name, _), env in zip(coros.items(), results):
        services.append(
            {
                "service": name,
                "status": env.status,
                "port": next(s["port"] for s in T5500_SERVICES if s["name"] == name),
                "latency_ms": env.latency_ms,
                "error": env.error,
            }
        )
        if env.status == "ok":
            ok_count += 1
    finished = datetime.now(timezone.utc)
    overall = "ok" if ok_count == len(services) else "degraded" if ok_count > 0 else "unreachable"
    return make_envelope(
        overall,
        int((finished - started).total_seconds() * 1000),
        {"host": T5500_HOST, "services": services, "ok": ok_count, "total": len(services)},
    )
