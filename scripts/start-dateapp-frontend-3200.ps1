<#
.SYNOPSIS
Installs frontend dependencies and starts YouAndINotAI frontend on :3200
(cloudflared origin for youandinotai.com).
#>
param([string]$RepoRoot = 'F:\ANTIGRAVITY')
$ErrorActionPreference = 'Continue'
$LogDir = Join-Path $RepoRoot 'logs'
New-Item -ItemType Directory -Force -Path $LogDir | Out-Null
$log = Join-Path $LogDir 'frontend-3200.log'
function L($m) {
  Add-Content -Path $log -Value ("[{0}] {1}" -f (Get-Date -Format 'yyyy-MM-dd HH:mm:ss'), $m) -Encoding utf8
}
L '=== start-dateapp-frontend-3200 start ==='

# Already healthy? do nothing
try {
  $probe = Invoke-WebRequest -Uri 'http://127.0.0.1:3200/' -TimeoutSec 3 -UseBasicParsing -ErrorAction Stop
  if ($probe.StatusCode -ge 200 -and $probe.StatusCode -lt 500) {
    L 'frontend already up on :3200'
    exit 0
  }
} catch {}

$dir = Join-Path $RepoRoot 'frontend\react-app'
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

L "starting frontend in $dir on PORT=3200"
$env:PORT = '3200'
$p = Start-Process -FilePath 'cmd.exe' `
  -ArgumentList '/c', 'set PORT=3200&& set NODE_ENV=production&& npx.cmd tsx server.ts' `
  -WorkingDirectory $dir `
  -WindowStyle Hidden `
  -PassThru
L "started frontend pid $($p.Id)"

for ($i = 0; $i -lt 40; $i++) {
  Start-Sleep -Seconds 3
  try {
    $r = Invoke-WebRequest -Uri 'http://127.0.0.1:3200/' -TimeoutSec 3 -UseBasicParsing -ErrorAction SilentlyContinue
    if ($r.StatusCode -ge 200 -and $r.StatusCode -lt 500) {
      L 'frontend ready'
      exit 0
    }
  } catch {}
}
L 'frontend did not come up in time'
exit 1
