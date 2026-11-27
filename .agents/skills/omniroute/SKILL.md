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

- House rules: `docs/house/HOUSE-MOTION-RULE.md` and `docs/standards/AGENT-STANDARD.md`. Read before any design, site, dashboard or header job. Pointers only; do not restate rules here.
- Current beats existing: fetch and pull main first; origin main wins over clone, cache, journal and definition file; a clone that cannot fast-forward stops and reports (`ops/handoffs/FABLE-HANDOFFS-2026-11-06.md` section 0).

<!-- TROLLZ1004-SPINE:START -->
- `Repo: ANTIGRAVITY | Fleet: Alienware (192.168.0.40, workshop) & T5500 (192.168.0.15, front-of-house) | GitHub: Trollz1004 (ops/fleet/fleet-map.json).`
- `Spine: Trollz1004/dream-online docs/house/SPINE.md (pointers: ADDRESS-DOCTRINE.md, NODES.md, PIPELINE.md, TRUSTED-MODELS.md, THE-HOUSE.md).`
- `Address doctrine: use 192.168.0.40 and 192.168.0.15 from ops/fleet/fleet-map.json; never use loopback reach URLs; Postgres (port 5432), Redis (port 6379), and Obsidian REST (port 27123) bind "127.0.0.1" on their own machine only.`
- `Trusted three: Claude Opus 5.5 / Fable (Claude Code), Gemini 4 Carbon (agy), and GPT-6 Astra / GPT-6.1 Sol / Codex (Codex CLI); superpowers is in every kit on demand, while REA, remake, Agent-Reach, and last30days are locked to the trusted three.`
- `Pipeline: brainstorm first, route role + <=2 skills, build [A]/[B] with failing test first, expediter rubric + 5 stacked add-on PRs, Carbon + Codex judge, Fable / rotating trusted-three merges green checks.`
- `Starter kit MCP ("kit"): cmd.exe /d /c node "%USERPROFILE%\antigravity\DREAM-Engine-runner\ops\kit\server.mjs" (tools: map_search, map_section, memory_search, memory_add, role_get, method_get).`
- `First read: the house index, https://github.com/Trollz1004/dream-online/blob/main/docs/house/INDEX.md, then the newest rulings in the claude.ai project Ai-Dream-Team as the index describes.`
- `Funding comes first and game work is paused (ruled 2026-11-13).`
- `The wheel: tickets in the .fable-kitchen inbox on the Alienware; runner ops/router/inbox-runner.ts in dream-online; lane rules in orders/RULES.md in the kitchen.`
- `Merging (ruled 2026-11-16): nothing merges with a failing required check; platform and marketing changes need the checks plus one trusted review; game and engine work keeps two offerings and two judges; whoever merges looks at the files and leaves a one-line verdict.`
- `Public text passes the go gate: the product does what the text says, stop-slop plus a humanizer pass, only what is true, every outside fact links the exact page.`
- `Marketing team log: https://github.com/Trollz1004/ANTIGRAVITY/tree/main/marketing/team (public; nothing private goes in).`
<!-- TROLLZ1004-SPINE:END -->
