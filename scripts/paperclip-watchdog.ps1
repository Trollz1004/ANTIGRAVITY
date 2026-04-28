# Paperclip HQ Watchdog — runs forever, completely hidden, no window, no focus steal.
# Checks Paperclip (port 3100) and cloudflared every 30 seconds.
# Restarts each silently if they die. Logs to C:\ANTIGRAVITY\logs\paperclip-watchdog.log

$ErrorActionPreference = 'Continue'

$LogDir     = 'C:\ANTIGRAVITY\logs'
$LogFile    = "$LogDir\paperclip-watchdog.log"
$MaxLogBytes = 10MB

$CloudflaredExe   = 'C:\Program Files (x86)\cloudflared\cloudflared.exe'
$TunnelConfig     = 'C:\ANTIGRAVITY\infra\cloudflare\paperclip-hq.yml'
$PaperclipScript  = 'C:\ANTIGRAVITY\scripts\start-paperclip.ps1'
$PaperclipPort    = 3100
$CheckInterval    = 30   # seconds between health checks

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

function Get-PaperclipPid {
    # Find the paperclipai node process bound to port 3100
    Get-NetTCPConnection -LocalPort $PaperclipPort -State Listen -ErrorAction SilentlyContinue |
        Select-Object -First 1 -ExpandProperty OwningProcess
}

function Start-Paperclip {
    Log 'Paperclip DOWN — starting silently...'
    Start-Process -FilePath 'powershell.exe' `
        -ArgumentList '-NonInteractive', '-WindowStyle', 'Hidden', '-ExecutionPolicy', 'Bypass', '-File', $PaperclipScript `
        -WindowStyle Hidden `
        -ErrorAction SilentlyContinue
    Log 'Paperclip start command issued.'
}

function Get-CloudflaredPid {
    Get-Process -Name 'cloudflared' -ErrorAction SilentlyContinue | Select-Object -First 1
}

function Start-CloudflaredTunnel {
    Log 'Cloudflared DOWN — starting tunnel silently...'
    Start-Process -FilePath $CloudflaredExe `
        -ArgumentList "tunnel --config `"$TunnelConfig`" run" `
        -WindowStyle Hidden `
        -ErrorAction SilentlyContinue
    Log 'Cloudflared tunnel start command issued.'
}

Log '====== Paperclip Watchdog Started ======'
Log "Watching port $PaperclipPort every ${CheckInterval}s. No windows will open."

while ($true) {
    Rotate-Log

    # --- Paperclip health check ---
    if (-not (Test-LocalPort $PaperclipPort)) {
        Start-Paperclip
        # Give it 20 seconds to bind before next check
        Start-Sleep -Seconds 20
    }

    # --- Cloudflared health check ---
    if ($null -eq (Get-CloudflaredPid)) {
        Start-CloudflaredTunnel
        Start-Sleep -Seconds 5
    }

    Start-Sleep -Seconds $CheckInterval
}
