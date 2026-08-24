# Paperclip OS + Freebuff CEO — custom adapter

Revived 2026-08-23 at Joshua's direction on Sabretooth (192.168.0.8).
Scope: **marketing and business operations only** (S1 doctrine). Paperclip has
no repository authority, no task governance, no git delivery, and no
publishing. FreeBuff builds; the judge lane pushes — unchanged.

## What this is

Paperclip OS runs as the marketing company control plane on this machine.
The company CEO agent is executed by **Freebuff** (this desktop agent client)
through a **custom adapter** — the loopback bridge in `bridge/`:

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
- **Freebuff session** (the CEO) reads `.agents/skills/paperclip-ceo/SKILL.md`,
  processes pending wakes via the Paperclip API, writes marketing drops to
  `ops/marketing-inbox/`, then reports done/fail through the bridge.

## Identity / endpoints

| What | Where | Verified |
| ---- | ----- | -------- |
| Paperclip server | `http://127.0.0.1:3100/api/health` | UP, `local_trusted`, 2026.817.0 (see STATE.md) |
| Bridge | `http://127.0.0.1:3140/health` | see STATE.md |
| Wakes queue | `ops/paperclip-ceo/wakes/` (gitignored) | — |
| Marketing drops | `ops/marketing-inbox/` (Mission Control approval queue) | — |

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

- `bridge/bridge.js` — the custom adapter (Node, zero deps, loopback only).
- `bridge/start.cmd` — launcher; sources `bridge/.env`.
- `bridge/.env.example` — template for the two required secrets.
- `bridge/.env` — real secrets, **gitignored, never committed**.
- `wakes/` — runtime wake queue, gitignored.
- `STATE.md` — session record / evidence log (updated by CEO sessions).
- Skill: `.agents/skills/paperclip-ceo/SKILL.md` — session-side procedure.
- Paperclip skill: `.agents/skills/paperclip/SKILL.md` — the API heartbeat
  procedure the CEO follows inside Paperclip.

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

1. Load skill `.agents/skills/paperclip-ceo/SKILL.md` and follow it.
2. `curl -s http://127.0.0.1:3140/wakes` → for each pending wake, work, then
   POST to `/wakes/<runId>/done` (or `/fail`).

## Hard rules (carried from doctrine)

- No push/merge/branch-delete from anything here — judge lane only.
- No raw provider keys, no claude.exe, no personal-subscription routing.
- No secrets in files except the gitignored `bridge/.env`.
- Marketing output always drops to `ops/marketing-inbox/` for Joshua approval.
- OmniRoute stays the gateway for model access in this stack; Freebuff uses its
  free cloud lane for its own sessions.
