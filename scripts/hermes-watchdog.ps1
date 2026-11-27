# Hermes Router Watchdog — runs forever, completely hidden, no window, no focus steal.
# Checks local Hermes Router port every 30 seconds (canonical T5500 Hermes API :8643 / Dashboard :9119 in ops/fleet/fleet-map.json).
# Restarts via WSL on failure. Logs to <RepoRoot>\logs\hermes-watchdog.log

param(
    [string]$RepoRoot = $(if (Test-Path 'C:\ANTIGRAVITY') { 'C:\ANTIGRAVITY' } else { Split-Path -Parent $PSScriptRoot })
)

$ErrorActionPreference = 'Continue'

$LogDir     = Join-Path $RepoRoot 'logs'
$LogFile    = "$LogDir\hermes-watchdog.log"
$MaxLogBytes = 10MB

$HermesScript  = Join-Path $RepoRoot 'scripts\start-hermes-router.cmd'
$HermesPort    = 11435
$CheckInterval = 30   # seconds between health checks

New-Item -ItemType Directory -Force -Path $LogDir | Out-Null

function Log($msg) {
    $line = "[$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')] $msg"
    Add-Content -Path $LogFile -Value $line -ErrorAction SilentlyContinue
}

function Rotate-Log {
    if ((Test-Path $LogFile) -and (Get-Item $LogFile).Length -gt $MaxLogBytes) {
        Move-Item $LogFile "$LogFile.1" -Force -ErrorAction SilentlyContinue
    }
}

function Test-LocalPort($port) {
    try {
        $client = New-Object System.Net.Sockets.TcpClient
        $async  = $client.BeginConnect([System.Net.IPAddress]::Loopback, $port, $null, $null)
        $ok     = $async.AsyncWaitHandle.WaitOne(2000, $false)
        $client.Close()
        return $ok
    } catch {
        return $false
    }
}

function Get-HermesPid {
    # Find process bound to port 11435 (Hermes Router)
    Get-NetTCPConnection -LocalPort $HermesPort -State Listen -ErrorAction SilentlyContinue |
        Select-Object -First 1 -ExpandProperty OwningProcess
}

function Start-Hermes {
    Log 'Hermes Router DOWN — restarting via WSL...'
    Start-Process wsl -ArgumentList '-d','Ubuntu','--','bash','-lc',
        'nohup bash /mnt/c/antigravity/scripts/start-hermes-router.sh > /tmp/hermes-router.log 2>&1 & disown' `
        -WindowStyle Hidden -ErrorAction SilentlyContinue
    Log 'Hermes Router start command issued.'
}

Log '====== Hermes Router Watchdog Started ======'
Log "Watching port $HermesPort every ${CheckInterval}s. No windows will open."

while ($true) {
    Rotate-Log

    # --- Hermes Router health check ---
    if (-not (Test-LocalPort $HermesPort)) {
        Start-Hermes
        # Give it 20 seconds to bind before next check
        Start-Sleep -Seconds 20
    }

    Start-Sleep -Seconds $CheckInterval
}
