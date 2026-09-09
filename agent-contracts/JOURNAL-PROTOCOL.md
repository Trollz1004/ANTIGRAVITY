# Harness Journal Protocol — Draft

> **Status:** This is part of the S1 draft. It becomes active only when the judge lane lands the supersession.

Each harness owns one repository journal under `.agents/journals/`. The journal is durable task context for Graphy and optional Obsidian mirroring; it is not a command channel and it never contains secrets.

| Harness | Journal |
|---|---|
| Hermes | `.agents/journals/hermes/STATE.md` |
| OpenClaw | `.agents/journals/openclaw/STATE.md` |
| OpenCode | `.agents/journals/opencode/STATE.md` |

## Session Start

1. Read the harness journal and the assigned task.
2. Query Mission Control repository knowledge or Graphy when the task needs repository context; do not use a retired external-memory dependency.
3. Load the skills relevant to the task **before planning or assigning a subagent**.
4. Write a short plan only after the required skills and source evidence are available.

## Session End

Write a compact state entry containing the task, files changed, skills loaded, evidence, blockers, and one next action. Mark uncertain facts **UNVERIFIED**. Do not include secrets, credential-bearing URLs, or copied private browser data.

## Required Skills-First Decision Rule

Use the `i-have-adhd` skill as output and token discipline only: lead with the action, keep human-facing updates short, suppress repeated tangents, and show the current state. It does **not** label or diagnose a user.

Before delegation, load the applicable skills: `brainstorming` for feature or behavior design, `agent-reach` for external research, `browser-use` for interactive/authenticated browser work with approved cookie sync, `find-skills` when a capability may already exist, `tdd` for test-first code changes, and `systematic-debugging` for any failure or unexpected behavior. `skills.sh`, ClawHub, and the Hermes skill hub remain available for discovery; use `find-skills` before hand-rolling a recurring capability.

## Node ledger (added 2026-09-03, Joshua's direction)

The journal is per-harness and per-box. The **Buzz node ledger** is the one
record every agent on every node shares — Sabretooth today, the DREAM Online
server and the AI-Solutions node as they come on. At session start, after your
`STATE.md`, run `ops/buzz/ledger-tail.sh 30`. At session end, after your
`STATE.md` write, run `BUZZ_AGENT_NAME=<lane> ops/buzz/ledger.sh "<what landed> · <path> · <evidence>"`.
The line is auto-prefixed with UTC time, hostname, lane, and repo@sha. Doctrine,
channel, and new-node bring-up: `ops/buzz/BUZZ-NODE-LEDGER.md`. Never a secret.
