# OpenClaw handoff — Paperclip + Hermes proper setup + power-loss / restart survival

> Author: Opus 4.7. Surface: Sabretooth (`c:\Antigravity`). Goal: make Paperclip (`localhost:3100`) and Hermes Router (WSL Ubuntu, `localhost:11435`) come up cleanly on boot AND auto-recover if they crash mid-day.
> Context: post-Windows-restart on 2026-04-30. Docker Desktop is now installed. The prior handoff (`openclaw-handoff-2026-04-29.md`) already covers Ollama model pulls + hermes-router route probes — DO THAT FIRST, then this.

## Current state to verify (run all of these and report results)

```powershell
# Autostart artifacts present?
Test-Path "$env:APPDATA\Microsoft\Windows\Start Menu\Programs\Startup\Antigravity Mission Stack.cmd"
Test-Path "C:\Antigravity\scripts\autostart-mission.ps1"
Test-Path "C:\Antigravity\scripts\paperclip-watchdog.ps1"
Test-Path "C:\Users\joshl\.wslconfig"

# Are services actually listening?
Test-NetConnection localhost -Port 3100  -InformationLevel Quiet  # paperclip
Test-NetConnection localhost -Port 11435 -InformationLevel Quiet  # hermes router

# Is the paperclip watchdog still alive after the restart?
Get-CimInstance Win32_Process -Filter "Name='powershell.exe'" |
  Where-Object { $_.CommandLine -match 'paperclip-watchdog' } |
  Select-Object ProcessId, @{n='Cmd';e={$_.CommandLine.Substring(0,[Math]::Min(160,$_.CommandLine.Length))}} |
  Format-Table -AutoSize

# Hermes inside WSL?
wsl -d Ubuntu -- bash -lc 'pgrep -af hermes_router.py; ss -tlnp 2>/dev/null | grep 11435'
```

## Build the missing Hermes watchdog

Hermes has no health-check loop today. Paperclip has `scripts/paperclip-watchdog.ps1` doing TCP probes every 30s and restarting on failure — clone that pattern for Hermes.

Create `C:\Antigravity\scripts\hermes-watchdog.ps1` with this exact content:

```powershell
# Hermes Router watchdog — runs forever, hidden, no window.
# Checks localhost:11435 every 30s. If down, restarts via WSL.
$ErrorActionPreference = 'Continue'
$LogDir  = 'C:\Antigravity\logs'
$LogFile = "$LogDir\hermes-watchdog.log"
$Port    = 11435
$Check   = 30

New-Item -ItemType Directory -Force -Path $LogDir | Out-Null

function Log($m) {
    Add-Content -Path $LogFile -Value "[$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')] $m" -ErrorAction SilentlyContinue
}

function Test-Port($p) {
    try {
        $c = New-Object System.Net.Sockets.TcpClient
        $a = $c.BeginConnect('127.0.0.1', $p, $null, $null)
        $ok = $a.AsyncWaitHandle.WaitOne(2000, $false)
        $c.Close()
        return $ok
    } catch { return $false }
}

function Start-Hermes {
    Log 'Hermes DOWN — restarting in WSL.'
    Start-Process wsl -ArgumentList '-d','Ubuntu','--','bash','-lc',
      'nohup bash /mnt/c/Antigravity/scripts/start-hermes-router.sh > /tmp/hermes-router.log 2>&1 & disown' `
      -WindowStyle Hidden -ErrorAction SilentlyContinue
    Log 'Hermes start command issued.'
}

Log '====== Hermes Watchdog started ======'
while ($true) {
    if (-not (Test-Port $Port)) {
        Start-Hermes
        Start-Sleep -Seconds 20  # grace
    }
    Start-Sleep -Seconds $Check
}
```

## Wire it into autostart

Open `C:\Antigravity\scripts\autostart-mission.ps1`. Find the Paperclip Watchdog block (the section that starts `Get-CimInstance ... paperclip-watchdog`). Add an identical block for hermes-watchdog AFTER it:

```powershell
# ---------- 3b. Hermes Router Watchdog ----------
$hermesWatchdogScript = "$Repo\scripts\hermes-watchdog.ps1"
$hermesWatchdogRunning = $false
Get-CimInstance Win32_Process -Filter "Name='powershell.exe'" -ErrorAction SilentlyContinue |
    Where-Object { $_.CommandLine -match 'hermes-watchdog\.ps1' } |
    ForEach-Object { $hermesWatchdogRunning = $true }
if (-not $hermesWatchdogRunning) {
    Log 'starting Hermes watchdog (hidden)'
    Start-Process -FilePath 'powershell.exe' `
        -ArgumentList '-NonInteractive','-WindowStyle','Hidden','-ExecutionPolicy','Bypass','-File',$hermesWatchdogScript `
        -WindowStyle Hidden -ErrorAction SilentlyContinue
} else {
    Log 'Hermes watchdog already running'
}
```

## Smoke test: prove auto-recovery works

```powershell
# Start the new watchdog without rebooting
powershell.exe -NonInteractive -WindowStyle Hidden -ExecutionPolicy Bypass -File C:\Antigravity\scripts\hermes-watchdog.ps1

# Kill Hermes inside WSL — watchdog should revive it within ~60s
wsl -d Ubuntu -- pkill -f hermes_router.py

# Wait 75 seconds, then re-check
Start-Sleep 75
Test-NetConnection localhost -Port 11435 -InformationLevel Quiet  # expect True

# Same drill for Paperclip
Stop-Process -Id (Get-NetTCPConnection -LocalPort 3100 -State Listen -ErrorAction SilentlyContinue).OwningProcess -Force
Start-Sleep 75
Test-NetConnection localhost -Port 3100 -InformationLevel Quiet   # expect True
```

If either probe returns False, check the watchdog log: `Get-Content C:\Antigravity\logs\hermes-watchdog.log -Tail 20` and `Get-Content C:\Antigravity\logs\paperclip-watchdog.log -Tail 20`.

## Power-loss survival sequence

After this work, the recovery chain on cold boot is:
1. Power restored → Windows boots → user logs in.
2. `%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup\Antigravity Mission Stack.cmd` fires.
3. `autostart-mission.ps1` launches Docker Desktop, Hermes Router, Paperclip watchdog, **and now Hermes watchdog**, plus opens Claude Code.
4. Both watchdogs run forever. Anything dies → revived within ~30–60s.

That's the contract. Verify it holds.

## Commit + push when done

```bash
cd /mnt/c/Antigravity
git add scripts/hermes-watchdog.ps1 scripts/autostart-mission.ps1
git commit -m "feat(infra): hermes-watchdog + autostart wiring for power-loss survival

Co-Authored-By: OpenClaw <noreply@youandinotai.com>"
git push origin main
```

## Report back to Joshua (tight)

- Inventory pass: which paths exist, which ports were listening, watchdog PIDs
- Hermes watchdog: built and committed? Y/N
- Smoke test: did Hermes auto-recover within 75s? Did Paperclip?
- Anything unexpected (errors, hangs, route 404s)

Joshua forwards back to Opus when ready to continue.
