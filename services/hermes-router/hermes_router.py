"""
Hermes Router — OpenAI-compatible HTTP routing service for OpusPawClaw.

Listens on 0.0.0.0:11435 (or HERMES_ROUTER_PORT).
Translates virtual model aliases → real provider + model, proxies to upstream.

Contract: HermesRouterPanel.tsx expects
  GET  /healthz               → {ok: true, providers: [...]}
  POST /v1/chat/completions   → OpenAI response with X-Hermes-Provider and
                                X-Hermes-Real-Model headers.
"""

import logging
import os
from pathlib import Path
from typing import Any

import httpx
import uvicorn
import yaml
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

# ---------------------------------------------------------------------------
# Logging
# ---------------------------------------------------------------------------
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [hermes-router] %(levelname)s  %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
log = logging.getLogger("hermes-router")

# ---------------------------------------------------------------------------
# Config loading
# ---------------------------------------------------------------------------
_DEFAULT_CONFIG = Path(__file__).parent / "config.yaml"


def _load_config() -> dict:
    cfg_path = Path(os.environ.get("HERMES_ROUTER_CONFIG", str(_DEFAULT_CONFIG)))
    if not cfg_path.is_file():
        raise FileNotFoundError(f"Hermes Router config not found: {cfg_path}")
    with cfg_path.open("r", encoding="utf-8") as f:
        data = yaml.safe_load(f)
    return data


_CFG: dict = _load_config()

# Build provider map: name → provider dict
_PROVIDERS: dict[str, dict] = {p["name"]: p for p in _CFG.get("providers", [])}
# Build route map: alias → {provider, model}
_ROUTES: dict[str, dict] = _CFG.get("routes", {})

# ---------------------------------------------------------------------------
# Startup logging
# ---------------------------------------------------------------------------
log.info("=== Hermes Router starting ===")
log.info("Providers:")
for name, prov in _PROVIDERS.items():
    status = "ENABLED" if prov.get("enabled", False) else "disabled"
    log.info("  %-20s %-8s  %s", name, status, prov.get("base_url", ""))
log.info("Routes:")
for alias, route in _ROUTES.items():
    log.info("  %-16s → provider=%-20s model=%s", alias, route.get("provider"), route.get("model"))

# ---------------------------------------------------------------------------
# FastAPI app
# ---------------------------------------------------------------------------
app = FastAPI(title="Hermes Router", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["X-Hermes-Provider", "X-Hermes-Real-Model"],
)


# ---------------------------------------------------------------------------
# Route selector
# ---------------------------------------------------------------------------
def _select_route(model_alias: str) -> tuple[str, str, str, bool, str] | None:
    """
    Returns (provider_name, real_model, base_url, enabled, api_key_env) or None.
    None means alias not found or provider disabled → caller returns 404.
    """
    route = _ROUTES.get(model_alias)
    if route is None:
        return None
    provider_name = route.get("provider", "")
    real_model = route.get("model", model_alias)
    prov = _PROVIDERS.get(provider_name)
    if prov is None:
        return None
    enabled = prov.get("enabled", False)
    base_url = prov.get("base_url", "")
    api_key_env = prov.get("api_key_env", "")
    return (provider_name, real_model, base_url, enabled, api_key_env)


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------

@app.get("/healthz")
async def healthz() -> JSONResponse:
    """Health check — returns provider table.  HermesRouterPanel.tsx polls this."""
    providers_list = [
        {
            "name": p["name"],
            "baseUrl": p.get("base_url", ""),
            "enabled": p.get("enabled", False),
        }
        for p in _CFG.get("providers", [])
    ]
    return JSONResponse({"ok": True, "providers": providers_list})


@app.post("/v1/chat/completions")
async def chat_completions(request: Request) -> JSONResponse:
    """
    OpenAI-compatible chat completions proxy.
    Maps virtual model alias → real provider + model, proxies to upstream.
    Response always carries X-Hermes-Provider and X-Hermes-Real-Model headers.
    """
    try:
        body: dict[str, Any] = await request.json()
    except Exception:
        return JSONResponse(
            {"error": "invalid JSON body"},
            status_code=400,
            headers={"X-Hermes-Provider": "none", "X-Hermes-Real-Model": "none"},
        )

    model_alias: str = body.get("model", "")
    result = _select_route(model_alias)

    if result is None:
        log.warning("Unknown or disabled model alias: %r", model_alias)
        return JSONResponse(
            {"error": "unknown or disabled model alias"},
            status_code=404,
            headers={"X-Hermes-Provider": "none", "X-Hermes-Real-Model": "none"},
        )

    provider_name, real_model, base_url, enabled, api_key_env = result

    if not enabled:
        log.warning("Provider %r is disabled (alias=%r)", provider_name, model_alias)
        return JSONResponse(
            {"error": "unknown or disabled model alias"},
            status_code=404,
            headers={"X-Hermes-Provider": provider_name, "X-Hermes-Real-Model": real_model},
        )

    # Build upstream request
    upstream_url = base_url.rstrip("/") + "/chat/completions"
    upstream_body = dict(body)
    upstream_body["model"] = real_model

    headers: dict[str, str] = {"Content-Type": "application/json"}
    if api_key_env:
        api_key = os.environ.get(api_key_env, "")
        if api_key:
            headers["Authorization"] = f"Bearer {api_key}"

    log.info(
        "Routing alias=%r → provider=%r model=%r  url=%s",
        model_alias,
        provider_name,
        real_model,
        upstream_url,
    )

    try:
        async with httpx.AsyncClient(timeout=120.0) as client:
            upstream_resp = await client.post(
                upstream_url,
                json=upstream_body,
                headers=headers,
            )
        content_type = upstream_resp.headers.get("content-type", "application/json")
        return JSONResponse(
            content=upstream_resp.json(),
            status_code=upstream_resp.status_code,
            headers={
                "X-Hermes-Provider": provider_name,
                "X-Hermes-Real-Model": real_model,
                "Content-Type": content_type,
            },
        )
    except httpx.TimeoutException as exc:
        log.error("Upstream timeout provider=%r: %s", provider_name, exc)
        return JSONResponse(
            {"error": f"upstream timeout: {exc}", "provider": provider_name},
            status_code=502,
            headers={"X-Hermes-Provider": provider_name, "X-Hermes-Real-Model": real_model},
        )
    except Exception as exc:
        log.error("Upstream error provider=%r: %s", provider_name, exc)
        return JSONResponse(
            {"error": str(exc), "provider": provider_name},
            status_code=502,
            headers={"X-Hermes-Provider": provider_name, "X-Hermes-Real-Model": real_model},
        )


# ---------------------------------------------------------------------------
# Entry point
# ---------------------------------------------------------------------------
if __name__ == "__main__":
    port = int(os.environ.get("HERMES_ROUTER_PORT", "11435"))
    log.info("Binding 0.0.0.0:%d", port)
    uvicorn.run("hermes_router:app", host="0.0.0.0", port=port, log_level="info")
