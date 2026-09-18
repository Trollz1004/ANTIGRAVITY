# Implementation Plan: JARVIS Phase D+E — Judge Lanes, Fleet, Architecture

**Branch**: `005-jarvis-judge-fleet-architecture` | **Date**: 2026-09-17 | **Spec**: `spec.md`

**Input**: Feature specification from `specs/005-jarvis-judge-fleet-architecture/spec.md`

## Summary

Add three read-mostly panels to the existing JARVIS server (`mission-control/`):
a Judge Lanes proposal kind + verdict routes reusing Phase C's proposal store
and inbox founder-approve control, a Fleet panel that probes the three
harness lanes and reads their journals, and an Architecture panel built from
the House stage table and rendered by archify. All three are additive to
`server.mjs`, `lib/`, `js/jarvis/`, `index.html`, and `css/jarvis.css`; no
existing route's behavior changes except `lib/inbox.mjs`'s `performAction`,
which gains one additional branch for judge-proposal EXECUTE and is
otherwise untouched (existing tests for the social path must keep passing
unmodified).

## Technical Context

**Language/Version**: Node.js (ESM, `"type": "module"`), zero framework —
matches the existing `mission-control/server.mjs` style exactly.

**Primary Dependencies**: Node's `node:http`, `node:child_process` (git,
archify CLI), `node:fs`. New: `archify` (npm, or `github:tt-a1i/archify` if
unpublished).

**Storage**: The existing JSONL proposal store (`lib/proposals.mjs`,
`mission-control/data/proposals/`) and JSONL audit log
(`mission-control/data/audit/`) — no new storage engine.

**Testing**: `vitest run` (existing `tests/*.test.js` convention: pure `lib/`
functions unit-tested with injected fs/exec/fetch, plus one
`*-routes.test.js` per unit asserting the exact wiring exists in
`server.mjs`/`index.html`, matching `tests/inbox-routes.test.js`).

**Target Platform**: Windows (Sabertooth node), Git Bash + PowerShell,
served on `:9150` through `server.mjs`.

**Project Type**: Single Node server + static client (`mission-control/`).

**Performance Goals**: Architecture HTML render capped at 20 s CLI timeout,
cached 5 minutes; every probe uses the existing per-request timeout pattern
(3–5 s) already used by `lib/nodes.mjs`/`lib/session-proxy.mjs`.

**Constraints**: No client-side provider keys; every secret redacted before
leaving the server; no `git fetch`/network calls from `lib/architecture.mjs`
or the diff-stat computation (read-only local git only); restricted-word
list applies to every new UI string, route, and file name.

**Scale/Scope**: One node, three harness lanes, one repo (`antigravity`) for
code review in this phase.

## Constitution Check

Matches the ratified rulings this repo already tracks in
`.specify/memory/constitution.md`: one repo, judge-only push/merge/delete
(this feature never pushes — it only records verdicts and lets the founder
mark EXECUTED), business-only copy (no customer-facing surface here), no
keys in the client, OmniRoute-only model access (not used by this feature —
no model call is made in this phase, verdicts are posted by the judges' own
sessions per the dispatch), Sonnet for tasks. No deviation requested.

## Project Structure

### Documentation (this feature)

```
specs/005-jarvis-judge-fleet-architecture/
├── spec.md
├── plan.md
└── tasks.md
```

### Source additions (repository root: `mission-control/`)

```
lib/
├── proposals.mjs      # EDIT: accept extra fields on create()
├── inbox.mjs           # EDIT: judge-proposal EXECUTE branch in performAction
├── judge.mjs            # NEW: diff-stat compute, feed builder, verdict transitions
├── fleet.mjs             # NEW: harness probes, journal tail parse, OmniRoute usage discovery
└── architecture.mjs      # NEW: typed JSON builder + archify CLI shell-out + fallback HTML

server.mjs               # EDIT: wire /api/judge/*, /api/fleet, /api/architecture*

js/jarvis/
├── judge.js              # NEW: Judge Lanes panel
├── fleet.js               # NEW: Fleet rows in the Mission Control panel
└── architecture.js        # NEW: Architecture panel (iframe + refresh)

index.html                # EDIT: nav tabs + panel markup for the three units
css/jarvis.css            # EDIT: judge verdict columns, JUDGED badge, architecture iframe

tests/
├── judge.test.js / judge-routes.test.js
├── fleet.test.js / fleet-routes.test.js
└── architecture.test.js / architecture-routes.test.js

README.md                 # EDIT: panel/route list
```

**Structure Decision**: Extend the existing `mission-control/` server in
place — this is a phase of an already-running dashboard, not a new project.

## Complexity Tracking

No constitution violation requiring justification.
