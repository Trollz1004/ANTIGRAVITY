# OmniRouter Runtime Plan

OmniRouter is the local API routing and token-saving layer.

## Purpose

- Route worker requests to lower-cost/local providers first.
- Keep Codex/Opus-level decision work on high-capability models.
- Give long-running sessions a failover path through subagents and worker
  providers when a 5-hour cap or usage limit is hit.
- Avoid leaking provider keys into prompts, logs, or repo files.

## Runtime

- Service: `services/omni-router`
- Start script: `scripts/start-omni-router.ps1`
- Default local URL: `http://127.0.0.1:11436`
- Health: `GET /health`
- Route preview: `POST /route`
- OpenAI-compatible chat proxy: `POST /v1/chat/completions`

Proxying is disabled unless `OMNI_ROUTER_PROXY_ENABLED=1` is set in the process
environment. Provider keys must come from local machine environment variables or
private node handoff files, never repo files.

## Provider Policy

- `cost_saver`: local/free/cheap first: Ollama, FCC, NVIDIA, OpenRouter, OpenAI.
- `decision`: high capability first: OpenAI, OpenRouter, xAI, NVIDIA, FCC,
  Ollama.
- `provider/model`: exact provider override, for example
  `openrouter/openai/gpt-5.5` or `ollama/minimax-m2.5:cloud`.

Lower-capability worker routes return evidence and drafts. Codex/Opus-level
lanes remain responsible for decisions about doctrine, payments, public copy,
merge/push flow, production roles, and launch gates.
