# Mission Stack Bootstrap — One-Time Setup + Daily Use

## What this is

`c:\Antigravity\bootstrap.cmd` is the single entry point that brings up the entire Sabretooth cockpit. Double-click it any time. It's also wired to the Windows Startup folder so it fires automatically at login, and the same logic is invoked by the Windows Scheduled Tasks on boot.

## What it brings up (in dependency order)

| # | Phase | Port | Notes |
|---|---|---|---|
| 1 | Docker Desktop | — | Starts if not running, waits for daemon |
| 2 | paperclip-postgres | 127.0.0.1:5432 | Docker container, persistent volume `paperclip-pgdata` |
| 3 | Hermes Router (WSL) | 11435 | + watchdog process |
| 4 | Paperclip HQ | 3100 | + watchdog process; loads env from OneDrive vault |
| 5 | Mission Control API | 8787 | Verified (Scheduled Task starts it) |
| 6 | Mission Control Watchdog | — | Verified (Scheduled Task starts it) |
| 7 | OpenClaw browser-open | 18789 | Polls then opens canvas |
| 8 | Terminal windows | — | Claude Code (Windows) + Hermes TUI (WSL) |

## One-time setup (do this ONCE)

### 1. Postgres password lives in env vault

Paperclip's onboarding output has secrets like `PAPERCLIP_AGENT_JWT_SECRET` and `DATABASE_URL`. Append the entire export block to:

```
C:\Users\joshl\OneDrive\Personal Vault-Sabretooth\MASTER-UNIVERSAL-ENV-TROLLZ1004.env
```

The bootstrap reads this file at every Paperclip start. Keep it OneDrive-backed (already outside the repo per the wipe-and-clone rule).

### 2. Make bootstrap.cmd run at login (already done if you followed earlier steps)

Drop a shortcut to `c:\Antigravity\bootstrap.cmd` into:

```
C:\Users\joshl\AppData\Roaming\Microsoft\Windows\Start Menu\Programs\Startup
```

Or run once in PowerShell:

```powershell
$WshShell = New-Object -ComObject WScript.Shell
$Shortcut = $WshShell.CreateShortcut("$env:APPDATA\Microsoft\Windows\Start Menu\Programs\Startup\AntigravityBootstrap.lnk")
$Shortcut.TargetPath = 'C:\Antigravity\bootstrap.cmd'
$Shortcut.WorkingDirectory = 'C:\Antigravity'
$Shortcut.Save()
```

### 3. Scheduled Tasks (already done — verify)

Two Windows Scheduled Tasks run BEFORE login (so cockpit survives reboot when you're not at the desk):

- `MissionControlAPI` — boots the API on :8787
- `MissionControlWatchdog` — keeps the API alive, restarts on death

Verify they're registered:

```powershell
Get-ScheduledTask -TaskName 'MissionControlAPI', 'MissionControlWatchdog' | Format-List TaskName, State
```

Both should show `State : Ready`.

### 4. Auto-login (optional, for unattended boots)

If you want the cockpit to come up after a power loss when you're NOT at the desk to type your PIN, run **Sysinternals Autologon** once:

1. Download: https://learn.microsoft.com/en-us/sysinternals/downloads/autologon
2. Run `Autologon64.exe`, enter your local Windows password, click Enable
3. Next reboot → desktop loads automatically → bootstrap.cmd fires from Startup → cockpit is up before anyone touches the keyboard

## Daily use

```
Power on PC → wait 60-90 seconds → open browser to http://127.0.0.1:8787/
```

That's it. The Mission Control dashboard renders, Paperclip is at :3100, OpenClaw at :18789, all watchdogs running.

## When something breaks

| Symptom | Fix |
|---|---|
| Dashboard at :8787 says "API ok dashboard unbuilt" | `cd c:\Antigravity\apps\mission-control && pnpm build` |
| Paperclip panel red | `docker ps` — confirm `paperclip-postgres` is up. If not: `docker start paperclip-postgres` |
| Hermes Router red | `wsl -d Ubuntu -- pgrep -f hermes_router.py` — if empty, re-run bootstrap |
| Everything red | `c:\Antigravity\bootstrap.cmd` (just click it again — idempotent) |
| Stack Integrity 43% | Known: `opus-guardian.py` has stale `youandinotai-api/app/routers/` paths from pre-restructure. Cosmetic. |
| T5500 stack red | T5500 box is off. Power it on if you need the date-app stack. |

## Logs

```
c:\Antigravity\logs\autostart-YYYY-MM-DD.log              # bootstrap phases
c:\Antigravity\logs\paperclip-watchdog.log                # paperclip restarts
c:\Antigravity\logs\paperclip.log                          # paperclip server stdout
c:\Antigravity\logs\paperclip.stderr.log                   # paperclip server stderr
c:\Antigravity\logs\hermes-router.log                      # hermes router (WSL writes via tee)
c:\Antigravity\logs\mission-control-watchdog.log           # MC watchdog
```

`Get-Content <path> -Tail 30 -Wait` to live-tail any of them.

## Rollback

If the new bootstrap breaks something, the previous patchwork is captured in git history:

```
git log --oneline scripts/autostart-mission.ps1
git show <commit>:scripts/autostart-mission.ps1 > scripts/autostart-mission.ps1
```
