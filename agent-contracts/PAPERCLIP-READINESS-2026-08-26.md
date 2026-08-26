# Paperclip readiness check — 2026-08-26

Not a port ping. Every row was measured, and identity was checked before status
was believed (operating rule 7: *a port answering is not identity*).

## Mission Control — READY

| Check | Result |
|---|---|
| Identity | `GET /api/openapi.json` → `.info.title == "Paperclip API"`, **526 routes** |
| Health | `status: ok`, `2026.824.0`, `local_trusted`, `deploymentExposure: private` |
| Auth wiring | `authReady: true`, `bootstrapStatus: ready` |
| Auth **enforced** | `GET /api/agents/me` anonymous → **401**. The gate rejects, it does not merely exist. |
| Uptime | since `2026-08-26T13:18:32Z` |
| CEO bridge `:3140` | **UP** — `paperclip-freebuff-ceo-bridge`, `/heartbeat` → 401 without a token |

Both agents that read as red in the last session are explained: the CEO bridge is
up and its 401 is the token gate working, not a fault.

## Dependencies

| Port | State | Role |
|---|---|---|
| `:20128` | **UP** (HTTP 307) | OmniRoute — worker model gateway |
| `:11434` | **UP** | Ollama — fail-safe only |
| `:9119` | **UP** | Hermes |
| `:8000` | **UP** | Date-app backend |
| `:8642` | **DOWN** | **ox-alpha Hermes gateway — the one real gap** |

Ollama's catalog was read rather than assumed, because doctrine says never to
presume a usable local model is present. **4 models**, so the fail-safe path is
real: `nomic-embed-text`, `rolandroland/llama3.1-uncensored`, `ornith-1.5:9b`,
`joshlcoleman/CFO-Until-No-Kid-In-Need`.

## The one open fault

**`:8642` is not listening.** That is `ox-alpha`'s gateway, and it is why the
board reports that agent in `error` with *"No inference provider configured."*
The Hermes bot briefing recorded this as fixed on 2026-08-25 — the fix did not
survive a restart. Paperclip itself is healthy; the bot's own gateway is down.

Restart with the profile that owns it, then re-verify:

```bash
hermes --profile paperclip-mc gateway run --replace --accept-hooks
curl -s http://127.0.0.1:8642/health     # this build serves /health, NOT /api/health
```

A profile needs its own `model.default`, `model.provider`, `model.base_url` and
its own `auth.json`, or every dispatched run fails with `hermes_gateway_run_failed`.
That is the exact failure recorded and "fixed" before; a fix that does not survive
a restart is a config that was never written to the profile.

## Verdict

**Paperclip is READY.** It is up, correctly identified, auth-enforcing, and its
model gateway and fail-safe are both live. The only broken thing is one agent's
own gateway on `:8642`, which is an ox-alpha problem and not a Mission Control
problem.

## Scope note

Readiness ≠ coverage. This file says Paperclip is *running properly*. Whether it
*replaces* the local control planes is measured separately in
`PAPERCLIP-COVERAGE-RULING-2026-08-26.md` — and the short answer there is: it
covers approvals and decisions, does **not** cover the council vote engine or the
role wall, and only partially covers uptime. Do not retire a control plane on the
strength of this file.
