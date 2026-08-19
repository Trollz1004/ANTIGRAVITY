# ClawX and Mission Control Bridge & Health Contract — 2026-08-19

## Scope and Runtime Boundary

This branch implements source, tests, migrations, and documentation only. It does **not** change a live service, run a production migration, configure credentials, or open any gateway administration route. Runtime launch remains **NO-GO** until the authorized lane lands the documented S1 doctrine-supersession gate.

## Routing and Governance Boundary

| Area | Contract | Status | Evidence |
|---|---|---|---|
| Normal operational work | ClawX and Mission Control prefer the authenticated OpenAI-compatible OmniRoute bridge. | VERIFIED | `ClawX/src/server/ai-providers.ts` and `mission-control-v5/server/src/omniroute.ts` put the configured cloud bridge before the local fail-safe. |
| Local recovery | Ollama is reachable only through an explicit fail-safe contract and is not an implicit board-seat fallback. | VERIFIED | `callOllamaFailsafe()` is separate from `callProvider()`; Mission Control orders cloud routing before its fail-safe. |
| Official governance | Claude, Gemini, GitHub Copilot, Meta AI, ChatGPT/OpenAI, and Manus are visible as **official bridges**. Their governance votes cannot be sent through OmniRoute or a general-purpose bridge. | VERIFIED | ClawX blocks `bridgePurpose: 'governance'`; Mission Control reports official targets as visibility-only and rejects general-bridge sends to them. |
| Voter identity | A submitted voter slug must match the signed-in account's runtime email-to-voter mapping. | VERIFIED | `governance.votes.cast` validates `GOVERNANCE_VOTER_EMAIL_MAP` server-side and rejects mismatches. |

## Authenticated Runtime Configuration

Only variable names belong in this document. Values belong in the runtime environment and must never be copied into source, tests, logs, documentation, or client payloads.

| Purpose | Configuration names | Behavior when absent or rejected |
|---|---|---|
| Normal OmniRoute bridge | `OPENAI_COMPAT_BASE_URL` and either `OPENAI_COMPAT_API_KEY` or `OMNIROUTE_API_KEY` | The board seat is unavailable; the service health panel reports `AUTH MISSING` or `AUTH REJECTED` instead of a false UP/DOWN result. |
| Optional OmniRoute MCP process | `OMNIROUTE_MCP_STATUS_URL` | It is shown as an independent service card. Its absence remains `NOT CONFIGURED` and cannot mark the main gateway down. |
| Manus board seat via gateway | `BUILT_IN_FORGE_API_KEY` may provide the server-side authorization fallback when the gateway base is configured. | The Manus seat is unavailable rather than falsely marked ready. |
| Direct optional provider seats | `GEMINI_API_KEY`, `SONAR_API_KEY`, `XAI_API_KEY`, and `OPENAI_API_KEY` | Direct operation is optional and only applies where the supported provider adapter exists. |
| Hermes operational bridge | `HERMES_PORT` and `HERMES_BRIDGE_URL` | Visible as `NOT CONFIGURED` until a dedicated bridge URL is supplied. |
| OpenClaw operational bridge | `OPENCLAW_PORT` and optional `OPENCLAW_BRIDGE_URL` | The status preflight establishes whether the bridge can receive prompts. |
| Date App identity probe | `DATE_APP_HEALTH_URL` | The expected JSON marker is `status=ok|degraded`; any other response becomes `WRONG SERVICE`. |
| Session-voter binding | `GOVERNANCE_VOTER_EMAIL_MAP` | No voter identity is granted without an explicit mapping. |

## Service State Semantics

| State | Meaning | Example action |
|---|---|---|
| `UP` | The probe connected and, where specified, verified the expected service identity. | Continue observation. |
| `DOWN` | The port or route could not be reached, timed out, or returned a non-identity failure. | Repair reachability or start the intended service. |
| `WRONG SERVICE` | Something answered on the expected port but did not match the Date App health identity. | Stop or relocate the unexpected process; do not treat it as Date App health. |
| `AUTH MISSING` | The configured authenticated probe has no runtime authorization. | Configure the required runtime value. |
| `AUTH REJECTED` | A service answered but rejected the configured authorization. | Rotate/repair authorization without confusing it with a port outage. |

## Verification Record

| Check | Result | Evidence |
|---|---|---|
| ClawX server/client type-check | VERIFIED | `pnpm exec tsc --noEmit --project tsconfig.json` completed successfully after the provider, governance, schema, and UI changes. |
| ClawX provider tests | VERIFIED | `pnpm test -- --maxWorkers=1 --minWorkers=1`: 6 passing tests. |
| Mission Control server type-check | VERIFIED | `pnpm run typecheck` completed successfully after the health, bridge, and routing changes. |
| Mission Control health tests | VERIFIED | `pnpm test -- --maxWorkers=1 --minWorkers=1`: 4 passing tests for refused connection, wrong response identity, degraded correct identity, and missing authentication. |
| Live deployment / runtime configuration | UNVERIFIED | No production service was started, configured, migrated, or deployed from this branch. |
| Official-platform vote transport | UNVERIFIED | The targets are visible and isolated. Their platform-specific inbound/outbound bridges require authorized runtime integration and must never be replaced by OmniRoute. |
