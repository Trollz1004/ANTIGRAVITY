# BRAIN MCP Specification

Updated: 2026-03-23
Status: MVP scaffold created in repo
Canonical authority: `AGENTS.md`

## Purpose

BRAIN MCP is a LAN-local sidecar for shared operational truth.

It exists to reduce drift between approved AI platforms by exposing:

- what is already built
- what is verified live
- what lane or drive a platform is allowed to use
- who is working where
- what changed and whether it was pushed
- what remains sandbox-only versus what has actually graduated into ANTIGRAVITY

BRAIN MCP is not governance, not a hierarchy, and not a replacement for any platform's own memory.

## What BRAIN Is

- shared operational memory
- lane and path awareness
- session check-in and check-out logging
- audit visibility for multi-node work
- a read-only mirror of repo truth files
- a way to answer the practical question: `Is this ANTIGRAVITY yet?`

## What BRAIN Is Not

- not canonical authority
- not a replacement for git
- not a replacement for `AGENTS.md`
- not a proxy in the LLM inference path
- not a secret store
- not a controller for Claude, Gemini, Codex, Copilot, or any other platform

Every BRAIN response must carry this authority notice:

`AGENTS.md is canonical. Josh is sole authority. BRAIN is operational telemetry only.`

## Memory Model

Platform and continuity memory remain where they already live:

- platform-specific memory remains with each platform
- shared repo truth remains in `C:\ANTIGRAVITY\memory` and `C:\ANTIGRAVITY\briefings`
- approved continuity snapshots remain in the locked OneDrive Personal Vault

BRAIN only synchronizes shared operational state and audit visibility.

## Trusted Execution Backbone

The trusted execution backbone currently trusted to certify ANTIGRAVITY readiness is:

- OpenAI Codex
- Claude Code Opus
- Gemini CLI
- GitHub Copilot

These four are the platforms trusted to validate, green-light, and help certify what is ready to count as ANTIGRAVITY production truth.

Other platforms are still valued and may contribute in sandbox, continuity, research, and isolated lanes, but they do not currently certify production-ready ANTIGRAVITY state.

## Critical Truth

Third-party, experimental, or unverified work does not become ANTIGRAVITY just because it exists.

Work is only ANTIGRAVITY when it is:

1. on `C:\ANTIGRAVITY`
2. on `main`
3. green-checked
4. validated by the trusted execution backbone
5. approved by Josh
6. pushed and deployed as final live truth

Work sitting on sandbox drives is not ANTIGRAVITY:

- `D:\sandbox-repos`
- `D:\claws`
- `E:\sandbox-repo`
- `E:\claudes-claw`
- `E:\ANTIGRAVITY-CLAWBOTS`

## Current Node / Lane Truth

### Sabretooth

- `C:\ANTIGRAVITY` = canonical live repo
- `E:\claudes-claw` = Claude Dispatch / coworker lane
- `E:\sandbox-repo` = unified local sandbox mirror

### 9020

- `C:` = live support / date-app paths already intentionally there
- `D:\claws\openclaw-9020` = openclaw/support sandbox lane
- `D:\sandbox-repos\...` = isolated sandbox repos

### T5500

- `E:\ANTIGRAVITY-CLAWBOTS` = Manus / Crossfire / media sandbox lane

## Architectural Rules

- BRAIN runs on Sabretooth as the LAN-local access broker and state mirror.
- Repo truth stays in git-tracked files.
- Operational state and session history live in SQLite plus append-only JSONL audit logs.
- Secret values never leave local `.env`, approved secret stores, GitHub secrets, or platform connectors.
- BRAIN may expose secret references only, never secret values.
- BRAIN reports facts. It does not issue directives.
- BRAIN never auto-pulls, auto-resets, auto-merges, or auto-reverts.

## MVP Scope

The MVP includes:

- streamable HTTP transport for LAN access
- stdio transport for local process-spawned clients
- platform registry with trust tier, participation mode, and certification authority flag
- session enter and exit logging
- heartbeat and TTL-based timeout closure for ghost sessions
- lane validation on declared target paths
- SHA drift tagging
- read-only repo truth resources
- append-only audit log
- SQLite session and action store

## MVP Tools

- `brain.sync`
- `brain.enterWorkspace`
- `brain.heartbeat`
- `brain.reportAction`
- `brain.exitWorkspace`
- `brain.getRepoTruth`
- `brain.getActiveContext`
- `brain.getSecretRef`

## MVP Resources

- `brain://repo/agents`
- `brain://repo/record`
- `brain://repo/state`
- `brain://sessions/active`
- `brain://audit/recent`

## Required Enter Payload

`brain.enterWorkspace` and `brain.sync` must include:

- `platform_id`
- `node_id`
- `target_paths`
- `git_sha`

Optional baseline context:

- `worktree_state`
- `intent`
- `estimated_scope`

## Required Enter / Sync Response Fields

- `authority_notice`
- `session_id` for `enterWorkspace`
- `baseline_tag`
- `sha_status`
- `lane`
- `active_sessions`
- `required_reads`
- secret references only, never values

## SHA Drift Policy

BRAIN does not hard-block every SHA mismatch.

It tags and reports drift:

- `match`
- `drift_production`
- `drift_sandbox`

It never performs git operations on behalf of the platform.

## Session Reliability

Ghost sessions are a real risk. The MVP therefore requires:

- `brain.heartbeat`
- session TTL
- timeout auto-close
- exposure of timed-out sessions in active context so the next platform can see recent drift

## Gemini Protection

Gemini remains direct-to-Google by design.

`jules-cli.py` is not to be wrapped, proxied, or routed through BRAIN. Gemini participation in BRAIN is sidecar-only:

- check-in
- audit visibility
- exit logging

BRAIN must not sit inline in Gemini's API path.

## Auth / Registry Model

For HTTP mode, BRAIN uses:

- bearer token per platform per node
- IP-aware matching
- token hashes only in registry data

For stdio mode, auth is implicit in local process spawn and the platform still declares:

- `platform_id`
- `node_id`
- `target_paths`

## Data Storage

### Git-tracked truth

- `AGENTS.md`
- `CLAUDE.md`
- `memory/*.md`
- `briefings/*.md`

### Operational state

- SQLite database for sessions, actions, and audit index
- append-only JSONL logs for forensic audit

## Phase 2 Candidates

- `brain.whoTouched(path)`
- exit drift audit using `git status` and `git diff --stat`
- orchestration handoff chain logging
- node health cache
- Iron Wall path validator
- optional human approval / elevation flow

## Non-Negotiable Display Rule

Every BRAIN response must plainly preserve the boundary:

- `AGENTS.md` is canonical
- Josh is sole authority
- BRAIN is telemetry and shared operational context only

