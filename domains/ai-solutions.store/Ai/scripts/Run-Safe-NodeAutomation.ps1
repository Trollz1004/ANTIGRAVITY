<#
.SYNOPSIS
One-shot safe node automation profile runner.
Replaces infinite-loop variant. Each profile should be short-running and idempotent.
#>
param(
    [string]$Profile = 't5500-audit',
    [string]$RepoRoot = 'E:\ANTIGRAVITY'
)
$ErrorActionPreference = 'Continue'
$LogDir = Join-Path $RepoRoot 'logs\profiles'
New-Item -ItemType Directory -Force -Path $LogDir | Out-Null
$log = Join-Path $LogDir "$Profile-$(Get-Date -Format 'yyyyMMdd-HHmmss').log"
function L($m){ Add-Content -Path $log -Value ("[{0}] {1}" -f (Get-Date -Format 'o'), $m) -Encoding utf8 }
L "one-shot profile start: $Profile"
# Minimal profile runner. Add profile-specific commands here without infinite loops.
if ($Profile -eq 't5500-revenue-pack') {
  $favicon = Join-Path $RepoRoot 'frontend\react-app\public\favicon.ico'
  if (-not (Test-Path $favicon)) { L 'revenue-pack: favicon missing'; exit 0 }
  L 'revenue-pack: preflight ok'
} elseif ($Profile -eq 't5500-audit') {
  $ports = @(3100,3110,3120,8787,18789,20128,20129,3200,54329,8000)
  foreach ($p in $ports) {
    $listening = Get-NetTCPConnection -LocalPort $p -State Listen -ErrorAction SilentlyContinue | Select-Object -First 1
    $status = if ($listening) { 'up' } else { 'down' }
    L "audit: port $p $status"
  }
} else {
  L "profile not recognized: $Profile; no action"
}
L "one-shot profile end: $Profile"
exit 0
