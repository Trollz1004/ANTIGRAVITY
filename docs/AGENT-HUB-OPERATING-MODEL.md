# Agent Hub — Operating Model

Last updated: 2026-07-04

## Summary

**Agent Hub (`services/agent-hub`, Express on Sabretooth `:3130`) replaces Paperclip + Base44** as the
one place every AI/agent sends and tracks work. Paperclip TRO (`:3110`) still exists for DREAM game
orchestration (webhooks, triggers, events) — it is not part of task routing anymore. Base44 is retired
from this flow entirely.

All task creation, status, priority, and platform routing lives in Agent Hub's Postgres-backed
`agent_tasks` table, exposed over the REST/MCP API described in `services/agent-hub/README.md`.

## Roster

This is the current roster of standing lanes. It is intentionally short — the model is **on-demand
sub-agents spawned per task**, not a growing bench of always-on agents.

| Agent | Role | Lane / Auth | Notes |
|---|---|---|---|
| **claude-gm** | Official Claude CLI, general manager | Max lane, `~/.claude` config dir | **ON-DEMAND ONLY — never cron.** Real Anthropic usage under Josh's Max subscription. Never share config dir with fcc-claude. |
| **hermes-marketer** | Marketing/growth only | Hermes router `:11435` | **Demoted from co-CEO.** Scope is strictly marketing/growth — no doctrine, payments, or founder-authority decisions. Hermes Workspace knowledge bank on `:9119` is the **primary memory layer** for this lane. |
| **fcc-claude** | Free executor via proxy | `:8082` | **NOT official Claude.** Backed by PyPI `free-claude-code` v1.2.41. Zero Anthropic usage — verified 2026-07-04. Runs under `~/.claude-fcc` config dir, capped at 40k context. Never holds an Anthropic API key. |
| **clawx** | OpenClaw support lane | WhatsApp allowlist `+13529735909` | **Support ONLY.** Not a general-purpose executor. |
| **1minai** | Lifetime cloud multi-model provider | Desktop app | DREAM NPC AI / cloud inference for real-time game behavior. Not part of the coding/task-routing lanes. |

### Sub-agents (not standing roster)

Sub-agents spawn **per task** from the 279 roles defined in `.agents/skills/`, selected by the task's
`skill_id` field. There is no standing sprawl of pre-provisioned agents waiting for work — a task comes
in, the right skill role is instantiated to handle it, and it exits when done. This keeps the roster
table above short and keeps cost/complexity bounded.

## Queue Discipline

- **100-task active cap** — tasks in `todo`, `in_progress`, or `review` are capped at 100 concurrently
  (enforced by `MAX_ACTIVE` in `src/models/task.js`). Overflow lands in `backlog` and is promoted FIFO
  (oldest backlog by priority) as active tasks complete.
- This is a focus mechanism, not an arbitrary limit — it prevents unbounded agent sprawl and keeps
  attention on what's actually in flight.

## Nodes

| Node | Drive/Env | Role |
|---|---|---|
| **T5500** | — | Gateway only. Cloudflare tunnels for public domains (e.g. youandinotai.com). Runs the dateapp. Nothing else. |
| **Sabretooth C:** | — | Dev. Agent Hub `:3130`, Hermes, FCC proxy `:8082`, Ollama `:11434`, Paperclip TRO `:3110`, PostgreSQL, this repo. |
| **Sabretooth E:** | `DREAM_ROOT` env var | DREAM ONLINE. Portable drive — the game's assets/server/config/saves/logs live here, addressed via `DREAM_ROOT` rather than a hardcoded path so the drive can move between machines. |

## Platforms

Agent Hub routes tasks across 21 platforms (see `src/platforms.js` for the single source of truth list,
and `src/integrations/dispatcher.js` for routing/auth per platform). This includes `odysseus`
(Sabretooth, local-service, `:7000`). Full platform table: `services/agent-hub/README.md`.

## Why This Replaces Paperclip + Base44

- **Paperclip** (`:3110`) is retained only for DREAM game orchestration — webhooks, triggers, in-game
  events. It is no longer the task/agent coordination layer for ANTIGRAVITY work.
- **Base44** is retired. Agent Hub's Postgres schema and REST/MCP API are the sole source of truth for
  task state, queue, and platform routing.
- Any agent (claude-gm, hermes-marketer, fcc-claude, sub-agents, or a human) that needs to create,
  update, or query work talks to Agent Hub's API (`GET/POST /api/entities/AgentTask`, `/api/mcp/*`,
  `/api/dispatch/*`) — not Paperclip, not Base44.

## Operating Rules

- `claude-gm` runs only when explicitly invoked by Josh — no scheduled/cron execution under the Max lane.
- `hermes-marketer` does not make doctrine, payments, or founder-authority calls; those remain with Josh.
- `fcc-claude` must never hold or acquire an Anthropic API key; it is a free/local execution lane only.
- `clawx` only handles support traffic on the allowlisted WhatsApp number; it is not wired into general
  task execution.
- New agent roles are hired as sub-agents against `.agents/skills/` roles, not as new standing roster
  entries, unless there's a specific reason to promote one to a standing lane (and that promotion should
  be reflected in the roster table above).
