# Paperclip OS + Freebuff CEO — custom adapter

Revived 2026-08-23 at Joshua's direction on Sabretooth (192.168.0.8), and
designated **Mission Control** on 2026-08-25. Paperclip holds task governance
on this node: the company board, org chart, issues, approvals, budgets, and
heartbeats. Git delivery still runs only through the official first-party
judge lanes built into Paperclip, absent a direct authorization from Joshua.

The earlier scope line — "marketing and business operations only; no repository
authority, no task governance, no git delivery, no publishing" (S1 doctrine,
2026-08-19) — is **superseded as of 2026-08-25** by Joshua's Mission Control
designation, and only for Paperclip itself. It still binds the CEO agent: the
scope section of `CEO-AGENTS.md` is unchanged, Buffy holds no repository
authority and no publishing rights, and nothing in this directory pushes,
merges, or deletes a branch. What did not change anywhere is the wall —
FreeBuff and the harnesses build, official judges push — and marketing output
still lands in Joshua's approval queue before it goes public.

## What this is

Paperclip OS runs as the company control plane on this machine. The company
CEO agent is executed by **Freebuff** (this desktop agent client) through a
**custom adapter**. Two paths exist and both feed the same wake queue: the
loopback HTTP-adapter bridge in `bridge/` (diagrammed below), and the external
adapter package in `adapter-freebuff/`, which registers the native Paperclip
agent type `freebuff_local` (see `adapter-freebuff/README.md`).

```
Paperclip server (:3100) ──HTTP adapter──▶ bridge (:3140) ──wake file──▶ Freebuff session
      ▲                                                                        │
      └────────────── heartbeat callback ◀─────────────────────────────────────┘
```

- **Paperclip** owns the company, org chart, issues, approvals, budgets,
  heartbeats. Runs `local_trusted` on loopback `127.0.0.1:3100` (embedded
  Postgres, instance data under `~/.paperclip/instances/default/`).
- **Bridge** (`bridge/bridge.js`) implements the Paperclip HTTP-adapter
  contract: receives the wake, writes `wakes/<runId>.json`, and relays the
  session's completion to `POST /api/heartbeat-runs/:runId/callback`.
- **Freebuff session** (the CEO) reads `ops/paperclip-ceo/CEO-AGENTS.md` — the
  tracked CEO contract: scope, standing duties, hard rules — processes pending
  wakes via the Paperclip API, writes marketing drops to `ops/marketing-inbox/`,
  then reports done/fail through the bridge. The step-by-step wake procedure is
  not in that contract; `CEO-AGENTS.md` hands it to
  `.agents/skills/paperclip-ceo/SKILL.md`, which is excluded by `.gitignore`
  (`paperclip-ceo/`). **Open gap:** a fresh clone gets the contract but not the
  procedure, and nothing tracked in this directory carries it.

## Identity / endpoints

| What | Where | Verified |
| ---- | ----- | -------- |
| Paperclip server | `http://127.0.0.1:3100/api/health` | **UP** — `local_trusted`, `paperclipai@2026.824.0`, checked 2026-08-25 |
| Bridge | `http://127.0.0.1:3140/health` | **UP** — identity `paperclip-freebuff-ceo-bridge` 1.0.0, checked 2026-08-25 |
| Wakes queue | `ops/paperclip-ceo/wakes/` (gitignored) | — |
| Marketing drops | `ops/marketing-inbox/` (Joshua's approval queue) | — |

Paperclip's own MCP tool broker is a separate surface from anything a CLI lane
loads, and it is not fully green: four stdio connectors are fixed, `omniroute`
and `supabase` are **BLOCKED**. Evidence and root causes:
`agent-contracts/PAPERCLIP-MCP-CONNECTOR-EVIDENCE.md`.

## Entities created (Paperclip)

- **Company** `ANTIGRAVITY Marketing Co` — id `92223de0-b36b-4d63-93ca-50ebe5007e68`,
  issue prefix `ANT`, active.
- **CEO agent** `Buffy (CEO)` — id `55461934-f04b-4397-be78-b81bd353d110`,
  role `ceo`, `adapterType: http` → `http://127.0.0.1:3140/heartbeat`,
  heartbeat 1800s enabled, `canCreateAgents` + `canCreateSkills`.
- **Agent API key** `freebuff-ceo-bridge` (id `f419bc81-...`) — held only in
  `bridge/.env` (gitignored), used for the Paperclip heartbeat callback.
- The onboard-restored legacy company `YouAndiNotAi.com` and its built-in
  `claude_local` agents were left untouched (paused/error from before this
  setup; not wired to anything on this machine).

## Files

- `CEO-AGENTS.md` — the tracked CEO contract: scope, standing duties, hard rules.
- `bridge/bridge.js` — the custom adapter (Node, zero deps, loopback only).
- `bridge/start.cmd` — launcher; sources `bridge/.env`.
- `bridge/.env.example` — template for the two required secrets.
- `bridge/.env` — real secrets, **gitignored, never committed**.
- `adapter-freebuff/` — external adapter package registering the native
  `freebuff_local` agent type; writes into the same wake queue.
- `wakes/` — runtime wake queue, gitignored.
- `STATE.md` — session record / evidence log (updated by CEO sessions).
- Skill: `.agents/skills/paperclip-ceo/SKILL.md` — the step-by-step wake
  procedure, node-local only: **gitignored**, absent from a fresh clone, and
  not duplicated anywhere tracked.
- Paperclip skill: `.agents/skills/paperclip/SKILL.md` — tracked; the API
  heartbeat procedure the CEO follows inside Paperclip.

## Runbook

Start Paperclip (if not running):

```bash
cd C:\ANTIGRAVITY && npx paperclipai onboard --yes   # idempotent; starts :3100
# or: paperclipai run
```

Start the bridge (needs `bridge/.env` populated first):

```cmd
ops\paperclip-ceo\bridge\start.cmd
```

Trigger a CEO heartbeat on demand:

```bash
npx paperclipai agent heartbeat:invoke 55461934-f04b-4397-be78-b81bd353d110
# or: npx paperclipai heartbeat run --agent-id 55461934-...
```

Process wakes (Freebuff session):

1. Read `ops/paperclip-ceo/CEO-AGENTS.md` and follow it; for the procedure
   itself it sends you to `.agents/skills/paperclip-ceo/SKILL.md`. That skill is
   gitignored and node-local — on a clone without it, stop and report BLOCKED
   rather than improvising the steps.
2. `curl -s http://127.0.0.1:3140/wakes` → for each pending wake, work, then
   POST to `/wakes/<runId>/done` (or `/fail`).

## Hard rules (carried from doctrine)

- No push/merge/branch-delete from anything here — official judge lanes only.
  Harnesses and the CEO session never push, whatever their Paperclip role says.
- `C:\ANTIGRAVITY` is the sole canonical working tree. No other root, no FCC.
- No raw provider keys, no claude.exe, no personal-subscription routing.
- No secrets in files except the gitignored `bridge/.env`.
- Marketing output always drops to `ops/marketing-inbox/` for Joshua approval.
- Public copy stays business-only framing, Square-only checkout — the banned
  vocabulary list in `CEO-AGENTS.md` still binds every public surface.
- OmniRoute stays the gateway for model access in this stack; Freebuff uses its
  free cloud lane for its own sessions. Paperclip's *MCP connector* to
  OmniRoute is a different thing and is BLOCKED on a protocol mismatch, not on
  credentials — see the evidence packet before chasing it.
