[CmdletBinding()]
param(
  [string]$RepoRoot = 'C:\antigravity',
  [int]$Port = 4180
)

$ErrorActionPreference = 'Stop'
$serviceDir = Join-Path $RepoRoot 'services\node-balancer'
$logDir = Join-Path $RepoRoot 'logs'
$logPath = Join-Path $logDir 'node-balancer.log'

New-Item -ItemType Directory -Force -Path $logDir | Out-Null

if (-not $env:PORT) { $env:PORT = [string]$Port }
if (-not $env:HOST) { $env:HOST = '127.0.0.1' }
if (-not $env:REPO_ROOT) { $env:REPO_ROOT = $RepoRoot }

Set-Location $serviceDir
"[$(Get-Date -Format o)] Starting node-balancer port=$env:PORT" | Add-Content -Path $logPath -Encoding UTF8
& node src\server.js *>> $logPath
