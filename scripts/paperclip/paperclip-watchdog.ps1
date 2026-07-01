$ErrorActionPreference = 'Continue'
$RepoRoot = 'c:\antigravity'
$LogDir = Join-Path $RepoRoot 'logs'
$LaunchScript = Join-Path $RepoRoot 'scripts\paperclip\launch-paperclip-hq.ps1'
$WatchdogLog = Join-Path $LogDir 'paperclip-watchdog.log'
$CheckIntervalSec = 60

New-Item -ItemType Directory -Force -Path $LogDir | Out-Null

function Log($Message) {
    $line = "[{0}] {1}" -f (Get-Date -Format 'yyyy-MM-dd HH:mm:ss'), $Message
    Write-Output $line
    Add-Content -Path $WatchdogLog -Value $line
}

function Test-PaperclipHealth {
    try {
        $r = Invoke-WebRequest -Uri 'http://127.0.0.1:3110/api/health' -UseBasicParsing -TimeoutSec 8
        return $r.StatusCode -eq 200
    } catch {
        try {
            $r = Invoke-WebRequest -Uri 'http://127.0.0.1:3110' -UseBasicParsing -TimeoutSec 8
            return $r.StatusCode -in 200, 301, 302
        } catch {
            return $false
        }
    }
}

function Start-PaperclipHQ {
    Log 'Watchdog: Paperclip not healthy; relaunching via launch-paperclip-hq.ps1.'
    Start-Process -FilePath 'powershell.exe' -ArgumentList @(
        '-NoProfile', '-ExecutionPolicy', 'Bypass', '-WindowStyle', 'Hidden', '-File', $LaunchScript
    ) -WorkingDirectory $RepoRoot -WindowStyle Hidden | Out-Null
}

Log 'Paperclip watchdog started. Monitoring :3110 every 60s.'

# Ensure at least one launch at startup.
if (-not (Test-PaperclipHealth)) {
    Start-PaperclipHQ
}

while ($true) {
    Start-Sleep -Seconds $CheckIntervalSec
    if (-not (Test-PaperclipHealth)) {
        Log 'Watchdog: health check failed. Initiating relaunch.'
        Start-PaperclipHQ
        Start-Sleep -Seconds 90  # Allow time to come up before next check.
    } else {
        Log 'Watchdog: health check OK.'
    }
}
