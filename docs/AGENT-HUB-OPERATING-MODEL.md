# Agent Hub — Operating Model

Last updated: 2026-07-05

## Summary

**PaperclipAI (`:3110`) is the one human-facing mission-control entrypoint.**
It is the board, CEO cockpit, routine runner, manual execution surface, and
evidence trail Joshua actually uses.

**Agent Hub (`services/agent-hub`, Express on Sabretooth `:3130`) is the one
rate-limited dispatcher/backend bridge.** It owns task queueing, platform
routing, REST/MCP access, and the leads CRM. Base44 is retired from this flow.

All AI platforms enter through PaperclipAI or Agent Hub. No model gets a private
backlog or alternate board.

## Roster

This is the current roster of standing lanes. It is intentionally short — the model is **on-demand
sub-agents spawned per task**, not a growing bench of always-on agents.

| Agent | Role | Lane / Auth | Notes |
|---|---|---|---|
| **Claude CEO** | Code, compliance, doctrine, payments, merge/push, PR gates | Claude CLI/Max or FCC helper | Standing PaperclipAI CEO lane. FCC can execute helper work, but FCC is not a third CEO. |
| **Hermes CEO** | Growth, support, research, external APIs, leads, workspace memory | Hermes Workspace `:3000`, dashboard `:9119` | Standing PaperclipAI CEO lane. Keeps board motion and evidence visible. |
| **clawx** | OpenClaw support lane | WhatsApp allowlist `+13529735909` | **Support ONLY.** Not a general-purpose executor. |
| **1minai** | Lifetime cloud multi-model provider | Desktop app | DREAM NPC AI / cloud inference for real-time game behavior. Not part of the coding/task-routing lanes. |

### Sub-agents (not standing roster)

Sub-agents spawn **per task** from the roles defined in `.agents/skills/`, selected
by the task's `skill_id` field. There is no standing sprawl of pre-provisioned
agents waiting for work. A task comes in, Claude CEO or Hermes CEO assigns the
right skill/tool/platform, and the temporary worker exits when done.

## Queue Discipline

- **100-task active cap** — tasks in `todo`, `in_progress`, or `review` are capped at 100 concurrently
  (enforced by `MAX_ACTIVE` in `src/models/task.js`). Overflow lands in `backlog` and is promoted FIFO
  (oldest backlog by priority) as active tasks complete.
- This is a focus mechanism, not an arbitrary limit — it prevents unbounded agent sprawl and keeps
  attention on what's actually in flight.
- PaperclipAI should display active work and evidence; Agent Hub enforces dispatch
  and rate limiting.

## Nodes

| Node | Drive/Env | Role |
|---|---|---|
| **T5500** | — | Gateway only. Cloudflare tunnels for public domains (e.g. youandinotai.com). Runs the dateapp. Nothing else. |
| **Sabretooth C:** | — | Dev/control. PaperclipAI `:3110`, Agent Hub `:3130`, Hermes `:3000/:9119`, FCC proxy `:8082`, Ollama `:11434`, PostgreSQL, this repo. |
| **Sabretooth E:** | `DREAM_ROOT` env var | DREAM ONLINE. Portable drive — the game's assets/server/config/saves/logs live here, addressed via `DREAM_ROOT` rather than a hardcoded path so the drive can move between machines. |

## Platforms

Agent Hub routes tasks across 21 platforms (see `src/platforms.js` for the single source of truth list,
and `src/integrations/dispatcher.js` for routing/auth per platform). This includes `odysseus`
(Sabretooth, local-service, `:7000`). Full platform table: `services/agent-hub/README.md`.

## Why This Replaces Side Boards

- **PaperclipAI** (`:3110`) remains the human-facing command center.
- **Base44** is retired. Agent Hub's Postgres schema and REST/MCP API are the sole source of truth for
  task state, queue, and platform routing.
- Any agent (claude-gm, hermes-marketer, fcc-claude, sub-agents, or a human) that needs to create,
  update, or query work talks to Agent Hub's API (`GET/POST /api/entities/AgentTask`, `/api/mcp/*`,
  `/api/dispatch/*`) and keeps the visible state aligned in PaperclipAI.

## Operating Rules

- Claude CEO and Hermes CEO are the only standing PaperclipAI lanes.
- `fcc-claude` must never hold or acquire an Anthropic API key; it is a free/local execution lane only.
- `clawx` only handles support traffic on the allowlisted WhatsApp number; it is not wired into general
  task execution.
- New agent roles are hired as sub-agents against `.agents/skills/` roles, not as new standing roster
  entries, unless there's a specific reason to promote one to a standing lane (and that promotion should
  be reflected in the roster table above).
- Every agent reads `paperclip-tro/README.md` and writes only its own `STATE.md`
  on exit.
