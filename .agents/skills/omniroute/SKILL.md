---
name: omniroute
description: >
  Operate the OmniRoute AI gateway (the authenticated model router on this
  machine) — providers, models, combos, API keys, usage, budget, caching,
  compression, and resilience. Use when you need to route model traffic,
  check which models are available, inspect usage/costs, manage API keys or
  combos, or diagnose provider health. This is the gateway layer; the CLI
  tools (claude/codex/grok/gemini) are the model surfaces on top of it.
---

# OmniRoute — operate the model gateway

OmniRoute is the authenticated OpenAI-compatible gateway for this stack
(`http://192.168.0.15:20128/v1`, identity = `GET /v1/models`). It routes requests
to providers (OpenAI, Anthropic, Gemini, 160+) with combos, fallback,
quota tracking, and budget guards. Normal harness model access goes through
this gateway per doctrine — never raw provider keys.

## Access

- API key: `OMNI_ROUTE_API_KEY` in `C:\ANTIGRAVITY\.env` (never print it;
  read it from the file when a script needs it).
- CLI: `omniroute` (installed globally). Base `http://192.168.0.15:20128`.
- MCP: streamable HTTP `http://192.168.0.15:20128/api/mcp/stream` with
  `Authorization: Bearer <key>` — wired into this session's `~/.agents/mcp.json`
  and into grok (`~/.grok/config.toml`), claude (`~/.claude.json`), codex
  (`~/.codex/config.toml`).

## Live AgentSkills catalog (45 skills)

`GET http://192.168.0.15:20128/api/agent-skills` with the Bearer key returns the
full catalog as machine-readable skills. Categories:

- **API (23):** omni-auth, omni-providers, omni-models, omni-combos-routing,
  omni-api-keys, omni-usage-logs, omni-budget, omni-settings, omni-proxies,
  omni-cache, omni-compression, omni-context-rtk, omni-resilience, omni-cli-tools,
  omni-tunnels, omni-cloud-sync, omni-db-backups, omni-webhooks, omni-mcp,
  omni-agents-a2a, omni-version-manager, omni-inference, omni-github-skills
- **CLI (21):** serve, health, providers, api-keys, models, chat, routing-combos,
  resilience-quotas, compression, contexts-sessions, cost-usage, mcp, a2a,
  tunnels, backup-sync, policy-audit, batches-files, evals, plugins-skills-memory,
  setup-config, agent-skill-collector
- **Config:** config-codex-cli (point Codex at OmniRoute with 7 named profiles)

Each skill's `rawUrl` points at its SKILL.md (GitHub). For a full API/CLI
reference, fetch the OpenAPI spec: `GET /api/openapi/spec` (Bearer).

## Common operations

- **Who is up:** `omniroute health components` (circuit breakers, provider
  status, latency p50/p95/p99).
- **What models exist:** `GET /v1/models` or `omniroute models`.
- **Route a request:** `omniroute chat "prompt"` or `POST /v1/chat/completions`
  with `model: "auto/best-coding"` (auto-routes by task).
- **Combos:** `omniroute combos` / `omniroute routing-combos` — list, metrics,
  switch strategy.
- **Usage/cost:** `omniroute usage` / `omniroute cost` — filter by provider,
  model, key; export.
- **API keys:** `omniroute api-keys` — create, rotate, revoke, set scopes/limits.
- **Budget:** `omniroute budget` — spending limits, token quotas, rate limits.
- **Resilience:** `omniroute resilience` — circuit breakers, cooldowns,
  backoff, reset stuck providers.

## Rules

- Model access through OmniRoute only for general harness work — never raw
  provider keys. Judges run their own official account-auth CLIs and are the
  exception by doctrine.
- Never print the API key. Never route through a personal subscription lane.
- Report gateway status with identity: UP (model list answers) / DOWN /
  AUTH MISSING / AUTH REJECTED / NOT CONFIGURED — a port answering is not
  identity.

