# Optional third-party Paperclip launcher.
#
# Mission Control is the authority on :3110. This script keeps the third-party
# Paperclip workbench available when Joshua wants it open as an idle browser
# tool. It defaults to :3111 to avoid taking down Mission Control.

$ErrorActionPreference = 'Stop'

$RepoRoot = Split-Path -Parent $PSScriptRoot
$LogDir = Join-Path $RepoRoot 'logs'
$LogFile = Join-Path $LogDir 'third-party-paperclip.log'
$Port = if ($env:PAPERCLIP_OPTIONAL_PORT) { $env:PAPERCLIP_OPTIONAL_PORT } else { '3111' }
$HostName = if ($env:PAPERCLIP_OPTIONAL_HOST) { $env:PAPERCLIP_OPTIONAL_HOST } else { '127.0.0.1' }

function Log {
    param([string]$Message)
    $line = "$(Get-Date -Format o) $Message"
    Write-Host $line
    Add-Content -Path $LogFile -Value $line
}

New-Item -ItemType Directory -Force -Path $LogDir | Out-Null

$npx = Get-Command npx -ErrorAction SilentlyContinue
if (-not $npx) {
    throw 'npx was not found. Optional third-party Paperclip cannot be launched.'
}

Log '=== start-third-party-paperclip.ps1 ==='
Log "Starting optional third-party Paperclip on http://$HostName`:$Port"
Log 'Mission Control remains the authority on http://127.0.0.1:3110.'

Push-Location $RepoRoot
try {
    & $npx.Source --yes paperclipai start --port $Port --host $HostName *>> $LogFile 2>&1
} finally {
    Pop-Location
}
