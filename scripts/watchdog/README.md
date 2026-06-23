# ANTIGRAVITY · node watchdog

> **Goal:** stop the drift loop. Every node auto-starts the same Claude
> baseline at logon; a sentry per node writes health JSON to the OneDrive
> Personal Vault; a single always-on dashboard on the mini-ASUS display
> renders green/red blocks across every node, every Hermes, every aspect of
> every service. Josh sees red, Josh tells Claude. Otherwise hands-off.
>
> **Memory protection:** two layers — Windows file ACLs (`lock-memory.ps1`)
> + a Claude-runtime hook (`memory-protection-hook.sh` wired in
> `.claude/settings.json`). First-party Claude.ai can override either layer.
> Third-party wrappers (Manus, Emergent, etc.) cannot.

## Files

| File | Purpose |
|---|---|
| `bootstrap-claude-node.cmd` | Per-node auto-start at user logon. Kills rogue agents, `git pull`, brings up Docker stack (T5500 only), starts Hermes router + sentry. |
| `sentry.py` | Health watchdog. Every 60s, writes `~/OneDrive/Personal Vault/sentry-<HOSTNAME>.json` with ports + Docker container + URL liveness checks. |
| `dashboard.html` | Static dashboard. Reads all `sentry-*.json` files from the same directory. Auto-refreshes every 30s. No build step. |
| `serve-dashboard.cmd` | Mini-ASUS-only: starts a localhost HTTP server on `:7321` serving the Vault folder so the dashboard can fetch JSONs. Pin a browser tab to it on the always-on display. |
| `register-task.ps1` | One-shot installer. Registers either `ANTIGRAVITY-Bootstrap` (T5500 / Sabretooth / 9020) or `ANTIGRAVITY-Dashboard` (mini-ASUS) as a Windows Scheduled Task at logon. |
| `lock-memory.ps1` | Filesystem-level lock on protected memory files (Windows `attrib +R`). Survives non-Claude runtimes. |
| `memory-protection-hook.sh` | Claude-runtime hook that blocks Edit/Write on protected memory files unless `CLAUDE_AUTHORITY=first-party` is set. |

## Install — one node at a time

### On every regular node (T5500, Sabretooth, 9020):

```powershell
# 1. Ensure repo + Python + Docker Desktop installed
# 2. Open elevated PowerShell, then:
cd C:\Antigravity
git pull --ff-only origin main
pwsh scripts\watchdog\register-task.ps1 -Role node
pwsh scripts\watchdog\lock-memory.ps1
# Now reboot, OR:
Start-ScheduledTask -TaskName 'ANTIGRAVITY-Bootstrap'
```

Verify: within 60s, `~/OneDrive/Personal Vault/sentry-<HOSTNAME>.json` should
appear and update.

### On the mini-ASUS display PC:

```powershell
cd C:\Antigravity
git pull --ff-only origin main
pwsh scripts\watchdog\register-task.ps1 -Role display
Start-ScheduledTask -TaskName 'ANTIGRAVITY-Dashboard'
```

Then open `http://localhost:7321/dashboard.html` in a browser, full-screen it,
and pin the tab. That's the always-on view.

## What the dashboard shows (per node)

Each node card shows three groups of green/red checks:

- **ports** — ollama 11434, hermes-router 11435, brain-mcp 3900,
  mission-mcp 3901, postgres 5432, qdrant 6333, redis 6379, openclaw 3200
- **docker** — docker_engine + each of the 5 prod containers
  (`uandinotai-app-prod`, `uandinotai-postgres-prod`, `uandinotai-redis-prod`,
  `uandinotai-nginx-prod`, `uandinotai-backup`)
- **public surfaces** — youandinotai.com / onlinerecycle.org /
  ai-solutions.store / dashboard.aidoesitall.website, with **content
  verification by `<title>` fragment match**, not just HTTP 200 (Josh's "200
  ≠ verified" rule)

Card border turns amber if the sentry's last write is >3 minutes old, red if
>10 minutes — that's how Josh sees "sentry itself died" vs "service died."

## Uninstall

```powershell
pwsh scripts\watchdog\register-task.ps1 -Role node -Unregister
pwsh scripts\watchdog\register-task.ps1 -Role display -Unregister
pwsh scripts\watchdog\lock-memory.ps1 -Unlock
```

## Why this works

- **Memory protection** lives in two independent layers. A third-party
  runtime that doesn't load `.claude/settings.json` still hits the Windows
  read-only ACL and fails the write.
- **Sentry over OneDrive** needs no firewall holes, no cloud auth, no
  webhook. Every node already syncs OneDrive. The file is the bus.
- **Dashboard is static HTML + JSON fetch.** No build. No dependencies. Can
  be opened from any browser on the LAN if the mini-ASUS's `:7321` is
  reachable.
- **Bootstrap kills rogue agents first.** If Manus or Emergent launches
  itself at logon, this fires after (or alongside) and kills it. Same script
  on every node so behavior is identical.

## Adding more checks

Edit `sentry.py`:

- New port to check → add to `PORT_CHECKS`
- New Docker container → add to `DOCKER_CHECKS`
- New public surface → add to `URL_CHECKS` + optionally to
  `URL_TITLE_EXPECTATIONS` for content verification

Then `git push` from any node; bootstraps on the others pull it on next logon.

Business-only product operations
