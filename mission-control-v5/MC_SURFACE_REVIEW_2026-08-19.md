# Mission Control v5 Surface Review

> **Branch:** `manus/mc-surface`
> **Scope:** Static dashboard and service-contract hardening only. No service was started, no live health probe was executed, no runtime gate changed, and no branch was pushed, merged, or deleted.

## Summary

The v5 service contract now produces only these dashboard states: **UP**, **DOWN**, **WRONG SERVICE**, **AUTH MISSING**, **AUTH REJECTED**, and **NOT CONFIGURED**. Each status probe requires an explicit identity marker: a reachable HTTP responder cannot be considered UP merely because a port answered.

OpenClaw and Hermes defaults are aligned in v5 configuration and code at ports **18789** and **9119**, respectively. The retired FCC executor, comments, and retired script stubs were removed. A literal static scan found no remaining `fcc`, `fcc-opus`, `fcc-claude`, or `E:` path reference in v5 source or scripts, excluding configuration files.

Mission Control v6 was inspected as reference-only. It was not modified. Its checked port references already align with the requested OpenClaw and Hermes defaults, and no retired identifier or dead-path reference was found in the scoped scan.

## Changed Files

| Area | Files | Change |
|---|---|---|
| Service contract | `server/src/service-health.ts`, `server/src/service-health.test.ts`, `server/src/index.ts` | Identity-only probes, six exact status values, static health endpoint and expected-marker configuration, added focused status tests. |
| Dashboard client | `client/src/types.ts`, `client/src/components/ServicesPanel.tsx` | Exact six-state client contract and direct display of the server-issued state. |
| Defaults | `.env.example` | OpenClaw default corrected to 18789; Hermes remains 9119; documents non-secret health identity settings. |
| Retired routing | `server/src/omniroute.ts`, `server/src/swarm.ts`, `server/src/types.ts` | Removed retired executor identifier and ensured task defaults use defined agent identifiers only. |
| Scripts | `scripts/launch-stack.cmd`, `scripts/tab-llamacpp-embed.cmd`; deleted two retired tab stubs | Removed retired naming while retaining the blocked launcher behavior. |
| Tracking | `ClawX/todo.md` | Recorded the scope and completion state. |

## Verification

| Check | Result |
|---|---|
| Server `npm run typecheck` | **PASS** |
| Server `npm test` | **PASS** — 3 files, 14 tests |
| Client `npm run typecheck` | **PASS** |
| v5 literal retired-identifier scan | **PASS** — no matches |
| v5 dead `E:` path scan | **PASS** — no matches |
| Owned-file whitespace check | **PASS** |
| Live service probes, launchers, or persistent services | **NOT RUN** by design |

## Review Notes

The service contract deliberately reports **NOT CONFIGURED** when a health URL exists but no identity marker is defined. It reports **WRONG SERVICE** when the expected marker is absent or disagrees. This prevents a legacy or unrelated responder from appearing healthy.

The isolated worktree inherited two unrelated pre-existing modifications: `scripts/jules-cli.py` and `scripts/verify_implementation.py`. They are excluded from the staged branch work and must remain excluded during judge review.

The server `npm ci` command could not use the existing incomplete lockfile. Declared dependencies were installed with lifecycle scripts disabled and without writing the lockfile solely to run the requested static checks. No runtime process was started.
