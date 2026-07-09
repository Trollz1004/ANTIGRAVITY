[CmdletBinding()]
param(
  [string]$RepoRoot = 'C:\antigravity',
  [int]$Port = 9110
)

$ErrorActionPreference = 'Stop'
$serviceDir = Join-Path $RepoRoot 'services\hermes-support-gateway'
$envFile = Join-Path $serviceDir '.env'
$logDir = Join-Path $RepoRoot 'logs'
$logPath = Join-Path $logDir 'hermes-support-gateway.log'

New-Item -ItemType Directory -Force -Path $logDir | Out-Null

if (Test-Path $envFile) {
  Get-Content $envFile | ForEach-Object {
    if ($_ -match '^\s*#' -or $_ -match '^\s*$') { return }
    if ($_ -match '^([A-Za-z_][A-Za-z0-9_]*)=(.*)$') {
      [System.Environment]::SetEnvironmentVariable($matches[1], $matches[2], 'Process')
    }
  }
}

if (-not $env:PORT) { $env:PORT = [string]$Port }
if (-not $env:NODE_NAME) { $env:NODE_NAME = 't5500' }
if (-not $env:AGENT_HUB_URL) { $env:AGENT_HUB_URL = 'http://192.168.0.8:3130' }

Set-Location $serviceDir
"[$(Get-Date -Format o)] Starting hermes-support-gateway port=$env:PORT node=$env:NODE_NAME" | Add-Content -Path $logPath -Encoding UTF8
& node src\index.js *>> $logPath
