# Hermes Router

Long-running Python HTTP service on `localhost:11435`.
**Not part of paperclip.** Separate process, separate config.

## What it does

Accepts OpenAI-compatible requests with virtual model aliases (`hermes`, `hermes-deep`,
`cfo`, `code`, `marketing`, `kimi`, `fast`) and proxies them to the real provider + model
defined in `config.yaml`. Response headers `X-Hermes-Provider` and `X-Hermes-Real-Model`
tell the caller which provider and model actually handled the request.

## Port

`11435` — this is what `HermesRouterPanel.tsx` in OpusPawClaw polls.
LiteLLM was moved to `11436` to vacate this port.

## Install

```bash
cd services/hermes-router
python -m venv .venv
.venv/bin/pip install -r requirements.txt
```

On Windows with WSL use `scripts/start-hermes-router.sh` (or the `.cmd` launcher).

## Run

```bash
python hermes_router.py
# or
.venv/bin/uvicorn hermes_router:app --host 0.0.0.0 --port 11435
```

Override port: `HERMES_ROUTER_PORT=11436 python hermes_router.py`
Override config: `HERMES_ROUTER_CONFIG=/path/to/config.yaml python hermes_router.py`

## Contract (HermesRouterPanel.tsx)

| Endpoint | Method | Response |
|---|---|---|
| `/healthz` | GET | `{"ok": true, "providers": [{name, baseUrl, enabled}]}` |
| `/v1/chat/completions` | POST | OpenAI response + `X-Hermes-Provider` + `X-Hermes-Real-Model` headers |

Error responses include `X-Hermes-Provider` so the panel knows which provider failed.
Unknown/disabled aliases return 404 with `{"error": "unknown or disabled model alias"}`.

## Config

Edit `config.yaml` to enable/disable providers or change model mappings.
Toggle `anthropic` or `openrouter` on by setting `enabled: true` and the corresponding
API key env var (`ANTHROPIC_API_KEY`, `OPENROUTER_API_KEY`).
