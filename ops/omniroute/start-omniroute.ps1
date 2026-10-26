# Starts OmniRoute (model gateway) on the T5500 at :20128.
# Run by scheduled task "ANTIGRAVITY OmniRoute" (S4U, boot + logon).
# Data + keys live in %USERPROFILE%\.omniroute (never printed).
param([int]$Port = 20128)
$ErrorActionPreference = 'Continue'
$env:PORT = "$Port"
$env:HOSTNAME = '192.168.0.15'
$env:OMNIROUTE_SERVER_HOST = '192.168.0.15'
$log = 'C:\ANTIGRAVITY\logs\omniroute.log'
New-Item -ItemType Directory -Force -Path (Split-Path $log) | Out-Null

$busy = Get-NetTCPConnection -State Listen -LocalAddress '192.168.0.15' -LocalPort $Port -ErrorAction SilentlyContinue
if ($busy) {
    try {
        Invoke-RestMethod "http://192.168.0.15:$Port/v1/models" -TimeoutSec 5 -ErrorAction Stop | Out-Null
        Add-Content $log "$(Get-Date -Format s) already answering on 192.168.0.15:$Port, exit"
        exit 0
    } catch {
        if ($_.Exception.Response.StatusCode.value__ -in 401,403) {
            Add-Content $log "$(Get-Date -Format s) already up on 192.168.0.15:$Port (auth required), exit"
            exit 0
        }
    }
}

$entry = Join-Path $env:APPDATA 'npm\node_modules\omniroute\dist\server-ws.mjs'
Add-Content $log "$(Get-Date -Format s) starting OmniRoute server-ws.mjs on 192.168.0.15:$Port"
& 'C:\Program Files\nodejs\node.exe' --dns-result-order=ipv4first --max-old-space-size=4096 $entry *>> $log
Add-Content $log "$(Get-Date -Format s) omniroute exited code $LASTEXITCODE"
