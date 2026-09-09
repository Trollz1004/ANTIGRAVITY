# ANTIGRAVITY Oracle — one-shot bootstrap (Sabretooth primary node)
# NO visible console, NO browser, NO focus steal. Logs only.
# Invoked by Scheduled Task with -WindowStyle Hidden.

$ErrorActionPreference = 'Continue'
$Repo = if (Test-Path 'E:\ANTIGRAVITY') { 'E:\ANTIGRAVITY' } else { 'E:\ANTIGRAVITY' }
$LogDir = Join-Path $Repo 'logs'
$LogFile = Join-Path $LogDir 'oracle-bootstrap.log'
$Watchdog = Join-Path $Repo 'scripts\watchdog'

New-Item -ItemType Directory -Force -Path $LogDir | Out-Null

function Log([string]$Msg) {
    $line = "[$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')] $Msg"
    Add-Content -Path $LogFile -Value $line -ErrorAction SilentlyContinue
}

function Test-Port([int]$Port) {
    try {
        $c = New-Object System.Net.Sockets.TcpClient
        $ar = $c.BeginConnect('127.0.0.1', $Port, $null, $null)
        $ok = $ar.AsyncWaitHandle.WaitOne(1500, $false)
        $c.Close()
        return $ok
    } catch { return $false }
}

function Start-Hidden([string]$Exe, [object]$ArgList = $null, [string]$Wd = $null) {
    $p = @{ FilePath = $Exe; WindowStyle = 'Hidden' }
    if ($null -ne $ArgList -and @($ArgList).Count -gt 0) { $p.ArgumentList = $ArgList }
    if ($Wd) { $p.WorkingDirectory = $Wd }
    Start-Process @p -ErrorAction SilentlyContinue | Out-Null
}

Log "=== Oracle bootstrap $($env:COMPUTERNAME) ==="

# Restore critical tracked paths if a prior session deleted them
if (-not (Test-Path (Join-Path $Repo 'services\hermes-router\hermes_router.py'))) {
    Log 'hermes-router missing — git restore'
    Push-Location $Repo
    git restore services/hermes-router 2>&1 | Out-Null
    git restore hermes/agents 2>&1 | Out-Null
    Pop-Location
}

if (Test-Path (Join-Path $Repo '.git')) {
    Push-Location $Repo
    Log 'git pull --ff-only origin main'
    git pull --ff-only origin main 2>&1 | Out-Null
    Pop-Location
}

# Rogue agents (silent taskkill)
foreach ($img in @('emergent.exe', 'manus-agent.exe', 'manus-runtime.exe', 'e1-app.exe', 'e1.exe')) {
    taskkill /F /IM $img /T 2>$null | Out-Null
}

# Docker Desktop — hidden start only if daemon down
try {
    docker info 2>$null | Out-Null
    if ($LASTEXITCODE -ne 0) {
        $dockerExe = 'C:\Program Files\Docker\Docker\Docker Desktop.exe'
        if (Test-Path $dockerExe) {
            Log 'Docker down — starting Desktop (hidden)'
            Start-Hidden $dockerExe
        }
    }
} catch { Log "Docker check skipped: $_" }

# Hermes router (Windows venv first; WSL fallback)
if (-not (Test-Port 11435)) {
    $hrDir = Join-Path $Repo 'services\hermes-router'
    $venvPy = Join-Path $hrDir '.venv\Scripts\python.exe'
    $routerPy = Join-Path $hrDir 'hermes_router.py'
    if (Test-Path $routerPy) {
        Log 'Hermes :11435 down - starting (hidden, Windows)'
        if (Test-Path $venvPy) {
            Start-Hidden $venvPy @($routerPy) $hrDir
        } else {
            $py = if (Get-Command py -ErrorAction SilentlyContinue) { 'py' } else { 'python' }
            Start-Hidden $py @('-3', $routerPy) $hrDir
        }
        Start-Sleep -Seconds 8
    }
    if (-not (Test-Port 11435)) {
        Log 'Hermes still down - WSL fallback'
        Start-Hidden 'wsl.exe' @('-d', 'Ubuntu', '--', 'bash', '-lc', 'nohup bash /mnt/c/antigravity/scripts/start-hermes-router.sh >> /tmp/hermes-router.log 2>&1 & disown')
        Start-Sleep -Seconds 8
    }
}

# Ollama
if (-not (Test-Port 11434)) {
    $ollama = "$env:LOCALAPPDATA\Programs\Ollama\ollama.exe"
    if (Test-Path $ollama) {
        Log 'Ollama :11434 down — serve (hidden)'
        Start-Hidden $ollama @('serve')
        Start-Sleep -Seconds 6
    }
}

# OpusHasHands / mission-control static on :4200
if (-not (Test-Port 4200)) {
    $candidates = @(
        (Join-Path $Repo 'apps\mission-control\dist'),
        (Join-Path $Repo '_handoff-staging-2026-05-26\_deploy\opushashands'),
        (Join-Path $Repo '_deploy\aidoesitall-www')
    )
    $dir = $candidates | Where-Object { Test-Path $_ } | Select-Object -First 1
    if ($dir) {
        Log "OpusHasHands :4200 down - http.server in $dir (hidden)"
        $py = if (Get-Command py -ErrorAction SilentlyContinue) { 'py' } else { 'python' }
        Start-Hidden $py @('-3', '-m', 'http.server', '4200', '--bind', '127.0.0.1') $dir
    }
}

# Cloudflared (paperclip-hq tunnel) — hidden, no window
$cf = 'C:\Program Files (x86)\cloudflared\cloudflared.exe'
$cfCfg = Join-Path $Repo 'infra\cloudflare\paperclip-hq.yml'
if ((Test-Path $cf) -and (Test-Path $cfCfg)) {
    if (-not (Get-Process -Name 'cloudflared' -ErrorAction SilentlyContinue)) {
        Log 'cloudflared down — starting tunnel (hidden)'
        Start-Hidden $cf @('tunnel', '--config', $cfCfg, 'run')
    }
}

# Sentry Oracle — pythonw = zero console window
$sentryPy = Join-Path $Watchdog 'sentry.py'
if (Test-Path $sentryPy) {
    $already = Get-CimInstance Win32_Process -Filter "Name='pythonw.exe'" -ErrorAction SilentlyContinue |
        Where-Object { $_.CommandLine -like '*watchdog\sentry.py*' }
    if (-not $already) {
        $pythonw = (Get-Command pythonw -ErrorAction SilentlyContinue).Source
        if (-not $pythonw) { $pythonw = 'pythonw.exe' }
        Log 'Starting sentry oracle (pythonw, no window)'
        Start-Hidden $pythonw @($sentryPy)
    } else {
        Log 'sentry oracle already running'
    }
}

Log '=== Oracle bootstrap complete ==='