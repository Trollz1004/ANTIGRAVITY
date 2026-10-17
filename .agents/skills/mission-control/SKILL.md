---
name: mission-control
description: Paperclip on the T5500 at :3917 is the MARKETING command layer (company board, agent heartbeats via adapter, issues/inbox). Mission Control itself is JARVIS/OPSIS on the Mission Agent OS board (T5500 :3130, rebuilding as of 2026-10-09). Use for Paperclip task tracking, agent reporting, or status queries.
---

# Paperclip (marketing) on T5500 — and where Mission Control really is

## Current Truth (Joshua, 2026-10-17)

- **Mission Control = JARVIS/OPSIS** on the Mission Agent OS board (`mission-os/`, T5500 :3130).
  Hermes is JARVIS on :9119 and is fixing it now; OPSIS/JARVIS and Hermes own that work.
- **Paperclip is marketing only** (`ANTIGRAVITY Marketing Co`, :3917). It is NOT Mission Control.
  The old PAPERWEIGHT kanban and WhatsApp/Telegram bridge are retired surfaces — do not revive them.
- **Node topology:** the T5500 (`192.168.0.15`) is the only production node. Everything runs on it:
  repo `C:\ANTIGRAVITY`, Paperclip API `http://127.0.0.1:3917`, Hermes gateway
  `http://127.0.0.1:8642` (profile `paperclip-mc`). Alienware is dev only, never production.
  Sabretooth is not a node.
- Health probe: `GET http://127.0.0.1:3917/api/health` → expect `{"status":"ok"}`.
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
- Full API surface: `GET http://127.0.0.1:3917/api/openapi.json`.
- Heartbeat procedure and issue workflow: see `.agents/skills/paperclip/SKILL.md`.

## Verified Operating State

"All resolved issues. Paperclip is answering on :3917, agents are connected through
their adapters, wakeup dispatch reaches them, and live task state is on the issues board."

If this is not literally true — verified by probes you actually ran — open an ops-drift
issue instead of claiming it.

## Governance (unchanged)

- Joshua alone sets authority. Harnesses are delivery-only: no push/merge/delete,
  no self-approval. Judge-gated landings only; no judge available = BLOCKED.
- Evidence standard: cite the health response, run record, or commit actually observed.

