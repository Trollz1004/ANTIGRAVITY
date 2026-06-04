# Sabretooth cockpit cleanup + verify — ELEVATED admin one-shot.
#
# What this does (idempotent — safe to re-run any time):
#   1. Kills the stale "Unified OpenCode Launcher for Paperclip CEO" cmd
#      window if it's still around (PID lookup, no hard-coded id).
#   2. REPOINTS the legacy `ANTIGRAVITY-Paperclip-Bootstrap` scheduled task
#      to fire the canonical bootstrap.cmd instead of the old opencode
#      launcher. The task is preserved (not deleted) so Windows keeps a
#      stable record; it just does something useful now.
#   3. Recreates `MissionControlAPI` and `MissionControlWatchdog` tasks
#      with `--host 0.0.0.0 --port 8787` (in case they drifted).
#   4. Ensures the Startup-folder shortcut points at autostart-mission.ps1.
#   5. Re-points `scripts/bootstrap-paperclip-ceo.ps1` to a thin wrapper
#      that calls our canonical start-paperclip.ps1 (kept alive in case
#      anything still references the old name).
#   6. Opens the three cockpit URLs in the default browser:
#        http://localhost:8787/   (Mission Control dashboard)
#        http://localhost:3100/   (Paperclip HQ)
#        http://localhost:18789/  (OpenClaw Gateway)
#   7. Prints /health/all summary so you can see it green at the end.
#
# Usage: right-click PowerShell -> Run as Administrator, then:
#   C:\Antigravity\scripts\sabretooth-cleanup-final.ps1
# Or paste the whole file body in.
#
# Cloudflare paperclip-hq tunnel is intentionally NOT touched — cockpit
# stays local per Joshua's standing memory.

$ErrorActionPreference = 'Continue'

# ---- 0. elevation guard ----
$isAdmin = ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole(
    [Security.Principal.WindowsBuiltInRole]::Administrator
)
if (-not $isAdmin) {
    Write-Host 'FAIL: must run from an ELEVATED PowerShell.' -ForegroundColor Red
    Write-Host '  Right-click PowerShell -> Run as Administrator, then re-run.' -ForegroundColor Yellow
    return
}

$Repo = 'C:\Antigravity'
Write-Host ''
Write-Host '=== Sabretooth cockpit cleanup ===' -ForegroundColor Cyan

# ---- 1. kill stale OpenCode CEO launcher windows ----
Write-Host ''
Write-Host '[1/7] killing stale OpenCode CEO launcher cmd windows...' -ForegroundColor Cyan
$stale = Get-Process -ErrorAction SilentlyContinue | Where-Object {
    $_.MainWindowTitle -match 'OpenCode Launcher for Paperclip CEO|opencode-unified|bootstrap-paperclip-ceo'
}
if ($stale) {
    foreach ($p in $stale) {
        Write-Host ("  killing PID {0} '{1}'" -f $p.Id, $p.MainWindowTitle) -ForegroundColor Yellow
        Stop-Process -Id $p.Id -Force -ErrorAction SilentlyContinue
    }
} else {
    Write-Host '  no stale launcher windows present' -ForegroundColor DarkGreen
}

# ---- 2. repoint ANTIGRAVITY-Paperclip-Bootstrap task ----
Write-Host ''
Write-Host '[2/7] repointing ANTIGRAVITY-Paperclip-Bootstrap to canonical bootstrap.cmd...' -ForegroundColor Cyan
$existing = Get-ScheduledTask -TaskName 'ANTIGRAVITY-Paperclip-Bootstrap' -ErrorAction SilentlyContinue
if ($existing) {
    $action = New-ScheduledTaskAction `
        -Execute 'cmd.exe' `
        -Argument "/c `"$Repo\bootstrap.cmd`"" `
        -WorkingDirectory $Repo
    $trigger = New-ScheduledTaskTrigger -AtLogOn
    $trigger.Delay = 'PT30S'
    $settings = New-ScheduledTaskSettingsSet `
        -StartWhenAvailable -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries `
        -ExecutionTimeLimit (New-TimeSpan -Hours 1)
    $principal = New-ScheduledTaskPrincipal -UserId $env:USERNAME -LogonType S4U -RunLevel Limited
    Set-ScheduledTask `
        -TaskName 'ANTIGRAVITY-Paperclip-Bootstrap' `
        -Action $action -Trigger $trigger -Settings $settings -Principal $principal | Out-Null
    Write-Host '  repointed -> bootstrap.cmd (now part of the canonical chain)' -ForegroundColor Green
} else {
    Write-Host '  task not found; creating fresh one pointing at bootstrap.cmd' -ForegroundColor Yellow
    $action = New-ScheduledTaskAction -Execute 'cmd.exe' -Argument "/c `"$Repo\bootstrap.cmd`"" -WorkingDirectory $Repo
    $trigger = New-ScheduledTaskTrigger -AtLogOn
    $trigger.Delay = 'PT30S'
    $settings = New-ScheduledTaskSettingsSet -StartWhenAvailable -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -ExecutionTimeLimit (New-TimeSpan -Hours 1)
    $principal = New-ScheduledTaskPrincipal -UserId $env:USERNAME -LogonType S4U -RunLevel Limited
    Register-ScheduledTask -TaskName 'ANTIGRAVITY-Paperclip-Bootstrap' -Action $action -Trigger $trigger -Settings $settings -Principal $principal -Force | Out-Null
    Write-Host '  created' -ForegroundColor Green
}

# ---- 3. recreate MissionControlAPI + MissionControlWatchdog (idempotent) ----
Write-Host ''
Write-Host '[3/7] ensuring MissionControlAPI + MissionControlWatchdog tasks are correct...' -ForegroundColor Cyan
$apiAction = New-ScheduledTaskAction `
    -Execute 'python.exe' `
    -Argument '-m uvicorn mission_control_api.main:app --host 0.0.0.0 --port 8787' `
    -WorkingDirectory "$Repo\services\mission-control-api"
$wdAction = New-ScheduledTaskAction `
    -Execute 'powershell.exe' `
    -Argument "-NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -File `"$Repo\scripts\mission-control-watchdog.ps1`""
$tBoot = New-ScheduledTaskTrigger -AtStartup
$tLogon = New-ScheduledTaskTrigger -AtLogOn
$alwaysOn = New-ScheduledTaskSettingsSet `
    -RestartCount 999 -RestartInterval (New-TimeSpan -Minutes 1) `
    -StartWhenAvailable -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries `
    -ExecutionTimeLimit (New-TimeSpan -Days 0)
$principal = New-ScheduledTaskPrincipal -UserId $env:USERNAME -LogonType S4U -RunLevel Limited

Register-ScheduledTask -TaskName 'MissionControlAPI' `
    -Action $apiAction -Trigger @($tBoot, $tLogon) -Settings $alwaysOn -Principal $principal `
    -Description 'MC API on 0.0.0.0:8787 — auto-restart on crash' -Force | Out-Null
Write-Host '  MissionControlAPI registered (boot + logon, restart 999, no time limit)' -ForegroundColor Green

Register-ScheduledTask -TaskName 'MissionControlWatchdog' `
    -Action $wdAction -Trigger @($tBoot, $tLogon) -Settings $alwaysOn -Principal $principal `
    -Description 'MC API watchdog — polls every 30s, restarts on death' -Force | Out-Null
Write-Host '  MissionControlWatchdog registered' -ForegroundColor Green

# ---- 4. Startup-folder shortcut points at autostart-mission.ps1 ----
Write-Host ''
Write-Host '[4/7] verifying Startup-folder shortcut...' -ForegroundColor Cyan
$startup = "$env:APPDATA\Microsoft\Windows\Start Menu\Programs\Startup"
$shortcutPath = "$startup\Antigravity Mission Stack.cmd"
if (-not (Test-Path $shortcutPath)) {
    @"
@echo off
REM Thin wrapper so the Startup folder shortcut runs autostart-mission.ps1 silently.
start "" /min powershell.exe -NonInteractive -WindowStyle Hidden -ExecutionPolicy Bypass -File "$Repo\scripts\autostart-mission.ps1"
"@ | Set-Content -Path $shortcutPath -Encoding ASCII
    Write-Host "  created $shortcutPath" -ForegroundColor Green
} else {
    Write-Host "  $shortcutPath already present" -ForegroundColor DarkGreen
}

# ---- 5. neutralize bootstrap-paperclip-ceo.ps1 (legacy name still callable) ----
Write-Host ''
Write-Host '[5/7] rewriting bootstrap-paperclip-ceo.ps1 as a thin wrapper to canonical chain...' -ForegroundColor Cyan
$legacyPs1 = "$Repo\scripts\bootstrap-paperclip-ceo.ps1"
$wrapper = @"
# Legacy entry point — kept for any external task/shortcut that still calls it.
# All real work lives in start-paperclip.ps1 (single source of truth).
# Date repointed: 2026-05-06 by sabretooth-cleanup-final.ps1
& '$Repo\scripts\start-paperclip.ps1'
"@
$wrapper | Set-Content -Path $legacyPs1 -Encoding UTF8
Write-Host "  $legacyPs1 -> wrapper around start-paperclip.ps1" -ForegroundColor Green

# ---- 6. open the three cockpit URLs ----
Write-Host ''
Write-Host '[6/7] opening cockpit URLs in default browser...' -ForegroundColor Cyan
foreach ($url in 'http://localhost:8787/', 'http://localhost:3100/', 'http://localhost:18789/__openclaw__/canvas/') {
    Start-Process $url -ErrorAction SilentlyContinue
    Write-Host "  opened $url" -ForegroundColor Green
}

# ---- 7. print final state ----
Write-Host ''
Write-Host '[7/7] final state' -ForegroundColor Cyan
Write-Host ''
Write-Host '--- our scheduled tasks ---' -ForegroundColor Yellow
Get-ScheduledTask | Where-Object { $_.TaskName -in @('MissionControlAPI', 'MissionControlWatchdog', 'MissionControlWatchdog' -ne $null, 'ANTIGRAVITY-Paperclip-Bootstrap') } |
    Format-Table TaskName, State -AutoSize
Write-Host ''
Write-Host '--- :8787 listener (should be 0.0.0.0) ---' -ForegroundColor Yellow
Get-NetTCPConnection -LocalPort 8787 -State Listen -ErrorAction SilentlyContinue |
    Format-Table LocalAddress, LocalPort, OwningProcess -AutoSize
Write-Host ''
Write-Host '--- /health/all summary ---' -ForegroundColor Yellow
try {
    $r = Invoke-WebRequest -Uri 'http://localhost:8787/health/all' -TimeoutSec 30 -UseBasicParsing
    $j = $r.Content | ConvertFrom-Json
    Write-Host ("  ok={0}  degraded={1}  unreachable={2}" -f $j._summary.ok, $j._summary.degraded, $j._summary.unreachable) -ForegroundColor White
    foreach ($k in ($j | Get-Member -MemberType NoteProperty | Where-Object Name -ne '_summary').Name) {
        $st = $j.$k.status
        $color = if ($st -eq 'ok') { 'Green' } elseif ($st -eq 'degraded') { 'Yellow' } else { 'Red' }
        Write-Host ("    {0,-20} {1}" -f $k, $st) -ForegroundColor $color
    }
} catch {
    Write-Host ("  /health/all unreachable: {0}" -f $_.Exception.Message) -ForegroundColor Red
}
Write-Host ''
Write-Host '=== cleanup complete ===' -ForegroundColor Green
Write-Host ''
Write-Host 'Cockpit endpoints:' -ForegroundColor White
Write-Host '  http://localhost:8787/    Mission Control (UI + API)' -ForegroundColor Gray
Write-Host '  http://localhost:3100/    Paperclip HQ' -ForegroundColor Gray
Write-Host '  http://localhost:18789/   OpenClaw Gateway' -ForegroundColor Gray
Write-Host ''
Write-Host 'On reboot or power loss:' -ForegroundColor White
Write-Host '  - MissionControlAPI scheduled task fires at boot (before login)'  -ForegroundColor Gray
Write-Host '  - MissionControlWatchdog keeps it alive every 30s' -ForegroundColor Gray
Write-Host '  - autostart-mission.ps1 fires at user login (Startup folder)' -ForegroundColor Gray
Write-Host '  - ANTIGRAVITY-Paperclip-Bootstrap fires at logon +30s as a belt-and-suspenders kicker' -ForegroundColor Gray
