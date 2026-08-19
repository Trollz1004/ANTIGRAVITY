# Vote Engine Review

> **Branch:** `manus/mc-vote-engine`

## Summary

The server now owns official vote handling in dedicated `official-vote-engine` and `official-vote-routes` modules. These files do not import the general operational bridge module or model-routing module. The general bridge module now exposes only operational targets, so it cannot select an official platform target or deliver a vote submission.

Every submission requires a server-supplied official bridge identity for the submitted platform. The submitted voter identity must match that resolved account identity. A mismatch is rejected before any event is appended.

Vote events are appended as newline-delimited JSON records with an actor, platform, timestamp, subject, decision, and binding flag. The implementation does not assume a fixed voter count. Events remain non-binding while the roster file is missing or invalid. Binding is enabled only by a valid roster document with a Joshua signoff and matching member identity.

## Changed Files

| File | Purpose |
|---|---|
| `server/src/official-vote-engine.ts` | Isolated identity, roster, append-only event, and submission contracts. |
| `server/src/official-vote-routes.ts` | Fail-closed HTTP routes with no general bridge or model-routing dependency. |
| `server/src/official-vote-engine.test.ts` | Isolation, mismatch rejection, append-only event, and roster-gate tests. |
| `server/src/bridge.ts` | General bridge now contains operational targets only. |
| `server/src/index.ts` | Registers the isolated vote route module. |
| `ClawX/todo.md` | Tracks the completed work and handoff requirement. |

## Verification

| Check | Result |
|---|---|
| Server `npm run typecheck` | **PASS** |
| Server `npm test` | **PASS** — 4 files, 18 tests |
| Vote-module import scan | **PASS** — no import of general bridge or model routing module |
| Event persistence scan | **PASS** — append-only write plus frozen event records |
| New-file vocabulary scan | **PASS** |
| Live services, probes, or launchers | **NOT RUN** |

## Required Decision

The roster remains intentionally unspecified. Before a binding decision can be recognized, Joshua must provide a roster document that includes a valid Joshua signoff, platform identifiers, and the corresponding official account identities. The default resolver is intentionally unavailable, so the HTTP route remains fail-closed until each per-platform official bridge supplies authenticated signed-in identity context.

## Review Boundary

The worktree inherited unrelated modifications to `scripts/jules-cli.py` and `scripts/verify_implementation.py`. They are excluded from this branch work and must remain excluded during review.
