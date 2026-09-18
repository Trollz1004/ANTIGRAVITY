# Vote Interface Review

> **Branch:** `manus/mc-vote-ui`
> **Base:** Step 2 vote-engine branch tip `99dea202`.

## Summary

The Mission Control client now has a dedicated **COUNCIL** tab that preserves the compact seat-board feel while remaining read-only. It renders official-seat connection state, active ballots, and immutable decision records. The seat board and the operational bridge chat are now separate surfaces: the bridge chat lists only Hermes and OpenClaw, while the council panel has no import, control, or API call for operational bridge sending.

The client read contract is mockable through `api.officialVoteView()`. Component tests use an injected mock loader, so no server or official bridge is contacted during verification.

## Changed Files

| Area | Files | Change |
|---|---|---|
| Council UI | `src/components/CouncilPanel.tsx`, `src/styles.css`, `src/App.tsx`, `src/components/Header.tsx` | Adds the separate seat board, active-ballot list, immutable decision log, responsive styling, and navigation tab. |
| Read contract | `src/types.ts`, `src/api.ts` | Adds official seat, ballot, decision-log, and roster types plus one read-only client method. |
| Operational boundary | `src/components/BridgePanel.tsx`, `src/types.ts` | Narrows the general bridge panel and its target type to Hermes/OpenClaw only. |
| Tests | `src/components/CouncilPanel.test.tsx`, `src/test/setup.ts`, `vite.config.ts`, `package.json`, `package-lock.json` | Adds a mocked jsdom component-test harness and a client test command. |
| Tracking | `ClawX/todo.md` | Records the completed scope and pending package step. |

## Verification

| Check | Result |
|---|---|
| Client `npm run typecheck` | **PASS** |
| Client `npm test` | **PASS** — 1 file, 2 mocked component tests |
| Council source operational-send scan | **PASS** — no bridge send, operational panel, or operational target reference |
| General bridge target scan | **PASS** — Hermes and OpenClaw only |
| New UI vocabulary scan | **PASS** |
| Live services, probes, or launchers | **NOT RUN** |

## Integration Dependency

Step 2 currently exposes roster status and a submission endpoint. It does not yet expose a read projection for seat state, active ballots, and event records. The client is intentionally implemented and tested against the stable `OfficialVoteView` read contract, but `GET /api/official-votes/view` must be added in the server integration step before the panel can populate from a real server response.

## Review Boundary

The worktree inherited unrelated modifications to `scripts/jules-cli.py` and `scripts/verify_implementation.py`. They are excluded from this branch work and must remain excluded during review.
