# Test Gate Review

> **Branch:** `manus/mc-test-gate`

## Summary

The v5 root now exposes a single fail-closed command:

```sh
npm run gate
```

It runs server type checking, client type checking, the complete server suite, the complete client unit suite, and the role-wall static check in sequence. Any failing command stops the gate with a nonzero status.

The server lockfile now resolves the declared Vitest development dependency under a clean `npm ci` install. The client lockfile includes its declared Playwright test package, but end-to-end execution is blocked in code until `MISSION_CONTROL_RUNTIME_GATE=LANDED_BY_JUDGE` is supplied.

## Changed Files

| Area | Files | Change |
|---|---|---|
| Root gate | `package.json`, `scripts/require-runtime-gate.mjs` | Adds `npm run gate` and a separate runtime-gated end-to-end command. |
| Server test repair | `server/package-lock.json` | Locks the declared Vitest development dependency for reproducible clean installs. |
| Client test support | `client/package.json`, `client/package-lock.json`, `client/vite.config.ts` | Adds Playwright as a test dependency and excludes runtime-gated specs from Vitest unit runs. |
| End-to-end specifications | `client/playwright.config.ts`, `client/e2e/*.spec.ts` | Adds CI-ready council and dashboard specifications with no service launcher and an explicit runtime-gate skip. |
| Pull-request CI | `.github/workflows/v5-test-gate.yml` | Installs locked server/client dependencies and runs the root gate only. |
| Tracking | `ClawX/todo.md` | Records completed scope and pending package step. |

## Verification

| Check | Result |
|---|---|
| Clean server `npm ci --ignore-scripts` | **PASS** |
| Clean client `npm ci --ignore-scripts` | **PASS** |
| Root `npm run gate` | **PASS** |
| Server unit suite | **PASS** — 5 files, 22 tests |
| Client unit suite | **PASS** — 1 file, 2 tests |
| Role-wall scan | **PASS** — 57 production source files scanned |
| Playwright specifications | **NOT EXECUTED** — runtime gate remains blocked |
| Services, launchers, or live probes | **NOT RUN** |

## Runtime Boundary

The Playwright configuration deliberately has no `webServer` field. Its two specifications are skipped unless the gate environment value is explicitly supplied; the root gate never invokes them. This keeps unit/static validation runnable in pull-request CI without creating or assuming a live service.

The worktree inherited unrelated modifications to `scripts/jules-cli.py` and `scripts/verify_implementation.py`. They are excluded from this branch work and must remain excluded during review.
