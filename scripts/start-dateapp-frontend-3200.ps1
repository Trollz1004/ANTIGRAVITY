<#
.SYNOPSIS
Starts date-app frontend dev server on :3200 from canonical repo.
#>
$ErrorActionPreference = 'Continue'
$LogDir = 'E:\ANTIGRAVITY\logs'
New-Item -ItemType Directory -Force -Path $LogDir | Out-Null
$log = Join-Path $LogDir 'frontend-3200.log'
function L($m){ Add-Content -Path $log -Value ("[{0}] {1}" -f (Get-Date -Format 'yyyy-MM-dd HH:mm:ss'), $m) -Encoding utf8 }
L '=== start-dateapp-frontend-3200 start ==='
$dir = 'E:\ANTIGRAVITY\frontend\react-app'
if (-not (Test-Path $dir)) { L "missing: $dir"; exit 1 }
if (-not (Test-Path (Join-Path $dir 'package.json'))) { L "missing package.json"; exit 1 }
$node = Join-Path ${env:ProgramFiles} 'nodejs\node.exe'
if (-not (Test-Path $node)) { $node = 'node' }
L "starting frontend in $dir"
$p = Start-Process -FilePath $node -ArgumentList "npm.cmd run dev -- --port 3200" -WorkingDirectory $dir -PassThru -NoNewWindow
L "started frontend pid $($p.Id)"
for ($i=0; $i -lt 40; $i++) {
  Start-Sleep -Seconds 2
  try {
    $r = Invoke-WebRequest -Uri 'http://127.0.0.1:3200/' -TimeoutSec 3 -UseBasicParsing -ErrorAction SilentlyContinue
    if ($r.StatusCode -ge 200 -and $r.StatusCode -lt 500) { L 'frontend ready'; exit 0 }
  } catch {}
}
L 'frontend did not come up in time'
exit 1
