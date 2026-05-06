# Mission stack unified bootstrap.
#
# Brings up the entire Sabretooth cockpit in dependency order:
#   1. Docker Desktop
#   2. paperclip-postgres container (:5432)
#   3. WSL Hermes Router (:11435) + watchdog
#   4. Paperclip HQ (:3100) + watchdog
#   5. Mission Control API (:8787) — verify only (Scheduled Task starts it)
#   6. Mission Control Watchdog — verify only (Scheduled Task starts it)
#   7. OpenClaw Gateway browser-open (waits for :18789)
#   8. Claude Code + Hermes TUI windows in Windows Terminal
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
if (Test-Path $dockerExe) {
    if (-not (Get-Process 'Docker Desktop' -ErrorAction SilentlyContinue)) {
        Log '[1/8] starting Docker Desktop'
        Start-Process $dockerExe -WindowStyle Hidden -ErrorAction SilentlyContinue
    } else {
        Log '[1/8] Docker Desktop already running'
    }
    # Wait for docker daemon (up to 90s)
    $deadline = (Get-Date).AddSeconds(90)
    while ((Get-Date) -lt $deadline) {
        $null = & docker info 2>&1
        if ($LASTEXITCODE -eq 0) { Log '      docker daemon ready'; break }
        Start-Sleep -Seconds 3
    }
} else {
    Log '[1/8] Docker Desktop not installed — skipping'
}

# ---------- 2. paperclip-postgres container ----------
try {
    $running = & docker ps --filter "name=paperclip-postgres" --format "{{.Names}}" 2>$null
    if ($running -match 'paperclip-postgres') {
        Log '[2/8] paperclip-postgres already running'
    } else {
        $exists = & docker ps -a --filter "name=paperclip-postgres" --format "{{.Names}}" 2>$null
        if ($exists -match 'paperclip-postgres') {
            Log '[2/8] starting existing paperclip-postgres container'
            & docker start paperclip-postgres 2>&1 | Out-Null
        } else {
            Log '[2/8] creating paperclip-postgres container (first run)'
            & docker run -d `
                --name paperclip-postgres `
                --restart unless-stopped `
                -e POSTGRES_USER=paperclip `
                -e POSTGRES_PASSWORD=paperclip_local_only `
                -e POSTGRES_DB=paperclip `
                -p 127.0.0.1:5432:5432 `
                -v paperclip-pgdata:/var/lib/postgresql/data `
                postgres:16 2>&1 | Out-Null
        }
    }
    Wait-ForPort 5432 30 'Postgres' | Out-Null
} catch {
    Log "[2/8] postgres step error: $($_.Exception.Message)"
}

# ---------- 3. Hermes Router (WSL :11435) ----------
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

# ---------- 4. Paperclip HQ (:3100) + watchdog ----------
$watchdogScript = "$Repo\scripts\paperclip-watchdog.ps1"
$watchdogRunning = $false
Get-CimInstance Win32_Process -Filter "Name='powershell.exe'" -ErrorAction SilentlyContinue |
    Where-Object { $_.CommandLine -match 'paperclip-watchdog\.ps1' } |
    ForEach-Object { $watchdogRunning = $true }
if ((-not $watchdogRunning) -and (Test-Path $watchdogScript)) {
    Log '[4/8] starting Paperclip watchdog (hidden) — will boot paperclipai itself'
    Start-Process -FilePath 'powershell.exe' `
        -ArgumentList '-NonInteractive','-WindowStyle','Hidden','-ExecutionPolicy','Bypass','-File',$watchdogScript `
        -WindowStyle Hidden -ErrorAction SilentlyContinue
} else {
    Log '[4/8] Paperclip watchdog already running'
}
Wait-ForPort 3100 60 'Paperclip HQ' | Out-Null

# ---------- 5. Mission Control API (:8787) ----------
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
# Open Claude Code at c:\Antigravity (lowercase to match resume cache)
Log '[8/8] opening Claude Code (claude --resume) in Windows Terminal'
Start-Process wt -ArgumentList @(
    '-d','c:\Antigravity',
    'powershell.exe','-NoExit','-Command','claude --resume'
) -ErrorAction SilentlyContinue

# Open Hermes Agent CLI in WSL
Log '      opening Hermes Agent CLI in Windows Terminal at /mnt/c/Antigravity (WSL Ubuntu)'
Start-Process wt -ArgumentList @(
    '-d','c:\Antigravity',
    'wsl.exe','-d','Ubuntu','--cd','/mnt/c/Antigravity','--','/home/josh/.local/bin/hermes'
) -ErrorAction SilentlyContinue

Log '=========================================='
Log '=== mission stack autostart complete ====='
Log '=== Mission Control: http://127.0.0.1:8787/'
Log '=== Paperclip HQ:    http://127.0.0.1:3100/'
Log '=== OpenClaw:        http://127.0.0.1:18789/'
Log '=========================================='
