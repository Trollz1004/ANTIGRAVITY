# Paperclip HQ Watchdog — runs forever, hidden, no window, no focus steal.
# Checks Paperclip (port 3100) every 30 seconds and restarts via start-paperclip.ps1
# if it dies. Logs to C:\Antigravity\logs\paperclip-watchdog.log
#
# Cockpit is local-only — cloudflared tunnel is NOT managed here. If you ever
# need the public paperclip-hq tunnel back, manage it in its own watchdog.

$ErrorActionPreference = 'Continue'

$LogDir          = 'C:\Antigravity\logs'
$LogFile         = "$LogDir\paperclip-watchdog.log"
$PcStdErr        = "$LogDir\paperclip.stderr.log"
$PcStdOut        = "$LogDir\paperclip.stdout.log"
$MaxLogBytes     = 10MB

$PaperclipScript = 'C:\Antigravity\scripts\start-paperclip.ps1'
$PaperclipPort   = 3100
$CheckInterval   = 30

New-Item -ItemType Directory -Force -Path $LogDir | Out-Null

function Log($msg) {
    $line = "[$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')] $msg"
    Add-Content -Path $LogFile -Value $line -ErrorAction SilentlyContinue
}

function Rotate-Log {
    foreach ($f in @($LogFile, $PcStdErr, $PcStdOut)) {
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
    } catch { return $false }
}

function Start-Paperclip {
    Log 'Paperclip DOWN — starting silently...'
    Start-Process -FilePath 'powershell.exe' `
        -ArgumentList '-NonInteractive','-WindowStyle','Hidden','-ExecutionPolicy','Bypass','-File',$PaperclipScript `
        -WindowStyle Hidden `
        -RedirectStandardOutput $PcStdOut `
        -RedirectStandardError  $PcStdErr `
        -ErrorAction SilentlyContinue
    Log "Paperclip start command issued. stderr -> $PcStdErr"
}

Log '====== Paperclip Watchdog Started ======'
Log "Watching port $PaperclipPort every ${CheckInterval}s. Local-only mode (no tunnel)."

while ($true) {
    Rotate-Log

    if (-not (Test-LocalPort $PaperclipPort)) {
        Start-Paperclip
        Start-Sleep -Seconds 20
    }

    Start-Sleep -Seconds $CheckInterval
}
