---
name: t5500-node
description: The finished state of the T5500 production node (192.168.0.15) and how to prove it. Load before touching any service, port, scheduled task, tunnel or watchdog on this node, and after every reboot.
---

# T5500 node: finished state

The T5500 is the only node and it is production. It is finished when `ops\t5500\verify-node.ps1` reports every line UP after a cold reboot, with nobody starting anything by hand.

## Prove it

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File C:\ANTIGRAVITY\ops\t5500\verify-node.ps1
```

Wait about 5 minutes after logon first (the keepalive stages settle in order). The script only reads. It writes `ops\t5500\node-final-state.json`. Any line that is not UP is the work list.

## What comes back by itself, and what brings it back

| Service | Port | Brought back by |
|---|---|---|
| Ollama (joshlcoleman/fable) | 11434 | keepalive (`ANTIGRAVITY T5500 Keepalive`, boot + logon + every 10 min, elevated) |
| PostgreSQL | 5432 | keepalive |
| Redis | 6379 | keepalive |
| Domains server | 9160 | keepalive |
| Date app frontend / API | 3200 / 8000 | keepalive |
| Cloudflare tunnel | — | keepalive (`~\.cloudflared\config.yml`) |
| Hermes support desk | — | keepalive |
| Paperclip (installed, idle; real work on another node) + its DB | 3917 / 54329 | `ANTIGRAVITY Paperclip` (never elevated) + keepalive |
| OmniRoute | 20128 | `ANTIGRAVITY OmniRoute` |
| Mission Control (JARVIS/OPSIS) | 3130 | `ANTIGRAVITY Mission Control` |
| Hermes = JARVIS (dashboard for Mission Control :3130; Hermes is fixing it) | 9119 | `ANTIGRAVITY Hermes Dashboard` |
| Hermes Telegram gateway | — | `Hermes_Gateway` |
| Hermes gateway API (A2A, adapters) | 8643 | same `Hermes_Gateway` process; `platforms.api_server` in `%LOCALAPPDATA%\hermes\config.yaml` |
| OpenClaw sentry window (watchdog) | — | `ANTIGRAVITY Agent Windows` (opens `openclaw-sentry.ps1` and `hermes-support.ps1`, reopens if closed) |
| Hermes watch cron `T5500 node watch` | — | Hermes gateway cron, every 10 min. Not a sentry duty since 2026-10-17 (OpenClaw is the only sentry); switching it off is Joshua's call |
| YouTube daily video | — | `HermesDailyVideo` (06:30) or Hermes cron, never both |
| Obsidian REST (vault `C:\ANTIGRAVITY\Antigravity`) | 27123 | Obsidian app at logon |

The keepalive also probes Supabase, Supermemory and Vercel and writes everything to `ops\t5500\status.json`.

## Who may touch the node

- **The keep-alive heals; OpenClaw and Hermes watch, 100%** (Joshua, 2026-10-15). OpenClaw's sentry window restarts the keep-alive if it stalls. Hermes's cron messages Joshua only when something stays broken. Codex no longer watches the node.
- **Hermes (OPSIS)** runs support, the YouTube cron and Mission Control's brain. It does not rebuild the node.
- **Gemini** works only in `mission-os/`; Claude validates and lands it.
- **The 100% rule:** not 100% proven, not pushed; not validated by Claude, not merged.
- **Marketing agents in Paperclip** (and Emergent) work on posts, affiliate links and URLs. They have no reason to touch the node, its services or its code, and they do not.
- Code changes land through a pull request, one branch per repo, branch deleted after merge.

## Hard rules

- No tunnel route for untilnokidinneed.com or any mission page until Joshua names a partner (CLAUDE.md). The check reports it.
- Never probe, start or route to Alienware, Sabretooth or the old boxes.
- No `ANTHROPIC_API_KEY`. CLI lanes are login/OAuth only.
- Paperclip's embedded Postgres refuses to run as admin, so Paperclip is never started elevated.
