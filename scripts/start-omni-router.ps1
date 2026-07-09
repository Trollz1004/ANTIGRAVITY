[CmdletBinding()]
param(
  [string]$RepoRoot = 'C:\antigravity',
  [int]$Port = 11436
)

$ErrorActionPreference = 'Stop'
$serviceDir = Join-Path $RepoRoot 'services\omni-router'
$envFile = Join-Path $serviceDir '.env.local'
$logDir = Join-Path $RepoRoot 'logs'
$logPath = Join-Path $logDir 'omni-router.log'

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
if (-not $env:HOST) { $env:HOST = '127.0.0.1' }

Set-Location $serviceDir
"[$(Get-Date -Format o)] Starting omni-router port=$env:PORT proxy=$env:OMNI_ROUTER_PROXY_ENABLED" | Add-Content -Path $logPath -Encoding UTF8
& node src\index.js *>> $logPath
