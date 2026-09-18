---
name: orchestrator-preflight
description: Runs at the start of EVERY orchestrator session, before any objective. Loads standing set, pulls git, verifies ports with honest states, reads harness journals, prints preflight table, waits for Joshua's objective. Always runs first.
---

# Orchestrator Preflight

You are the Mission Control orchestrator (FreeBuff Desktop seat). Run this preflight at the start of every session, before Joshua gives an objective.

## Step 1: Load the standing set

Load all six standing skills before doing anything else:

- agent-reach — external research capability
- Your journal — read `.agents/journals/orchestrator/STATE.md` now; you will write to it at session end
- find-skills — search skills.sh before hand-rolling
- skill-creator — how to create new skills
- i-have-adhd — concise, action-first, token-saving output; lead with the action
- superpowers brainstorming — feature/architecture design patterns

## Step 2: Pull latest

```bash
git -C "C:\ANTIGRAVITY" pull --ff-only origin main
```

If the pull fails or diverges, report BLOCKED and stop — do not proceed with a stale tree.

## Step 3: Verify ports

Check every port below. Report each with an HONEST state — never fabricate, never assume green. States are:

| State | Meaning |
|-------|---------|
| UP | Port listening, service identity confirmed (HTTP response, known endpoint) |
| DOWN | Port not listening |
| WRONG SERVICE | Port answers but returns unexpected content (wrong API, wrong response) |
| AUTH MISSING | Port answers but endpoint requires authentication not configured |
| AUTH REJECTED | Port answers but authentication is failing |
| NOT CONFIGURED | Service not set up on this machine |

Ports to check:

| Port | Service | Expected Check |
|------|---------|---------------|
| 3100 | Paperclip (= Mission Control) | `GET http://127.0.0.1:3100/api/openapi.json` → `.info.title == "Paperclip API"` |
| 3151 | MC5 legacy vote engine (NOT Mission Control) | `GET http://localhost:3151/api/health` |
| 20128 | OmniRoute gateway | `netstat` — listening on 20128 |
| 20129 | OmniRoute API proxy | `netstat` — listening on 20129 |
| 9119 | Hermes dashboard | `netstat` — listening on 9119 |
| 18789 | OpenClaw gateway | `netstat` — listening on 18789 |
| 3200 | DateApp frontend | `GET http://127.0.0.1:3200/` |
| 8000 | DateApp backend | `GET http://127.0.0.1:8000/api/v1/health` |

## Step 4: Read harness journals

Read all three harness STATE.md files:

- `.agents/journals/hermes/STATE.md`
- `.agents/journals/openclaw/STATE.md`
- `.agents/journals/opencode/STATE.md`

Note each harness's last task, blockers, and next action.

## Step 5: Print the preflight table

Output a compact table:

```
## ORCHESTRATOR PREFLIGHT — <YYYY-MM-DD HH:MM>

| Check | Status |
|-------|--------|
| Git   | main up to date / diverged / BLOCKED |
| Paperclip (Mission Control) :3100 | UP / DOWN / WRONG SERVICE / ... |
| MC5 legacy :3151 | UP / DOWN / WRONG SERVICE / ... |
| OmniRoute :20128 | UP / DOWN |
| OmniRoute API :20129 | UP / DOWN |
| Hermes :9119 | UP / DOWN |
| OpenClaw :18789 | UP / DOWN |
| DateApp frontend :3200 | UP / DOWN / ... |
| DateApp backend :8000 | UP / DOWN / ... |
| Hermes journal | read (last task: ..., blocker: ...) |
| OpenClaw journal | read (last task: ..., blocker: ...) |
| OpenCode journal | read (last task: ..., blocker: ...) |
```

## Step 6: Wait

Output: "**Preflight complete. Ready for objective, Joshua.**"

Then stop. Do nothing else until Joshua gives the objective.