# OPENCLAW — T5500 node sentry, visible window (2026-10-09).
#
# Role: the watchdog. Hermes does customer support; OpenClaw does node health. Never both.
#
# The healing engine is ops\t5500\keepalive.ps1 (scheduled task "ANTIGRAVITY T5500 Keepalive",
# runs at boot before anyone logs in, probes every stage for real identity and heals in
# dependency order). This window is OpenClaw's face on the desktop and its second line:
#   - shows every stage and domain, refreshed on change and every 10 minutes
#   - streams each heal the moment the keepalive logs it
#   - if the keepalive itself stops or goes stale, restarts its scheduled task
#   - silent on routine heals; only a stage stuck for 20 passes is flagged (TRIGGERS.jsonl)
#
# Opened by ops\t5500\agent-windows.ps1 at logon and reopened if closed.
param()

$ErrorActionPreference = 'Continue'
$Host.UI.RawUI.WindowTitle = 'OPENCLAW - T5500 watchdog'
try { $Host.UI.RawUI.BackgroundColor = 'Black'; Clear-Host } catch {}

$Repo       = 'C:\ANTIGRAVITY'
$StatusFile = Join-Path $Repo 'ops\t5500\status.json'
$KeepLog    = Join-Path $Repo 'logs\t5500-keepalive.log'
$TaskName   = 'ANTIGRAVITY T5500 Keepalive'

function Say([string]$m, [string]$c = 'Gray') { Write-Host ('[{0}] {1}' -f (Get-Date -Format 'HH:mm:ss'), $m) -ForegroundColor $c }

function Show-Status {
    try { $s = Get-Content $StatusFile -Raw | ConvertFrom-Json } catch { Say 'status.json unreadable' 'Yellow'; return '' }
    $sig = ($s.stages | ForEach-Object { $_.status }) -join '|'
    Write-Host ''
    Write-Host ('  T5500 status  (keepalive pass {0})' -f $s.updated) -ForegroundColor Cyan
    foreach ($st in $s.stages) {
        $c = if ($st.status -in 'UP', 'HEALED') { 'Green' } elseif ($st.status -like 'WAITING*') { 'Yellow' } else { 'Red' }
        Write-Host ('   {0,-40} {1}' -f $st.stage, $st.status) -ForegroundColor $c
    }
    foreach ($d in $s.domains) {
        $c = if ($d.public -eq 'UP') { 'Green' } elseif ($d.public -like 'PENDING*') { 'DarkYellow' } else { 'Red' }
        Write-Host ('   {0,-40} origin {1}, public {2}' -f $d.domain, $d.origin, $d.public) -ForegroundColor $c
    }
    Write-Host ''
    return $sig
}

Say 'OpenClaw sentry online - watching T5500 (heals run silently; this window only shows them)' 'Cyan'
$lastSig = ''; $lastFull = Get-Date '2000-01-01'
$logPos = if (Test-Path $KeepLog) { (Get-Item $KeepLog).Length } else { 0 }

while ($true) {
    # 1. Keepalive engine alive and fresh?
    $task = Get-ScheduledTask -TaskName $TaskName -ErrorAction SilentlyContinue
    $age = if (Test-Path $StatusFile) { ((Get-Date) - (Get-Item $StatusFile).LastWriteTime).TotalMinutes } else { 999 }
    if (-not $task) {
        Say "keepalive task '$TaskName' is missing - cannot self-heal; tell Joshua" 'Red'
    } elseif ($task.State -ne 'Running' -or $age -gt 8) {
        Say ("keepalive not healthy (state {0}, status {1:N0} min old) - restarting it" -f $task.State, $age) 'Yellow'
        try { Stop-ScheduledTask -TaskName $TaskName -ErrorAction SilentlyContinue; Start-ScheduledTask -TaskName $TaskName; Say 'keepalive restarted' 'Green' }
        catch { Say ('restart failed: ' + $_.Exception.Message) 'Red' }
    }

    # 2. Stream new heal lines from the keepalive log.
    if (Test-Path $KeepLog) {
        $len = (Get-Item $KeepLog).Length
        if ($len -lt $logPos) { $logPos = 0 }   # rotated
        if ($len -gt $logPos) {
            try {
                $fs = [IO.File]::Open($KeepLog, 'Open', 'Read', 'ReadWrite')
                $fs.Seek($logPos, 'Begin') | Out-Null
                $sr = New-Object IO.StreamReader($fs)
                $new = $sr.ReadToEnd(); $sr.Close()
                $logPos = $len
                foreach ($l in ($new -split "`r?`n")) {
                    if (-not $l) { continue }
                    $c = if ($l -match 'HEALED|UP on') { 'Green' } elseif ($l -match 'still DOWN|error|failed') { 'Red' } elseif ($l -match 'DOWN|stopped|starting') { 'Yellow' } else { 'DarkGray' }
                    Write-Host $l -ForegroundColor $c
                }
            } catch {}
        }
    }

    # 3. Status table on change, and every 10 minutes regardless.
    $sig = ''
    try { $sig = ((Get-Content $StatusFile -Raw | ConvertFrom-Json).stages | ForEach-Object { $_.status }) -join '|' } catch {}
    if ($sig -ne $lastSig -or ((Get-Date) - $lastFull).TotalMinutes -ge 10) {
        $lastSig = Show-Status; $lastFull = Get-Date
    }

    Start-Sleep -Seconds 20
}
