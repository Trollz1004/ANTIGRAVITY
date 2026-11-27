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
| 3130 | Mission OS (`mission-os/`, T5500 `192.168.0.15`) | `GET http://192.168.0.15:3130/api/mos-state.json` |
| 20128 | OmniRoute gateway (T5500 `192.168.0.15`) | `http://192.168.0.15:20128/v1/models` |
| 8643 | Hermes API gateway (T5500 `192.168.0.15`) | `http://192.168.0.15:8643/health` |
| 9119 | Hermes Dashboard (T5500 `192.168.0.15`) | `http://192.168.0.15:9119/` |
| 3200 | DateApp frontend (T5500 `192.168.0.15`) | `GET http://192.168.0.15:3200/` |
| 8000 | DateApp backend (T5500 `192.168.0.15`) | `GET http://192.168.0.15:8000/api/v1/health` |
| 49374 | Shared `ai-memory` MCP (T5500 `192.168.0.15`) | `http://192.168.0.15:49374` |
| 8392 | Lead-Gen Studio (Alienware `192.168.0.40`) | `http://192.168.0.40:8392/api/node/status` |
| 8391 | Media/TTS Worker (Alienware `192.168.0.40`) | `http://192.168.0.40:8391/health` |
| 9180 | DREAM Engine (Alienware `192.168.0.40`) | `http://192.168.0.40:9180` |

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
| Git | main up to date / diverged / BLOCKED |
| Mission OS (T5500 `192.168.0.15:3130`) | UP / NOT RUNNING / WRONG SERVICE / ... |
| OmniRoute (`192.168.0.15:20128`) | UP / DOWN |
| Hermes (`192.168.0.15:8643`, `:9119`) | UP / DOWN |
| DateApp frontend (`192.168.0.15:3200`) | UP / DOWN / ... |
| DateApp backend (`192.168.0.15:8000`) | UP / DOWN / ... |
| Alienware Lead-Gen/Media (`192.168.0.40:8392`, `:8391`) | UP / DOWN |
| Hermes journal | read (last task: ..., blocker: ...) |
| OpenClaw journal | read (last task: ..., blocker: ...) |
| OpenCode journal | read (last task: ..., blocker: ...) |
```

## Step 6: Wait

Output: "**Preflight complete. Ready for objective, Joshua.**"

Then stop. Do nothing else until Joshua gives the objective.

## Payments record

**Payments are settled and are never a blocker.** Do not re-verify, re-audit, re-test, or ask Joshua about them. Every payment, who paid it, and the only two conditions that reopen the subject live in `docs/PAYMENTS-TRUTH.md`. Read it there. Never restate its contents anywhere else ΓÇö a copy is how it goes stale.

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
