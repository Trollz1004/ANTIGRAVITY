# Paperclip HQ Watchdog — runs forever, completely hidden, no window, no focus steal.
# Checks Paperclip (port 3100) and cloudflared every 30 seconds.
# Restarts each silently if they die. Logs to C:\ANTIGRAVITY\logs\paperclip-watchdog.log

$ErrorActionPreference = 'Continue'

$LogDir     = 'C:\Antigravity\logs'
$LogFile    = "$LogDir\paperclip-watchdog.log"
$CfStdErr   = "$LogDir\cloudflared.stderr.log"
$CfStdOut   = "$LogDir\cloudflared.stdout.log"
$PcStdErr   = "$LogDir\paperclip.stderr.log"
$PcStdOut   = "$LogDir\paperclip.stdout.log"
$MaxLogBytes = 10MB

$CloudflaredExe   = 'C:\Program Files (x86)\cloudflared\cloudflared.exe'
$TunnelConfig     = 'C:\Antigravity\infra\cloudflare\paperclip-hq.yml'
$PaperclipScript  = 'C:\Antigravity\scripts\start-paperclip.ps1'
$PaperclipPort    = 3100
$CheckInterval    = 30   # seconds between health checks

New-Item -ItemType Directory -Force -Path $LogDir | Out-Null

function Log($msg) {
    $line = "[$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')] $msg"
    Add-Content -Path $LogFile -Value $line -ErrorAction SilentlyContinue
}

function Rotate-Log {
    foreach ($f in @($LogFile, $CfStdErr, $CfStdOut, $PcStdErr, $PcStdOut)) {
        if ((Test-Path $f) -and (Get-Item $f).Length -gt $MaxLogBytes) {
            Move-Item $f "$f.1" -Force -ErrorAction SilentlyContinue
        }
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
        -RedirectStandardOutput $PcStdOut `
        -RedirectStandardError  $PcStdErr `
        -ErrorAction SilentlyContinue
    Log "Paperclip start command issued. stderr -> $PcStdErr"
}

function Get-CloudflaredPid {
    Get-Process -Name 'cloudflared' -ErrorAction SilentlyContinue | Select-Object -First 1
}

function Start-CloudflaredTunnel {
    Log 'Cloudflared DOWN — starting tunnel silently...'
    # Capture stderr so failures (bad creds, missing config, edge errors) become diagnosable
    # instead of vanishing into the void of a hidden process.
    Start-Process -FilePath $CloudflaredExe `
        -ArgumentList "tunnel --config `"$TunnelConfig`" run" `
        -WindowStyle Hidden `
        -RedirectStandardOutput $CfStdOut `
        -RedirectStandardError  $CfStdErr `
        -ErrorAction SilentlyContinue
    Log "Cloudflared tunnel start command issued. stderr -> $CfStdErr"
    Start-Sleep -Seconds 3
    # Surface the most recent error tail into the watchdog log so a single tail tells the story
    if (Test-Path $CfStdErr) {
        $tail = Get-Content $CfStdErr -Tail 5 -ErrorAction SilentlyContinue
        if ($tail) {
            foreach ($l in $tail) { Log "  cloudflared> $l" }
        }
    }
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
