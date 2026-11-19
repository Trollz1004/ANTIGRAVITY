<#
.SYNOPSIS
Starts Mission OS (:3130) or JARVIS (:9150) from canonical repo.
#>
param([string]$RepoRoot='C:\ANTIGRAVITY',[int]$Port=3130,[switch]$Foreground)
$ErrorActionPreference = 'Continue'
if (-not (Test-Path (Join-Path $RepoRoot 'mission-os\server.mjs'))) {
  $RepoRoot = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
}
$LogDir = Join-Path $RepoRoot 'logs'
New-Item -ItemType Directory -Force -Path $LogDir | Out-Null
$log = Join-Path $LogDir 'mission-control.log'
function L($m){ Add-Content -Path $log -Value ("[{0}] {1}" -f (Get-Date -Format 'yyyy-MM-dd HH:mm:ss'), $m) -Encoding utf8 }
L '=== start-mission-control start ==='

$candidates = if ($Port -eq 9150) {
  @(
    (Join-Path $RepoRoot 'mission-control\server.mjs'),
    (Join-Path $RepoRoot 'mission-os\server.mjs')
  )
} else {
  @(
    (Join-Path $RepoRoot 'mission-os\server.mjs'),
    (Join-Path $RepoRoot 'mission-control\server.mjs'),
    (Join-Path $RepoRoot 'mission-control\server\_core\index.ts'),
    (Join-Path $RepoRoot 'mission-control\server.ts'),
    (Join-Path $RepoRoot 'apps\mission-control\server.js')
  )
}
$entry = $null
foreach ($c in $candidates) { if (Test-Path $c) { $entry = $c; break } }
if (-not $entry) { L "missing mission-control entry"; exit 1 }

$loopback = '127.0.0.1'
$guardToken = [string](@($env:MISSION_OS_TOKEN, $env:FLEET_SHARED_TOKEN) | Where-Object { -not [string]::IsNullOrWhiteSpace($_) } | Select-Object -First 1)
if ([string]::IsNullOrWhiteSpace($guardToken)) {
  $env:MISSION_OS_HOST = $loopback
  $env:MISSION_CONTROL_HOST = $loopback
}
$env:MISSION_OS_PORT = [string]$Port

$workdir = Split-Path $entry -Parent
L "starting mission-control from $entry on port $Port"
if ($entry -match '\.m?js$') {
  $p = Start-Process -FilePath 'node' -ArgumentList @($entry) -WorkingDirectory $RepoRoot -WindowStyle Hidden -PassThru
} else {
  $p = Start-Process -FilePath 'cmd.exe' -ArgumentList '/c','npx.cmd','tsx',$entry -WorkingDirectory $workdir -WindowStyle Hidden -PassThru
}
L "started mission-control pid $($p.Id)"
$probeUri = "http://${loopback}:$Port/health"
for ($i=0; $i -lt 40; $i++) {
  Start-Sleep -Seconds 2
  try {
    $r = Invoke-WebRequest -Uri $probeUri -TimeoutSec 3 -UseBasicParsing -ErrorAction SilentlyContinue
    if ($r.StatusCode -ge 200 -and $r.StatusCode -lt 500) { L 'mission-control ready'; exit 0 }
  } catch {}
}
L 'mission-control did not come up in time'
exit 1