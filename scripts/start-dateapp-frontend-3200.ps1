<#
.SYNOPSIS
Installs frontend dependencies and starts YouAndINotAI frontend on 0.0.0.0:3200
(T5500 LAN + cloudflared origin for youandinotai.com).
#>
param([string]$RepoRoot = 'C:\ANTIGRAVITY')
$ErrorActionPreference = 'Continue'
if (-not (Test-Path $RepoRoot)) {
  $RepoRoot = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
}
. (Join-Path $RepoRoot 'ops\fleet\Get-FleetEndpoint.ps1')
$feSvc      = Get-FleetService -ServiceId 'dateapp-frontend'
$port       = [int]$feSvc.port
$fleetToken = [string]$env:FLEET_SHARED_TOKEN
$loopback   = '127.0.0.1'
if ([string]::IsNullOrWhiteSpace($fleetToken)) {
  $bindHost = $loopback
  $probeUrl = "http://${loopback}:$port/"
} else {
  $bindHost = Get-FleetBindHost -ServiceId 'dateapp-frontend'
  $probeUrl = Get-FleetServiceUrl -ServiceId 'dateapp-frontend' -PathSuffix '/'
}

$LogDir = Join-Path $RepoRoot 'logs'
New-Item -ItemType Directory -Force -Path $LogDir | Out-Null
$log = Join-Path $LogDir 'frontend-3200.log'
function L($m) {
  Add-Content -Path $log -Value ("[{0}] {1}" -f (Get-Date -Format 'yyyy-MM-dd HH:mm:ss'), $m) -Encoding utf8
}
L '=== start-dateapp-frontend-3200 start ==='
if ([string]::IsNullOrWhiteSpace($fleetToken)) {
  $warnMsg = "[start-dateapp-frontend-3200] WARNING: FLEET_SHARED_TOKEN is not set; binding $loopback on port $port (this machine only)."
  Write-Warning $warnMsg
  L $warnMsg
}

# Already healthy? do nothing
try {
  $probe = Invoke-WebRequest -Uri $probeUrl -TimeoutSec 3 -UseBasicParsing -ErrorAction Stop
  if ($probe.StatusCode -ge 200 -and $probe.StatusCode -lt 500) {
    L "frontend already up on $probeUrl"
    exit 0
  }
} catch {}

$dir = Join-Path $RepoRoot 'domains\youandinotai.com\frontend'
if (-not (Test-Path (Join-Path $dir 'package.json'))) {
  L "missing package.json under $dir"
  exit 1
}

if (-not (Test-Path (Join-Path $dir 'node_modules'))) {
  L 'installing frontend dependencies'
  Push-Location $dir
  try { cmd /c npm.cmd install *>> $log } catch { L "frontend install failed: $_" }
  Pop-Location
}

L "starting frontend in $dir on HOST=$bindHost PORT=$port"
$env:HOST = $bindHost
$env:PORT = [string]$port
$launchCmd = "set HOST=$bindHost&& set PORT=$port&& set NODE_ENV=production&& npx.cmd tsx server.ts"
$p = Start-Process -FilePath 'cmd.exe' `
  -ArgumentList '/c', $launchCmd `
  -WorkingDirectory $dir `
  -WindowStyle Hidden `
  -PassThru
L "started frontend pid $($p.Id)"

for ($i = 0; $i -lt 40; $i++) {
  Start-Sleep -Seconds 3
  try {
    $r = Invoke-WebRequest -Uri $probeUrl -TimeoutSec 3 -UseBasicParsing -ErrorAction SilentlyContinue
    if ($r.StatusCode -ge 200 -and $r.StatusCode -lt 500) {
      L 'frontend ready'
      exit 0
    }
  } catch {}
}
L 'frontend did not come up in time'
exit 1
