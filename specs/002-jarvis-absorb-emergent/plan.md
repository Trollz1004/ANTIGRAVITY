# Implementation Plan: JARVIS Absorbs the Emergent App (Phase B)

**Branch**: `002-jarvis-absorb-emergent` | **Date**: 2026-09-17 | **Spec**: `spec.md`

**Input**: Feature specification from `specs/002-jarvis-absorb-emergent/spec.md`

## Summary

Port the Emergent app's (`frontend/`, CRACO React, :3210) read-only
operational views into JARVIS (`ops/dashboard-jarvis`, :9150) as server-backed
panels, reusing Emergent's component names and behavior as a design reference
only (JARVIS is vanilla JS + a zero-dependency Node http server, not React).
Merge with existing JARVIS panels (Mission Control's service board, the
Spec Kit panel's markdown renderer) rather than duplicating them. Retire
nothing running today until every view has a real replacement.

## Technical Context

**Language/Version**: Node.js (ESM, zero runtime dependencies), vanilla JS client

**Primary Dependencies**: none new — `node:fs`, `node:child_process`, `node:http`/`fetch`

**Storage**: none (all reads are live filesystem/process/proxy reads)

**Testing**: vitest (`ops/dashboard-jarvis/tests/*.test.js`)

**Target Platform**: Windows (Sabretooth node), served on 0.0.0.0:9150

**Project Type**: web-service (single Node process serving static + JSON API)

**Performance Goals**: each new route responds within its own timeout budget
(4s for proxies, 60s cache for the ledger tail); no route blocks the event
loop beyond a bounded `spawnSync`/`spawn` call.

**Constraints**: relative URLs only in the client; no secret/session token
ever reaches the browser; no `git fetch` (ahead/behind uses local refs only).

**Scale/Scope**: 7 read-only panels, ~7 new `lib/*.mjs` modules, ~7 new test
files, one new "Ops" tab in `index.html` plus a merge into the existing
Mission Control tab for system status.

## Constitution Check

- One Repo, Main Only: all work lands under `C:\ANTIGRAVITY`, committed with
  explicit paths, no push. PASS
- Judge-Gated Delivery: this session proposes; it does not push/merge. PASS
- Business-Only Customer Copy: JARVIS is an internal operator surface, not a
  customer surface; still runs the restricted-word grep before each commit. PASS
- No Keys In Code Or Client: Hermes/OpenClaw proxies strip cookies/session
  headers server-side; ledger/runbook/git reads carry no secret. PASS
- Identity Over Ports: Hermes/OpenClaw panels report reachable+TCP or
  UP/DOWN from a real probe, never a bare port-open assumption. PASS
- Right Model For The Work: mechanical panel/test scaffolding, Sonnet-suitable. PASS
- Tests Ship With The Feature: one test file per new lib module plus one for
  the client renderer. PASS
- Recorded Numbers Only: every panel shows its source path/command; ledger
  and git panels show the exact error string on failure, never a fake row. PASS

## Panel -> Route -> Module Map

| Panel | Route(s) | Module | Data source |
|---|---|---|---|
| Mission ribbon | `GET /api/mission-ribbon` | `lib/mission-ribbon.mjs` | `CLAUDE.md`, `.agents/journals/paperclip-judge/STATE.md` |
| Task commander | `GET /api/task-commander` | `lib/task-commander.mjs` | `specs/*/tasks.md` |
| Git panel | `GET /api/git-panel` | `lib/git-panel.mjs` | `git` in `C:\ANTIGRAVITY` and `C:\Users\joshi\hermes` |
| Hermes router | `ANY /api/proxy/hermes/*`, `GET /api/hermes-status` | `lib/session-proxy.mjs` | `http://127.0.0.1:9119` |
| OpenClaw support | `ANY /api/proxy/openclaw/*`, `GET /api/openclaw-status` | `lib/session-proxy.mjs` | `http://127.0.0.1:18789` |
| System status | merged into existing Mission Control tab | `lib/heartbeat.mjs` | `ops/heartbeat/sabretooth-health.json`, `health.log` |
| Runbook viewer | `GET /api/runbooks`, `GET /api/runbooks/:name` | `lib/runbooks.mjs` | `ops/runbook/*.md` |
| Ledger | `GET /api/ledger` | `lib/ledger.mjs` | `npm run fable -- ledger --tail 30` |

## Retirement note

Emergent (`frontend/`, :3210) and any launcher/cron that starts it are
inventoried (`grep -rn "3210\|launch-emergent" scripts ops`) and reported;
`ops/runbook/SABRETOOTH-NODE-RUNBOOK.md` gets a one-line note that its views
now live in JARVIS. No launcher is edited as part of this feature unless it
is trivially a dead reference.
