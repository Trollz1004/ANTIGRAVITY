# CODEX DIAGNOSTIC - 2026-05-20 - mini-asus watchdog

## Scope

Direct diagnostic for the MINI-ASUS-PC watchdog sentry display requested by Joshua on 2026-05-20. No implementation work was performed. This file records facts gathered from Sabretooth and MINI-ASUS-PC over SSH.

## Contract files loaded

- `briefings/FOUNDER-DOCTRINE-2026-05-19.md`
- `briefings/THE-WHEEL.md`
- `briefings/COWORKER-DISPATCH.md`
- `hermes/agents/AGENTS.md`
- `hermes/agents/MissionGuardian-Codex.md`
- `hermes/agents/CTO.md`
- `hermes/agents/CSO.md`
- `CLAUDE.md`
- `briefings/T5500-NODE-STATUS.md`

## MINI-ASUS-PC reachability

- Hostname: `AsusMiniPc16GBCeleron`
- User: `asusminipc16gbc\joshl`
- IPv4: `192.168.0.48/24` on Wi-Fi
- SSH service: running and listening on `0.0.0.0:22` and `:::22`
- Sabretooth TCP reachability to `192.168.0.48:22`: pass
- Sabretooth SSH key auth after admin authorized-key setup: pass
- Verified command: `ssh joshl@192.168.0.48 hostname`
- Verified output: `AsusMiniPc16GBCeleron`

## Current watchdog inventory

Current watchdog root:

- `C:\Users\joshl\OneDrive\Desktop\antigravity-watchdog`

Observed files include:

- `dashboard.html`
- `sentry.py`
- `sentry-daemon.cmd`
- `display-host.cmd`
- `serve-dashboard.cmd`
- `cloudflared.exe`
- `cloudflared-tunnel.cmd`
- `status\sentry-AsusMiniPc16GBCeleron.json`
- `status\sentry-DESKTOP-H4B53GL.json`

Observed running processes:

- `python.exe "C:\Users\joshl\OneDrive\Desktop\antigravity-watchdog\sentry.py"`
- `py.exe "C:\Users\joshl\OneDrive\Desktop\antigravity-watchdog\sentry.py"`
- `cmd.exe /c "C:\Users\joshl\OneDrive\Desktop\antigravity-watchdog\sentry-daemon.cmd"`
- `cloudflared.exe` from the same watchdog directory
- OpenClaw gateway node processes on port `18789`

Observed startup entry:

- `ANTIGRAVITY-Sentry.lnk` in the user Startup folder

## Why the display is not all-green

The current mini-asus sentry is node-local and file-hash oriented. It evaluates MINI-ASUS-PC as if Sabretooth/T5500 repo and service paths should exist locally. This produces expected red states rather than platform truth.

Observed red/yellow causes:

- MINI-ASUS-PC reports `C:\Antigravity` files missing, including `.claude\settings.json`, `.mcp.json`, `AGENTS.md`, `CLAUDE.md`, `GEMINI.md`, `briefings\FOUNDER-DOCTRINE-2026-05-19.md`, and memory files.
- MINI-ASUS-PC reports local service ports closed for `ollama_11434`, `hermes_router_11435`, `postgres_5432`, `qdrant_6333`, `redis_6379`, and `openclaw_3200`.
- T5500 status reports service ports open for `postgres_5432`, `qdrant_6333`, `redis_6379`, and `openclaw_3200`, but `docker_engine` false and expected Docker container names false.
- The dashboard is reading per-node sentry snapshots rather than a Sabretooth-owned aggregator that probes each service at its actual authoritative node.

Cloudflare public URLs in the current sentry snapshots were reachable with HTTP `200` for:

- `youandinotai.com`
- `onlinerecycle.org`
- `ai-solutions.store`
- `dashboard.aidoesitall.website`

## Secret material audit

Bounded path-only audit results:

- `C:\ANTIGRAVITY`: absent on MINI-ASUS-PC
- `C:\Antigravity`: absent on MINI-ASUS-PC
- `C:\Users\joshl\.ssh`: present
- `C:\Users\joshl\OneDrive\Desktop\antigravity-watchdog`: present
- `C:\Users\joshl\OneDrive\Personal Vault-Sabretooth`: present
- `C:\Users\joshl\OneDrive\Personal Vault-Sabretooth\MASTER-UNIVERSAL-ENV-TROLLZ1004.env`: present

Files observed in `Personal Vault-Sabretooth` by name only include:

- `.env`
- `.env.DATE-APP.env`
- `.env.DATE-APP.env.txt`
- `.env.txt`
- `HERMES9020-ENV-2026-05-18T043653Z.env`
- `HERMES9020-ENV-current.env`
- `MASTER-UNIVERSAL-ENV-TROLLZ1004.env`
- multiple `MASTER-UNIVERSAL-ENV-TROLLZ1004.env.bak-*` files
- `PAPERCLIP-OWNER-LOGIN-2026-03-31.txt`
- `sabretooth_to_asusmini_ed25519`

Browser credential stores exist by path only:

- `C:\Users\joshl\AppData\Local\Google\Chrome\User Data\Default\Login Data`
- `C:\Users\joshl\AppData\Local\Microsoft\Edge\User Data\Default\Login Data`

No secret values were read or printed.

## Critical finding

Severity: CRITICAL

Doctrine rule implicated: Rule 11, secrets in vault only.

The dispatch hard wall states: "NO secrets copied to MINI-ASUS-PC or any auxiliary node. Vault stays at C:\Users\joshl\OneDrive\Personal Vault-Sabretooth\MASTER-UNIVERSAL-ENV-TROLLZ1004.env on Sabretooth. The aggregator reads from vault on Sabretooth; mini-asus only sees aggregated JSON over LAN."

MINI-ASUS-PC currently has `C:\Users\joshl\OneDrive\Personal Vault-Sabretooth` present, including `MASTER-UNIVERSAL-ENV-TROLLZ1004.env` and multiple populated env-like files. This is a CSO-class finding and a Rule 11 violation risk.

## Stop condition

Per Joshua's dispatch: if secret material is found that should be vault-only, flag it as a critical CSO-class finding and refuse to proceed past diagnostics until Joshua approves remediation.

Implementation is therefore stopped here. Recommended remediation path for Joshua approval:

1. Remove the Sabretooth vault material from MINI-ASUS-PC.
2. Rotate any credentials that may have synced to MINI-ASUS-PC.
3. Keep the future aggregator on Sabretooth as the only runtime that reads the vault.
4. Let MINI-ASUS-PC consume only redacted health JSON over the local network.

## Actions not performed

- No architecture ADR was written.
- No aggregator service was scaffolded.
- No mini-asus display replacement was written.
- No CI workflow was added.
- No PR was opened.
- No production deploy was attempted.

