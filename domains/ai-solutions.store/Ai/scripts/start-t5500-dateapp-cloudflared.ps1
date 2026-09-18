<#
.SYNOPSIS
Starts cloudflared tunnel for T5500 date app public route.
#>
$ErrorActionPreference = 'Continue'
# Canonical repo on this node is F:\ANTIGRAVITY (E: is dead).
$RepoRoot = 'F:\ANTIGRAVITY'
$LogDir = Join-Path $RepoRoot 'logs'
New-Item -ItemType Directory -Force -Path $LogDir | Out-Null
$log = Join-Path $LogDir 'start-t5500-dateapp-cloudflared.log'
function L($m){ Add-Content -Path $log -Value ("[{0}] {1}" -f (Get-Date -Format o), $m) -Encoding utf8 }
L '=== start-t5500-dateapp-cloudflared ==='

# If tunnel already running, leave it.
$existing = Get-Process -Name cloudflared -ErrorAction SilentlyContinue
if ($existing) {
  L ("cloudflared already running pids: " + (($existing | ForEach-Object Id) -join ','))
  exit 0
}

$cf = 'C:\Program Files (x86)\cloudflared\cloudflared.exe'
if (-not (Test-Path $cf)) { L "cloudflared missing: $cf"; exit 1 }

# Prefer named tunnel config: youandinotai.com -> 127.0.0.1:3200
$config = 'C:\Users\joshl\.cloudflared\hermes-t5500.yml'
if (Test-Path $config) {
  L "starting named tunnel with $config"
  $proc = Start-Process -FilePath $cf -ArgumentList @(
    'tunnel','--config',$config,'run'
  ) -WindowStyle Hidden -PassThru
} else {
  # Fallback token tunnel — still must hit FRONTEND :3200, not API :8000
  $tokenFile = 'C:\Users\joshl\.cloudflared\t5500-dateapp.token'
  if (-not (Test-Path $tokenFile)) { L "token file missing: $tokenFile"; exit 1 }
  L 'starting token tunnel -> http://127.0.0.1:3200'
  $proc = Start-Process -FilePath $cf -ArgumentList @(
    'tunnel','--url','http://127.0.0.1:3200','--token-file',$tokenFile,
    '--logfile',(Join-Path $LogDir 't5500-dateapp-tunnel.log'),'--loglevel','info'
  ) -WindowStyle Hidden -PassThru
}

L "started cloudflared pid $($proc.Id)"
Start-Sleep -Seconds 3
if (-not (Get-Process -Id $proc.Id -ErrorAction SilentlyContinue)) { L 'cloudflared exited early'; exit 1 }
L 'cloudflared running'
exit 0
