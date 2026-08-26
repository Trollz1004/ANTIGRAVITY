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
| `:8642` | **UP** (restarted this session) | ox-alpha Hermes gateway |

Ollama's catalog was read rather than assumed, because doctrine says never to
presume a usable local model is present. **4 models**, so the fail-safe path is
real: `nomic-embed-text`, `rolandroland/llama3.1-uncensored`, `ornith-1.5:9b`,
`joshlcoleman/CFO-Until-No-Kid-In-Need`.

## The one open fault - CLOSED this session

`:8642` was not listening, which is why the board reported `ox-alpha` in `error`
with *"No inference provider configured."* Restarted:

```bash
hermes --profile paperclip-mc gateway run --replace --accept-hooks
```

Bound within ~20s. Verified by identity, not by the port answering:

```
GET http://127.0.0.1:8642/health   -> {"status":"ok","platform":"hermes-agent","version":"0.20.5"}
GET http://127.0.0.1:8642/api/health -> 404
```

That 404 confirms this build's quirk: the gateway serves **`/health`**, not
`/api/health`. A health check written against `/api/health` reports this gateway
down while it is running perfectly.

**Correction to an earlier draft of this file.** It concluded the provider config
"was never written into the profile." That was wrong, and inferred rather than
checked. `%LOCALAPPDATA%\hermes\profiles\paperclip-mc\` holds `config.yaml`
with `model.default: stealth/ox-alpha`, `model.provider: nous`, a `model.base_url`,
plus its own `auth.json` and `.env`. The config was complete the whole time. The
process was simply not running - the 2026-08-25 fix was real and did not survive
a restart, which is a supervision gap, not a configuration gap.

**The remaining question is durability, not configuration.** Nothing restarts this
gateway on boot or on crash. It will be down again after the next reboot unless
something supervises it.

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
