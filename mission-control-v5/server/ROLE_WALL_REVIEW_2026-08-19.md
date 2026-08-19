# Role Wall Review

> **Branch:** `manus/mc-role-wall`

## Summary

The active worker-lane contract is now fixed to **OpenClaw**, **Hermes**, and **OpenCode**. Swarm task creation and execution use that exact ordered set, preventing a retired executor identifier from appearing as a worker lane.

The server contains a typed judge-approval guard for protected Git actions. The audit found no harness-reachable push, merge, or branch-deletion command in the v5 server, swarm, or scripts. Existing materialization remains local-only and has no push, merge, or branch-deletion capability.

A dependency-free static checker now runs locally and in CI. It rejects official vote modules that import the general bridge or model-routing module, rejects retired bridge identifiers, rejects prohibited key-name or key-value patterns, and rejects source-level push, merge, or branch-deletion commands.

## Changed Files

| Area | Files | Change |
|---|---|---|
| Role contract | `server/src/role-wall.ts`, `server/src/agents.ts`, `server/src/swarm.ts` | Defines judge approval shape and exact worker lanes; uses those lanes for task creation and execution. |
| Static enforcement | `server/scripts/role-wall-check.mjs`, `server/package.json`, `.github/workflows/policy-guard.yml` | Adds local command and CI job for source-level role-wall enforcement. |
| Tests | `server/src/role-wall.test.ts` | Covers lane ordering, judge approval validation, vote-module isolation, retired identifiers, prohibited patterns, and Git-mutation detection. |
| Tracking | `ClawX/todo.md` | Records completed scope and pending handoff step. |

## Verification

| Check | Result |
|---|---|
| Server `npm run typecheck` | **PASS** |
| Server `npm test` | **PASS** — 5 files, 22 tests |
| Server `npm run role-wall` | **PASS** — 56 production source files scanned |
| CI configuration | **ADDED** — Policy Guard invokes the same dependency-free checker |
| Live services, probes, or launchers | **NOT RUN** |

## Boundary Notes

The role wall prevents source-level harness paths from initiating push, merge, or branch deletion. The server still does not itself perform those actions. Any future judge-only adapter must provide a valid `JudgeApproval` object for the requested protected action and remain outside the worker-lane modules.

The worktree inherited unrelated modifications to `scripts/jules-cli.py` and `scripts/verify_implementation.py`. They are excluded from this branch work and must remain excluded during review.
