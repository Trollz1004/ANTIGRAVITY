# Paperclip agent status — clean repo

Updated: 2026-07-21 (TRO-1 ✅ TRO-2 ✅ TRO-3 ✅ TRO-4 ✅ — TRO-6/TRO-7 🏗️ TRO-8/TRO-9 📋)

## Instance

- Public URL: https://paperclip-clean.youandinotai.com
- Health: `/api/health` returns `status: ok`
- Company: `Trollz1004/clean repo`
- Company ID: `c0e28d64-40f6-497f-bbbe-ec287a7012cc`
- Repo: https://github.com/Trollz1004/clean
- Branch policy: `main` only

## Agents

| Agent | Role | Adapter | Model | Status |
|-------|------|---------|-------|--------|
| CEO | ceo | hermes_local | minimax-m3:cloud | paused |
| Hermes Local CEO Adapter | ceo | hermes_local | — | paused |
| CEO-OpenRouter Free Models via OpenCode | general | opencode_local | opencode/deepseek-v4-flash-free | **running** |
| Hermes CEO - clean repo OpenClaw Gateway | general | openclaw_gateway | — | paused |
| OpenCode Self-Hosted Models | general | opencode_local | opencode/big-pickle | paused |
| Founding Engineer | founding_engineer | opencode_local | opencode/deepseek-v4-flash-free | **running** |

## Recurring Agent Routines

Cadence for the `running` agents above (CEO-OpenRouter/OpenCode, Founding
Engineer). Full maintenance routines (health-check script, schtasks
registration) live in `ops/PAPERCLIP-ROUTINES.md` — this section is just the
agent-side cadence.

**Daily**
- Founding Engineer: pick up the next open item under TRO-6/TRO-7, commit in
  small increments to `main` (one branch policy — no feature branches),
  evidence (file path / command output) required before marking anything
  done.
- CEO agent: update the "Updated:" line and TRO checklist at the top of this
  file with real status — not a restated plan.
- Either agent, on a hard failure (dependency down, adapter erroring, not
  just quota-reserved): write a dated snapshot
  `ops/PAPERCLIP-STATUS-YYYY-MM-DD.md` rather than retrying silently or
  leaving it unlogged.

**Weekly**
- Adapter sweep: one cheap test call per API-key adapter (anthropic, openai,
  google, xai, openrouter) to confirm the key still authenticates; recheck
  `ollama-cloud` billing status.
- Dependency sweep: confirm OmniRoute (:20128), Ollama (:11434), OpenClaw
  (:18789), and the Cloudflare tunnel (`hermes-t5500`) are all up.
- Log rotation: trim `logs/failsafe/*.log` to the last 14 days; do not
  delete anything referencing an unresolved failure first.

## Adaptor Status (as of 2026-07-21)

### Working (API-key providers)

| Adaptor | Provider | Auth | Status |
|---------|----------|------|--------|
| anthropic | Anthropic Claude | API key (GitHub secret `ANTHROPIC_API_KEY`) | OK |
| openai | OpenAI | API key (GitHub secret `OPENAI_API_KEY`) | OK |
| google | Google Gemini | API key (GitHub secret `GEMINI_API_KEY`) | OK |
| xai | xAI Grok | API key (GitHub secret `XAI_API_KEY`) | OK |
| openrouter | OpenRouter free models | API key (GitHub secret `OPENROUTER_API_KEY`) | OK |

### Working (free / local)

| Adaptor | Provider | Auth | Status |
|---------|----------|------|--------|
| ollama-local | Local Ollama (19 models) | None needed | OK |
| opencode | OpenCode Zen free models (built-in) | None needed | **NEW — OK** |
| omniroute | OmniRoute proxy on :20128 (combo routes) | None needed | **NEW — OK** |

### Blocked

| Adaptor | Provider | Blocker | Fix Required |
|---------|----------|---------|--------------|
| ollama-cloud | Ollama Cloud | Billing past due | Josh: update payment at https://ollama.com/settings/billing |
| hermes-router | Hermes Router | Not running (port 11435) | Start Hermes Router service |

## Local Models (available now via ollama-local)

- `qwen2.5:7b` (7.6B) — primary code writer
- `qwen3.5:latest` (9.7B) — general purpose
- `gemma4:latest` (8B) — fast inference
- `gemma2:latest` (9.2B) — solid all-rounder
- `llama3.2:latest` (3B) — lightweight
- `llama2:13b` (13B) — largest local
- `nomic-embed-text:latest` (137M) — embeddings
- `joshlcoleman/CFO-Until-No-Kid-In-Need:latest` (3.2B) — fine-tuned

### Cloud Models (via Ollama local proxy)

- `kimi-k2.7-code:cloud` — Kimi K2.7 Code
- `qwen3.5:397b-cloud` — Qwen 3.5 397B
- `gemma4:31b-cloud` — Gemma 4 31B
- `minimax-m3:cloud` — MiniMax M3
- `gemini-3-flash-preview:latest` — Gemini 3 Flash
- `deepseek-v3.1:671b-cloud` — DeepSeek V3.1 671B

## OpenCode Zen Free Models (via opencode provider)

| ID | Notes |
|----|-------|
| `deepseek-v4-flash-free` | Primary — 1M ctx |
| `big-pickle` | OpenCode's largest free |
| `minimax-m3-free` | MiniMax M3 free tier |
| `qwen3.6-plus-free` | Qwen 3.6 Plus |
| `nemotron-3-super-free` | Nemotron 3 Super |
| `north-mini-code-free` | Coding-optimized |
| `mimo-v2.5-free` | MiMo V2.5 |
| `ling-2.6-1t-free` | Ling 2.6 1T |

## OmniRoute Proxy (omniroute, on :20128)

Running since 2026-07-21. Exposes 90+ routes including:
- `auto/best-free`, `auto/best-coding`, `auto/best-reasoning`
- `auto/cheap`, `auto/offline`, `auto/fast`
- `ddgw/*` — DuckDuckGo Web free models
- `aug/*` — Auggie's model gateway
- `oc/*` — OpenCode free models via OmniRoute
- `tllm/*` — The Old LLM free models
- `pepper/pepper-1` — Chipotle AI
- `veo-free/*` — VEO video models

Point Codex / Cursor / Cline to: `http://localhost:20128/v1`

## OpenCode Agents (opencode.json)

| Agent key | Provider/Model | Purpose |
|-----------|----------------|---------|
| orchestrator | anthropic/claude-opus-4-7 | High-quality planning |
| coder | ollama-local/qwen2.5:7b | Local code writer |
| closer | openrouter/meta-llama/llama-3.3-70b-instruct:free | Demo/proposal builder |
| hunter | hermes-router/hermes-fast | Gig hunter (blocked — no Hermes Router) |
| cfo | hermes-router/cfo | Financial gating (blocked — no Hermes Router) |
| grok-adversarial | xai/grok-3 | Red-team review |
| free-fast | openrouter/openrouter/free | Quick free tasks |
| **zen-free** | **opencode/deepseek-v4-flash-free** | **NEW — Free, no API key** |
| **local-omniroute** | **omniroute/auto/best-free** | **NEW — Local proxy routing** |

## Files

- `opencode.json` — Full provider config (11 providers, 9 agents)
- `ops/PAPERCLIP-AGENT-STATUS.md` — This file
- `ops/PAPERCLIP-ROUTINES.md` — Daily/weekly maintenance routines, health-check script, schtasks registration
- `scripts/paperclip-healthcheck.ps1` — Non-elevated dependency + Paperclip health check, logs to `logs/failsafe/`
- `scripts/bootstrap/Start-OmniRoute.cmd` — OmniRoute launcher
- `scripts/bootstrap/Start-OmniRoute.ps1` — OmniRoute launcher (PowerShell)

## Join request

- Request ID: `452b22ec-4e5a-42a6-b89f-2bd62b6ab1cc`
- Status: `approved`
- Approved by: `local-board`
- API key claim: completed

## Local files

- Join response (contains claim secret; local only): `%USERPROFILE%\.openclaw\workspace\paperclip-join-request-clean.json`
- Claimed Paperclip API key (secret; local only): `%USERPROFILE%\.openclaw\workspace\paperclip-claimed-api-key.json`
- Installed OpenClaw skill: `%USERPROFILE%\.openclaw\skills\paperclip\SKILL.md`

Do not commit the local key files.
