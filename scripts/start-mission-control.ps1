<#
.SYNOPSIS
Starts Mission Control on :8787 from canonical repo.
#>
param([string]$RepoRoot='E:\ANTIGRAVITY',[int]$Port=8787,[switch]$Foreground)
$ErrorActionPreference = 'Continue'
$LogDir = Join-Path $RepoRoot 'logs'
New-Item -ItemType Directory -Force -Path $LogDir | Out-Null
$log = Join-Path $LogDir 'mission-control.log'
function L($m){ Add-Content -Path $log -Value ("[{0}] {1}" -f (Get-Date -Format 'yyyy-MM-dd HH:mm:ss'), $m) -Encoding utf8 }
L '=== start-mission-control start ==='
$entry = Join-Path $RepoRoot 'apps\mission-control\server.js'
if (-not (Test-Path $entry)) { L "missing mission-control entry: $entry"; exit 1 }
$node = Join-Path ${env:ProgramFiles} 'nodejs\node.exe'
if (-not (Test-Path $node)) { $node = 'node' }
passThru = $Foreground.IsPresent
$p = Start-Process -FilePath $node -ArgumentList $entry -WorkingDirectory (Join-Path $RepoRoot 'apps\mission-control') -PassThru:$passThru -NoNewWindow
L "started mission-control pid $($p.Id)"
for ($i=0; $i -lt 30; $i++) {
  Start-Sleep -Seconds 2
  try {
    $r = Invoke-WebRequest -Uri "http://127.0.0.1:$Port/" -TimeoutSec 3 -UseBasicParsing -ErrorAction SilentlyContinue
    if ($r.StatusCode -ge 200 -and $r.StatusCode -lt 500) { L 'mission-control ready'; exit 0 }
  } catch {}
}
L 'mission-control did not come up in time'
exit 1
