<#
.SYNOPSIS
Installs frontend dependencies and starts date-app frontend dev server on :3200.
#>
param([string]$RepoRoot='E:\ANTIGRAVITY')
$ErrorActionPreference = 'Continue'
$LogDir = Join-Path $RepoRoot 'logs'
New-Item -ItemType Directory -Force -Path $LogDir | Out-Null
$log = Join-Path $LogDir 'frontend-3200.log'
function L($m){ Add-Content -Path $log -Value ("[{0}] {1}" -f (Get-Date -Format 'yyyy-MM-dd HH:mm:ss'), $m) -Encoding utf8 }
L '=== start-dateapp-frontend-3200 start ==='
$dir = Join-Path $RepoRoot 'frontend\react-app'
if (-not (Test-Path (Join-Path $dir 'package.json'))) { L "missing package.json"; exit 1 }
$rootJson = Join-Path $RepoRoot 'package.json'
if (Test-Path $rootJson) {
  $rootPkg = Get-Content $rootJson -Raw | ConvertFrom-Json -ErrorAction SilentlyContinue
  if ($rootPkg) {
    $workspaces = $rootPkg.workspaces
    if ($workspaces) {
      L 'installing workspace dependencies'
      Push-Location $RepoRoot
      try { cmd /c npm.cmd install *>> $log } catch { L "workspace install failed: $_" }
      Pop-Location
    }
  }
}
if (-not (Test-Path (Join-Path $dir 'node_modules'))) {
  L 'installing frontend dependencies'
  Push-Location $dir
  try { cmd /c npm.cmd install *>> $log } catch { L "frontend install failed: $_" }
  Pop-Location
}
L "starting frontend in $dir"
$p = Start-Process -FilePath 'cmd.exe' -ArgumentList '/c','npx.cmd','tsx','server.ts' -WorkingDirectory $dir -PassThru
L "started frontend pid $($p.Id)"
for ($i=0; $i -lt 40; $i++) {
  Start-Sleep -Seconds 3
  try {
    $r = Invoke-WebRequest -Uri 'http://127.0.0.1:3200/' -TimeoutSec 3 -UseBasicParsing -ErrorAction SilentlyContinue
    if ($r.StatusCode -ge 200 -and $r.StatusCode -lt 500) { L 'frontend ready'; exit 0 }
  } catch {}
}
L 'frontend did not come up in time'
exit 1
