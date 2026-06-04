# Mission stack unified bootstrap.
#
# Brings up the entire Sabretooth cockpit in dependency order:
#   1. Docker Desktop
#   2. WSL Hermes Router (:11435) + watchdog
#   3. Mission Control API (:8787) — verify only (Scheduled Task starts it)
#   4. Mission Control Watchdog — verify only (Scheduled Task starts it)
#   5. OpusHasHands hub (:4200)
#   6. OpenClaw Gateway browser-open (waits for :18789)
#   7. Claude Code + Hermes TUI windows in Windows Terminal
#
# NOTE: Paperclip HQ (:3100) and its postgres container decommissioned 2026-05-29.
#       Hermes Dashboard (:9119) replaces it — tunneled via dashboard.youandinotai.com
#
# Idempotent. Re-running is safe — every phase checks before acting.
# Logs to C:\Antigravity\logs\autostart-YYYY-MM-DD.log
#
# Triggered automatically at user login via Startup-folder shortcut.
# Click bootstrap.cmd at repo root to run on demand.

$ErrorActionPreference = 'Continue'

$Repo   = 'C:\Antigravity'
$LogDir = "$Repo\logs"
$Log    = "$LogDir\autostart-$(Get-Date -Format 'yyyy-MM-dd').log"
New-Item -ItemType Directory -Force -Path $LogDir | Out-Null

function Log($msg) {
    $line = "[$(Get-Date -Format 'HH:mm:ss')] $msg"
    Add-Content -Path $Log -Value $line -ErrorAction SilentlyContinue
    Write-Host $line
}

function Test-LocalPort($port) {
    try {
        $client = New-Object System.Net.Sockets.TcpClient
        $async  = $client.BeginConnect('127.0.0.1', $port, $null, $null)
        $ok     = $async.AsyncWaitHandle.WaitOne(2000, $false)
        $client.Close()
        return $ok
    } catch { return $false }
}

function Wait-ForPort($port, $timeoutSec, $label) {
    $deadline = (Get-Date).AddSeconds($timeoutSec)
    while ((Get-Date) -lt $deadline) {
        if (Test-LocalPort $port) {
            Log "$label up on :$port"
            return $true
        }
        Start-Sleep -Seconds 2
    }
    Log "$label DID NOT come up on :$port within ${timeoutSec}s — continuing"
    return $false
}

Log '=========================================='
Log '=== mission stack autostart begin ========'
Log '=========================================='

# ---------- 1. Docker Desktop ----------
$dockerExe = 'C:\Program Files\Docker\Docker\Docker Desktop.exe'
$dockerCli = Get-Command docker -ErrorAction SilentlyContinue
if (Test-Path $dockerExe) {
    if (-not (Get-Process 'Docker Desktop' -ErrorAction SilentlyContinue)) {
        Log '[1/8] starting Docker Desktop'
        Start-Process $dockerExe -WindowStyle Hidden -ErrorAction SilentlyContinue
    } else {
        Log '[1/8] Docker Desktop already running'
    }
    if ($dockerCli) {
        # Wait for docker daemon (up to 90s)
        $deadline = (Get-Date).AddSeconds(90)
        while ((Get-Date) -lt $deadline) {
            $null = & docker info 2>&1
            if ($LASTEXITCODE -eq 0) { Log '      docker daemon ready'; break }
            Start-Sleep -Seconds 3
        }
    } else {
        Log '      docker CLI not on PATH — skipping daemon wait (downstream phases will gracefully skip docker-dependent steps)'
    }
} else {
    Log '[1/8] Docker Desktop not installed — skipping'
}

# ---------- 2. Hermes Router (WSL :11435) ----------
Log '[2/7] starting Hermes Router check'
$hermesPid = $null
try { $hermesPid = (wsl -d Ubuntu -- pgrep -f hermes_router.py 2>$null | Select-Object -First 1) } catch {}
if ([string]::IsNullOrWhiteSpace($hermesPid)) {
    Log '[3/8] starting Hermes Router (WSL background)'
    # Bash command built from [char]38 because PowerShell 5.1 refuses literal
    # ampersands anywhere in the source file (even comments) due to a parser bug.
    $a = [char]38
    $hermesCmd = "nohup bash /mnt/c/Antigravity/scripts/start-hermes-router.sh > /tmp/hermes-router.log 2>${a}1 ${a} disown"
    $hermesArgs = @('-d','Ubuntu','--','bash','-lc',$hermesCmd)
    Start-Process wsl -ArgumentList $hermesArgs -WindowStyle Hidden -ErrorAction SilentlyContinue
} else {
    Log "[3/8] Hermes Router already running (PID $hermesPid)"
}

# Hermes Router watchdog (perpetual)
$hermesWatchdogScript = "$Repo\scripts\hermes-watchdog.ps1"
$hermesWatchdogRunning = $false
Get-CimInstance Win32_Process -Filter "Name='powershell.exe'" -ErrorAction SilentlyContinue |
    Where-Object { $_.CommandLine -match 'hermes-watchdog\.ps1' } |
    ForEach-Object { $hermesWatchdogRunning = $true }
if ((-not $hermesWatchdogRunning) -and (Test-Path $hermesWatchdogScript)) {
    Log '      starting Hermes Router watchdog (hidden)'
    Start-Process -FilePath 'powershell.exe' `
        -ArgumentList '-NonInteractive','-WindowStyle','Hidden','-ExecutionPolicy','Bypass','-File',$hermesWatchdogScript `
        -WindowStyle Hidden -ErrorAction SilentlyContinue
} else {
    Log '      Hermes Router watchdog already running (or script missing)'
}

# ---------- 3. Mission Control API (:8787) ----------
# Scheduled Task "MissionControlAPI" boots this at startup. Verify only.
if (Test-LocalPort 8787) {
    Log '[5/8] Mission Control API up on :8787'
} else {
    Log '[5/8] Mission Control API not yet on :8787 — Scheduled Task should start it; bootstrapping fallback'
    Start-Process -FilePath 'python.exe' `
        -ArgumentList '-m','uvicorn','mission_control_api.main:app','--host','127.0.0.1','--port','8787' `
        -WorkingDirectory "$Repo\services\mission-control-api" `
        -WindowStyle Hidden -ErrorAction SilentlyContinue
    Wait-ForPort 8787 30 'Mission Control API' | Out-Null
}

# ---------- 6. Mission Control Watchdog ----------
# Scheduled Task "MissionControlWatchdog" boots this. Verify by log presence.
$mcWatchdogLog = "$LogDir\mission-control-watchdog.log"
if (Test-Path $mcWatchdogLog) {
    $lastLine = (Get-Content $mcWatchdogLog -Tail 1 -ErrorAction SilentlyContinue)
    Log "[6/8] MC Watchdog log present (last: $lastLine)"
} else {
    Log '[6/8] MC Watchdog log not present yet — Scheduled Task may still be starting'
}

# ---------- 6b. OpusHasHands hub (:4200) ----------
# Cloudflare tunnel ingress (paperclip-antigravity tunnel c7bc9665-...) routes
# opushashands.youandinotai.com -> http://127.0.0.1:4200. Without this listener
# the public hub returns 502 Bad Gateway.
$ohhDir = 'C:\Antigravity\_handoff-staging-2026-05-26\_deploy\opushashands'
$ohhLog = "$LogDir\opushashands-server.log"
$pyExe  = 'C:\Windows\py.exe'
if (Test-LocalPort 4200) {
    Log '[6b/8] OpusHasHands hub already up on :4200'
} elseif (-not (Test-Path $ohhDir)) {
    Log "[6b/8] OpusHasHands dir missing: $ohhDir — skipping (run Hermes integration dispatch first)"
} elseif (-not (Test-Path $pyExe)) {
    Log "[6b/8] python launcher missing: $pyExe — skipping"
} else {
    Log '[6b/8] starting OpusHasHands hub (python http.server :4200, hidden)'
    Start-Process -FilePath $pyExe `
        -ArgumentList '-m','http.server','4200','--bind','127.0.0.1' `
        -WorkingDirectory $ohhDir `
        -RedirectStandardOutput $ohhLog `
        -RedirectStandardError "$ohhLog.err" `
        -WindowStyle Hidden -ErrorAction SilentlyContinue
    Wait-ForPort 4200 15 'OpusHasHands' | Out-Null
}

# ---------- 7. OpenClaw Gateway dashboard browser-open ----------
# OpenClaw Gateway.cmd (separate Startup item) takes ~40s to be ready.
# Spawn a hidden powershell that polls port 18789 for up to 90s,
# then opens the canvas URL — survives this script's exit.
Log '[7/8] scheduling OpenClaw dashboard browser-open (waits for :18789)'
$openclawBlock = {
    for ($i = 0; $i -lt 45; $i++) {
        try {
            $c = New-Object System.Net.Sockets.TcpClient
            $a = $c.BeginConnect('127.0.0.1', 18789, $null, $null)
            $ok = $a.AsyncWaitHandle.WaitOne(1000, $false)
            $c.Close()
            if ($ok) { Start-Process 'http://127.0.0.1:18789/__openclaw__/canvas/'; exit }
        } catch {}
        Start-Sleep -Seconds 2
    }
}
$openclawCmd = $openclawBlock.ToString()
$openclawArgs = @('-NonInteractive','-WindowStyle','Hidden','-Command',$openclawCmd)
Start-Process powershell.exe -ArgumentList $openclawArgs -WindowStyle Hidden -ErrorAction SilentlyContinue

# ---------- 8. Terminal windows ----------
# GUARDED + MINIMIZED so re-runs (Chrome Remote Desktop reconnects, re-logins) never
# re-spawn focus-stealing terminals — the "4 windows in a row that move the cursor" bug.
# Services already run headless via the watchdogs above, so skipping these is harmless.
if (Get-Process WindowsTerminal -ErrorAction SilentlyContinue) {
    Log '[8/8] Windows Terminal already open — skipping session windows (prevents cursor-stealing re-spawn)'
} else {
    # Open Claude Code at c:\Antigravity (lowercase to match resume cache), minimized
    Log '[8/8] opening Claude Code (claude --resume) in Windows Terminal (minimized)'
    Start-Process wt -ArgumentList @(
        '-d','c:\Antigravity',
        'powershell.exe','-NoExit','-Command','claude --resume'
    ) -WindowStyle Minimized -ErrorAction SilentlyContinue

    # Open Hermes Agent CLI in WSL, minimized
    Log '      opening Hermes Agent CLI in Windows Terminal at /mnt/c/Antigravity (WSL Ubuntu, minimized)'
    Start-Process wt -ArgumentList @(
        '-d','c:\Antigravity',
        'wsl.exe','-d','Ubuntu','--cd','/mnt/c/Antigravity','--','/home/josh/.local/bin/hermes'
    ) -WindowStyle Minimized -ErrorAction SilentlyContinue
}

Log '=========================================='
Log '=== mission stack autostart complete ====='
Log '=== Mission Control: http://127.0.0.1:8787/'
Log '=== Hermes Dashboard: http://127.0.0.1:9119/  (public: https://dashboard.youandinotai.com/)'
Log '=== OpusHasHands:    http://127.0.0.1:4200/  (public: https://opushashands.youandinotai.com/)'
Log '=== OpenClaw:        http://127.0.0.1:18789/'
Log '=========================================='
