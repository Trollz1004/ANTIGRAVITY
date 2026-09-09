# Hermes Router Watchdog — runs forever, completely hidden, no window, no focus steal.
# Checks Hermes Router (port 11435) every 30 seconds.
# Restarts via WSL on failure. Logs to E:\ANTIGRAVITY\logs\hermes-watchdog.log

$ErrorActionPreference = 'Continue'

$LogDir     = 'E:\ANTIGRAVITY\logs'
$LogFile    = "$LogDir\hermes-watchdog.log"
$MaxLogBytes = 10MB

$HermesScript  = 'E:\ANTIGRAVITY\scripts\start-hermes-router.cmd'
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
        $async  = $client.BeginConnect('127.0.0.1', $port, $null, $null)
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
