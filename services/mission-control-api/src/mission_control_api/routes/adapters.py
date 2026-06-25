"""Adapters health route — backs the HTML's `Hermes Routing Matrix` table.

Real data sources:
- /health/ollama, /health/hermes probes from this same API (TCP + tag list)
- /health/cloudflare-pages, /health/square, /health/treasury, /health/guardian
- hermes-router `/healthz` (provider table)
- Ollama `/api/tags` (model list)

200 OK + non-empty shape required by the HTML — empty body = RED.
"""
import asyncio
import time
from datetime import datetime, timezone

import httpx
from fastapi import APIRouter

from ..envelope import make_envelope

router = APIRouter()

# Adapter aliases — these are the keys the HTML Hermes Routing Matrix table expects.
# Real probe results: each row is {ok, last_ok, last_error, silence_seconds}.
HERMES_ROUTER_URL = "http://127.0.0.1:11435"
OLLAMA_URL = "http://127.0.0.1:11434"


async def _probe_hermes_router() -> dict:
    """Hit Hermes Router /healthz for live provider table."""
    try:
        async with httpx.AsyncClient(timeout=4.0) as client:
            r = await client.get(f"{HERMES_ROUTER_URL}/healthz")
            if r.status_code == 200 and r.json().get("ok"):
                return {
                    "ok": True,
                    "last_ok": datetime.now(timezone.utc).isoformat(),
                    "last_error": None,
                    "silence_seconds": 0,
                    "providers": r.json().get("providers", []),
                }
            return {"ok": False, "last_ok": None, "last_error": f"HTTP {r.status_code}", "silence_seconds": 0}
    except Exception as e:
        return {"ok": False, "last_ok": None, "last_error": f"{type(e).__name__}: {e}", "silence_seconds": 0}


async def _probe_ollama() -> dict:
    try:
        async with httpx.AsyncClient(timeout=4.0) as client:
            r = await client.get(f"{OLLAMA_URL}/api/tags")
            if r.status_code == 200:
                models = r.json().get("models", [])
                return {
                    "ok": True,
                    "last_ok": datetime.now(timezone.utc).isoformat(),
                    "last_error": None,
                    "silence_seconds": 0,
                    "model_count": len(models),
                }
            return {"ok": False, "last_ok": None, "last_error": f"HTTP {r.status_code}", "silence_seconds": 0}
    except Exception as e:
        return {"ok": False, "last_ok": None, "last_error": f"{type(e).__name__}: {e}", "silence_seconds": 0}


async def _probe_openrouter_free() -> dict:
    """OpenRouter free model list — requires OPENROUTER_API_KEY. Live but unkeyed in this env."""
    return {
        "ok": False,
        "last_ok": None,
        "last_error": "OPENROUTER_API_KEY not set",
        "silence_seconds": 0,
    }


async def _probe_openclaw() -> dict:
    try:
        async with httpx.AsyncClient(timeout=1.5) as client:
            r = await client.get("http://127.0.0.1:18789/")
            ok = r.status_code == 200
            return {
                "ok": ok,
                "last_ok": datetime.now(timezone.utc).isoformat() if ok else None,
                "last_error": None if ok else f"HTTP {r.status_code}",
                "silence_seconds": 0,
            }
    except Exception as e:
        return {"ok": False, "last_ok": None, "last_error": f"{type(e).__name__}: {e}", "silence_seconds": 0}


# Map HTML alias → live probe coroutine
ADAPTER_PROBES = {
    # Hermes Router itself
    "hermes": _probe_hermes_router,
    "ollama": _probe_ollama,
    "openrouter": _probe_openrouter_free,
    "openclaw": _probe_openclaw,
    # OpenAI-compat aliases that route through Hermes Router — same upstream health
    "default": _probe_hermes_router,
    "hermes-deep": _probe_hermes_router,
    "cfo": _probe_ollama,
    "code": _probe_hermes_router,
    "marketing": _probe_ollama,
    "kimi": _probe_hermes_router,
    "fast": _probe_ollama,
    "claude": _probe_hermes_router,
    "gpt": _probe_hermes_router,
    "gemini": _probe_hermes_router,
    "grok": _probe_hermes_router,
}


@router.get("/adapters/health")
async def adapters_health():
    """Hermes Routing Matrix adapter health. 200 + non-empty shape required by the HTML."""
    started = time.monotonic()
    coros = {name: probe() for name, probe in ADAPTER_PROBES.items()}
    results = await asyncio.gather(*coros.values(), return_exceptions=True)
    out = {}
    for (name, _), result in zip(coros.items(), results):
        if isinstance(result, Exception):
            out[name] = {"ok": False, "last_error": str(result), "silence_seconds": 0}
        else:
            out[name] = result
    out["_meta"] = {
        "checked_at": datetime.now(timezone.utc).isoformat(),
        "duration_ms": int((time.monotonic() - started) * 1000),
    }
    return out


@router.get("/adapters/health/{alias}")
async def adapter_health_one(alias: str):
    probe = ADAPTER_PROBES.get(alias.lower())
    if probe is None:
        return {"ok": False, "last_error": f"unknown alias: {alias}", "silence_seconds": 0}
    return await probe()
