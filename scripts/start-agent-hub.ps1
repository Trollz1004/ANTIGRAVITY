#!/usr/bin/env pwsh
<#
.SYNOPSIS
  Starts the ANTIGRAVITY agent-hub service (Express, :3130) with its
  environment loaded from services/agent-hub/.env, logging to a file so it
  can run detached (manually or via the AgentHub-3130 scheduled task).

.NOTES
  Never echoes secret values. Reads services/agent-hub/.env line-by-line and
  loads each KEY=VALUE pair into $env: for the child node process only.
#>

$ErrorActionPreference = 'Stop'

$repoRoot = Split-Path -Parent $PSScriptRoot
$hubDir = Join-Path $repoRoot 'services\agent-hub'
$envFile = Join-Path $hubDir '.env'

if (-not (Test-Path $envFile)) {
    Write-Error "[agent-hub] .env not found at $envFile"
    exit 1
}

# Load .env into the current process environment, file-to-file, never printed.
Get-Content $envFile | ForEach-Object {
    $line = $_
    if ($line -match '^\s*#') { return }
    if ($line -match '^\s*$') { return }
    if ($line -match '^([A-Za-z_][A-Za-z0-9_]*)=(.*)$') {
        $key = $matches[1]
        $val = $matches[2]
        [System.Environment]::SetEnvironmentVariable($key, $val, 'Process')
    }
}

# Determine log path: $env:DREAM_ROOT\game\logs\agent-hub.log, else %TEMP%\agent-hub.log
if ($env:DREAM_ROOT -and (Test-Path $env:DREAM_ROOT)) {
    $logDir = Join-Path $env:DREAM_ROOT 'game\logs'
} else {
    $logDir = $env:TEMP
}
if (-not (Test-Path $logDir)) {
    New-Item -ItemType Directory -Force -Path $logDir | Out-Null
}
$logPath = Join-Path $logDir 'agent-hub.log'

Set-Location $hubDir

"[$(Get-Date -Format o)] Starting agent-hub (PORT=$env:PORT)" | Add-Content -Path $logPath -Encoding UTF8

# Run node, redirecting stdout+stderr to the log file. Runs in the foreground
# of whatever process starts this script (detached process or scheduled task
# handles backgrounding).
& node src\index.js *>> $logPath
