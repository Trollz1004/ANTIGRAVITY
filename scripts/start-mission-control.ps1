# Start the first-party ANTIGRAVITY Mission Control board on :3110.

$ErrorActionPreference = 'Stop'

$RepoRoot = Split-Path -Parent $PSScriptRoot
$ServiceDir = Join-Path $RepoRoot 'services\mission-control'
$ServerFile = Join-Path $ServiceDir 'src\server.js'
$LogDir = Join-Path $RepoRoot 'logs'
$LogFile = Join-Path $LogDir 'mission-control.log'

function Log {
    param([string]$Message)
    $line = "$(Get-Date -Format o) $Message"
    Write-Host $line
    Add-Content -Path $LogFile -Value $line
}

New-Item -ItemType Directory -Force -Path $LogDir | Out-Null

if (-not (Test-Path $ServerFile)) {
    throw "Mission Control server missing at $ServerFile"
}

$node = Get-Command node -ErrorAction SilentlyContinue
if (-not $node) {
    throw 'Node.js is required to run Mission Control.'
}

$env:REPO_ROOT = $RepoRoot
$env:HOST = if ($env:HOST) { $env:HOST } else { '127.0.0.1' }
$env:PORT = if ($env:PORT) { $env:PORT } else { '3110' }
$env:AGENT_HUB_URL = if ($env:AGENT_HUB_URL) { $env:AGENT_HUB_URL } else { 'http://127.0.0.1:3130' }

Log '=== start-mission-control.ps1 ==='
Log "Starting Mission Control from $ServerFile"
Log "URL: http://$($env:HOST):$($env:PORT)"

Push-Location $ServiceDir
try {
    & $node.Source $ServerFile *>> $LogFile 2>&1
} finally {
    Pop-Location
}
