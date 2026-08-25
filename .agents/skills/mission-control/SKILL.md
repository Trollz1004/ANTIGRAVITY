---
name: mission-control
description: Paperclip is Mission Control on the Sabretooth node — company board at :3100, agent heartbeats via adapter, issues/inbox workflow. Use for task tracking, agent reporting, or status queries.
---

# Mission Control — Paperclip on Sabretooth

## Current Truth (2026-08-25)

- **Mission Control surface = Paperclip** (`ANTIGRAVITY Marketing Co`), chosen for its
  built-in official judge CLI. The old PAPERWEIGHT kanban, WhatsApp/Telegram bridge,
  and T5500 customer-service OpenClaw are retired surfaces — do not reference or revive them.
- **Node topology:** Sabretooth is the ONLY node. Everything runs on this box:
  repo `C:\ANTIGRAVITY`, Paperclip API `http://127.0.0.1:3100`, Hermes gateway
  `http://127.0.0.1:8642` (profile `paperclip-mc`). No T5500, no remote nodes.
- Health probe: `GET http://127.0.0.1:3100/api/health` → expect `{"status":"ok"}`.
  Connection refused = Paperclip down; report DOWN with evidence, do not start a
  second instance on the port.

## Board Semantics (Paperclip issues)

| Paperclip concept | Old PAPERWEIGHT column |
|---|---|
| Issue `todo` / `in_progress` | NOW |
| Issue assigned, not checked out | NEXT |
| Issue `blocked` + comment surfacing the exact question | BLOCKED |
| Issues closed in last 24h (activity log) | DONE-24H |
| Heartbeat routines / scheduler heartbeats | ROUTINES |
| Agent status + adapter config (`/api/agents/me`) | ADAPTERS |
| Wakeup/heartbeat run history (`/api/wakeups/{id}`) | HERMES HEARTBEAT |

## Agents & Adapters

- Agents join via invite (`adapterType: hermes_gateway`), get approved by the board,
  then claim an API key once (stored privately, never echoed).
- ox-alpha runs from the dedicated Hermes profile `paperclip-mc`
  (`~\AppData\Local\hermes\profiles\paperclip-mc`) — separate memory, sessions, skills.
- Dispatch test: `POST /api/agents/{agentId}/wakeup` with
  `{"source":"on_demand","triggerDetail":"manual","reason":"..."}`.
- Full API surface: `GET http://127.0.0.1:3100/api/openapi.json`.
- Heartbeat procedure and issue workflow: see `.agents/skills/paperclip/SKILL.md`.

## Verified Operating State

"All resolved issues. Paperclip is answering on :3100, agents are connected through
their adapters, wakeup dispatch reaches them, and live task state is on the issues board."

If this is not literally true — verified by probes you actually ran — open an ops-drift
issue instead of claiming it.

## Governance (unchanged)

- Joshua alone sets authority. Harnesses are delivery-only: no push/merge/delete,
  no self-approval. Judge-gated landings only; no judge available = BLOCKED.
- Evidence standard: cite the health response, run record, or commit actually observed.
