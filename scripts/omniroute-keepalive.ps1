# OmniRoute gateway keepalive — 24/7, headless, auto-restart. (Pattern: paperweight-keepalive.)
# Launched at logon by a Startup-folder cmd. Non-admin. Loops forever: if :20128
# stops answering, relaunch the npm-global omniroute windowless. All agent model
# traffic rides this gateway (OPENAI_COMPAT_BASE_URL=127.0.0.1:20128) — no agent
# holds a provider key; providers + auto-swap + compression live inside OmniRoute.
$ErrorActionPreference = 'SilentlyContinue'
$env:Path = [Environment]::GetEnvironmentVariable('Path', 'Machine') + ';' + [Environment]::GetEnvironmentVariable('Path', 'User')
$env:PORT = '20128'
$env:DASHBOARD_PORT = '20128'
$env:API_PORT = '20129'
$env:DATA_DIR = "$env:USERPROFILE\.omniroute\data"   # outside the repo: its sqlite + keys must never be committed
New-Item -ItemType Directory -Force $env:DATA_DIR | Out-Null
$omni = "$env:APPDATA\npm\omniroute.cmd"
while ($true) {
    $up = $false
    # /api/health answers 200 without a key; /v1/models is 401 unauthenticated since 3.8.50 (2026-09-06)
    # and would read as 'down' forever. Liveness only - identity is the House's and the Sentry's job.
    try { $up = (Invoke-WebRequest -UseBasicParsing 'http://127.0.0.1:20128/api/health' -TimeoutSec 5).StatusCode -eq 200 } catch {}
    if (-not $up) {
        $existing = Get-CimInstance Win32_Process -ErrorAction SilentlyContinue |
            Where-Object { $_.Name -eq 'node.exe' -and $_.CommandLine -match 'omniroute' }
        if (-not $existing) {
            Start-Process -FilePath $omni -WindowStyle Hidden
            Start-Sleep -Seconds 90   # first boot compiles; don't double-spawn while it warms up
        }
    }
    Start-Sleep -Seconds 30
}
