# Starts OmniRoute (model gateway) on the T5500 at :20128.
# Run by scheduled task "ANTIGRAVITY OmniRoute" (logon, non-elevated).
# Data + keys live in %USERPROFILE%\.omniroute (never printed).
param([int]$Port = 20128)
$ErrorActionPreference = 'Continue'
$env:HOSTNAME = '192.168.0.15'
$env:OMNIROUTE_SERVER_HOST = '192.168.0.15'
$log = 'C:\ANTIGRAVITY\logs\omniroute.log'
New-Item -ItemType Directory -Force -Path (Split-Path $log) | Out-Null

$busy = Get-NetTCPConnection -State Listen -LocalPort $Port -ErrorAction SilentlyContinue
if ($busy) {
    try {
        Invoke-RestMethod "http://192.168.0.15:$Port/v1/models" -TimeoutSec 5 -ErrorAction Stop | Out-Null
        Add-Content $log "$(Get-Date -Format s) already answering on :$Port, exit"
        exit 0
    } catch {
        if ($_.Exception.Response.StatusCode.value__ -in 401,403) {
            Add-Content $log "$(Get-Date -Format s) already up on :$Port (auth required), exit"
            exit 0
        }
    }
}

$cmd = Join-Path $env:APPDATA 'npm\omniroute.cmd'
Add-Content $log "$(Get-Date -Format s) starting omniroute serve --port $Port"
& cmd.exe /c "`"`"$cmd`" serve --port $Port --no-open --no-tray >> `"$log`" 2>&1`""
Add-Content $log "$(Get-Date -Format s) omniroute exited code $LASTEXITCODE"
