# OPENCLAW — T5500 node sentry & fleet watchdog.
#
# Role: the watchdog. Hermes does customer support; OpenClaw does node health. Never both.
#
# Supports two modes:
#   - Interactive desktop window (default when launched by agent-windows.ps1)
#   - Headless background watchdog (-Headless, zero focus steal, zero popups; -Once for single pass; -NoTelegram for dry-runs)
# Never opens environment files on disk; child node-watchdog.mjs reads env vars by name only.
[CmdletBinding()]
param(
    [string]$RepoPath = '',
    [switch]$Headless,
    [switch]$Once,
    [switch]$NoTelegram,
    [int]$SleepSeconds = 60
)

$ErrorActionPreference = 'Continue'

if (-not $RepoPath) {
    $RepoPath = (Resolve-Path (Join-Path $PSScriptRoot '..\..')).Path
} elseif (Test-Path $RepoPath) {
    $RepoPath = (Resolve-Path $RepoPath).Path
}

$Repo          = $RepoPath
$StatusFile    = Join-Path $Repo 'ops\t5500\status.json'
$IncidentsFile = Join-Path $Repo 'ops\t5500\watchdog-incidents.json'
$FleetMapFile  = Join-Path $Repo 'ops\fleet\fleet-map.json'
$KeepLog       = Join-Path $Repo 'logs\t5500-keepalive.log'
$SentryLog     = Join-Path $Repo 'logs\openclaw-watchdog.log'
$TaskName      = 'ANTIGRAVITY T5500 Keepalive'
$WatchdogJs    = Join-Path $Repo 'mission-os\node-watchdog.mjs'

$NodeCmd = Get-Command node -ErrorAction SilentlyContinue
$NodeExe = if ($NodeCmd) { $NodeCmd.Source } elseif (Test-Path 'C:\Program Files\nodejs\node.exe') { 'C:\Program Files\nodejs\node.exe' } else { 'node' }

try {
    New-Item -ItemType Directory -Force -Path ([IO.Path]::GetDirectoryName($SentryLog)) | Out-Null
} catch {}

if (-not $Headless) {
    try {
        $Host.UI.RawUI.WindowTitle = 'OPENCLAW - T5500 watchdog'
        $Host.UI.RawUI.BackgroundColor = 'Black'
        Clear-Host
    } catch {}
}

function Write-SentryLog([string]$msg) {
    $line = '[{0}] {1}' -f (Get-Date -Format 'yyyy-MM-dd HH:mm:ss'), $msg
    try {
        if ((Test-Path $SentryLog) -and ((Get-Item $SentryLog).Length -gt 4MB)) {
            Move-Item $SentryLog ($SentryLog + '.1') -Force
        }
        Add-Content -Path $SentryLog -Value $line -ErrorAction SilentlyContinue
    } catch {}
}

function Say([string]$m, [string]$c = 'Gray') {
    Write-SentryLog $m
    if (-not $Headless) {
        Write-Host ('[{0}] {1}' -f (Get-Date -Format 'HH:mm:ss'), $m) -ForegroundColor $c
    } elseif ($Once) {
        Write-Output ('[{0}] {1}' -f (Get-Date -Format 'HH:mm:ss'), $m)
    }
}

function Show-Status {
    try { $s = Get-Content $StatusFile -Raw | ConvertFrom-Json } catch { Say 'status.json unreadable' 'Yellow'; return '' }
    $sig = ($s.stages | ForEach-Object { $_.status }) -join '|'
    if (-not $Headless) {
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
    }
    return $sig
}

Say ("OpenClaw sentry online (mode={0}, repo={1})" -f ($(if ($Headless) { 'headless' } else { 'interactive' }), $Repo)) 'Cyan'
$lastSig = ''
$lastFull = Get-Date '2000-01-01'
$logPos = if (Test-Path $KeepLog) { (Get-Item $KeepLog).Length } else { 0 }

while ($true) {
    # 1. Keepalive engine alive and fresh?
    $task = Get-ScheduledTask -TaskName $TaskName -ErrorAction SilentlyContinue
    $info = if ($task) { Get-ScheduledTaskInfo -TaskName $TaskName -ErrorAction SilentlyContinue } else { $null }
    $age = if (Test-Path $StatusFile) { ((Get-Date) - (Get-Item $StatusFile).LastWriteTime).TotalMinutes } else { 999 }
    $runAge = if ($info -and $info.LastRunTime) { ((Get-Date) - $info.LastRunTime).TotalMinutes } else { 999 }
    if (-not $script:LastRestart) { $script:LastRestart = Get-Date '2000-01-01' }
    $sinceRestart = ((Get-Date) - $script:LastRestart).TotalMinutes
    if (-not $task) {
        Say "keepalive task '$TaskName' is missing on this host" 'Yellow'
    } elseif ($task.State -ne 'Running' -or ($age -gt 8 -and $runAge -gt 8 -and $sinceRestart -gt 8)) {
        Say ("keepalive not healthy (state {0}, status {1:N0} min old, run {2:N0} min old) - restarting it" -f $task.State, $age, $runAge) 'Yellow'
        try {
            $script:LastRestart = Get-Date
            Stop-ScheduledTask -TaskName $TaskName -ErrorAction SilentlyContinue
            Start-ScheduledTask -TaskName $TaskName
            Say 'keepalive restarted' 'Green'
        } catch {
            Say ('restart failed: ' + $_.Exception.Message) 'Red'
        }
    }

    # 2. Run Mission OS D1 fleet node lights + 5-min Telegram watchdog pass.
    if (Test-Path $WatchdogJs) {
        try {
            $wdArgs = @(
                $WatchdogJs,
                '--once',
                '--fleet-map', $FleetMapFile,
                '--incidents-file', $IncidentsFile,
                '--status-file', $StatusFile
            )
            if ($NoTelegram) {
                $wdArgs += '--no-telegram'
            }
            $wdLines = & $NodeExe @wdArgs 2>&1
            foreach ($wl in @($wdLines)) {
                if ($wl) { Say ([string]$wl) 'Cyan' }
            }
        } catch {
            Say ('node-watchdog invocation failed: ' + $_.Exception.Message) 'Red'
        }
    } else {
        Say "node-watchdog.mjs not found at $WatchdogJs" 'Yellow'
    }

    # 3. Interactive-only log streaming and status display (never runs in -Headless).
    if (-not $Headless) {
        if (Test-Path $KeepLog) {
            $len = (Get-Item $KeepLog).Length
            if ($len -lt $logPos) { $logPos = 0 }
            if ($len -gt $logPos) {
                $fs = $null
                $sr = $null
                try {
                    $fs = [IO.File]::Open($KeepLog, 'Open', 'Read', 'ReadWrite')
                    $fs.Seek($logPos, 'Begin') | Out-Null
                    $sr = New-Object IO.StreamReader($fs)
                    $new = $sr.ReadToEnd()
                    $logPos = $len
                    foreach ($l in ($new -split "`r?`n")) {
                        if (-not $l) { continue }
                        $c = if ($l -match 'HEALED|UP on') { 'Green' } elseif ($l -match 'still DOWN|error|failed') { 'Red' } elseif ($l -match 'DOWN|stopped|starting') { 'Yellow' } else { 'DarkGray' }
                        Write-Host $l -ForegroundColor $c
                    }
                } catch {}
                finally {
                    if ($sr) { $sr.Dispose() } elseif ($fs) { $fs.Dispose() }
                }
            }
        }

        $sig = ''
        try { $sig = ((Get-Content $StatusFile -Raw | ConvertFrom-Json).stages | ForEach-Object { $_.status }) -join '|' } catch {}
        if ($sig -ne $lastSig -or ((Get-Date) - $lastFull).TotalMinutes -ge 10) {
            $lastSig = Show-Status
            $lastFull = Get-Date
        }
    }

    if ($Once) {
        break
    }

    Start-Sleep -Seconds $SleepSeconds
}
