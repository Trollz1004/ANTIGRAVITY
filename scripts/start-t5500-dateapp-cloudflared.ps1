<#
.SYNOPSIS
Starts cloudflared tunnel for T5500 date app public route.
#>
$ErrorActionPreference = 'Continue'
$LogDir = 'E:\ANTIGRAVITY\logs'
New-Item -ItemType Directory -Force -Path $LogDir | Out-Null
$log = Join-Path $LogDir 'start-t5500-dateapp-cloudflared.log'
function L($m){ Add-Content -Path $log -Value ("[{0}] {1}" -f (Get-Date -Format o), $m) -Encoding utf8 }
L '=== start-t5500-dateapp-cloudflared ==='
$cf = 'C:\Program Files (x86)\cloudflared\cloudflared.exe'
if (-not (Test-Path $cf)) { L 'cloudflared missing: C:\Program Files (x86)\cloudflared\cloudflared.exe'; exit 1 }
$tokenFile = 'C:\Users\joshl\.cloudflared\t5500-dateapp.token'
if (-not (Test-Path $tokenFile)) { L "token file missing: $tokenFile"; exit 1 }
$proc = Start-Process -FilePath $cf -ArgumentList @('tunnel','--url','http://127.0.0.1:8000','--token-file',$tokenFile,'--logfile',(Join-Path $LogDir 't5500-dateapp-tunnel.log'),'--loglevel','info') -WindowStyle Hidden -PassThru
L "started cloudflared pid $($proc.Id)"
Start-Sleep -Seconds 3
if (-not (Get-Process -Id $proc.Id -ErrorAction SilentlyContinue)) { L 'cloudflared exited early'; exit 1 }
L 'cloudflared running'
exit 0
