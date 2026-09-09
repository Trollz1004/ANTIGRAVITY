<#
.SYNOPSIS
Launch red services from native shell. One shot, no inline quoting hell.
#>
$ErrorActionPreference='SilentlyContinue'
$repo='E:\ANTIGRAVITY'
function Start-Script($label,$script,$args=@()){
  if(-not (Test-Path $script)){ Write-Host "$label script missing: $script"; return }
  $p = Start-Process -FilePath 'powershell.exe' -ArgumentList @('-NoProfile','-ExecutionPolicy','Bypass','-File',$script)+$args -WindowStyle Hidden -PassThru
  Write-Host "$label started pid $($p.Id)"
}
function Wait-Port($port,$sec=45,$label){
  $d = (Get-Date).AddSeconds($sec)
  while((Get-Date) -lt $d){
    $c = Get-NetTCPConnection -State Listen -ErrorAction SilentlyContinue | Where-Object { $_.LocalPort -eq $port }
    if($c){ Write-Host "$label up :$port"; return $true }
    Start-Sleep -Seconds 2
  }
  Write-Host "$label NOT up :$port"
  return $false
}
Write-Host '=== launch mission-control ==='
Start-Script 'MissionControl' "$repo\scripts\start-mission-control.ps1"
Wait-Port 8787 30 'MissionControl' | Out-Null
Write-Host '=== launch frontend ==='
Start-Script 'Frontend' "$repo\scripts\start-dateapp-frontend-3200.ps1" @('-RepoRoot',$repo)
Wait-Port 3200 45 'Frontend' | Out-Null
Write-Host '=== launch paperclip ==='
Start-Script 'Paperclip' "$repo\ops\paperclip-runtime\run-paperclip-loopback.ps1"
Wait-Port 3120 20 'Paperclip' | Out-Null
Write-Host '=== launch auth proxy ==='
Start-Script 'AuthProxy' "$repo\ops\paperclip-runtime\run-paperclip-auth-proxy.ps1"
Wait-Port 3110 20 'AuthProxy' | Out-Null
Write-Host '=== launch backend ==='
Start-Script 'Backend' "$repo\scripts\t5500\Start-YouAndINotAI-Tunnel.ps1" @('-RepoRoot',$repo)
Wait-Port 8000 30 'Backend' | Out-Null
Write-Host '=== launch cloudflare ==='
if(-not (Get-CimInstance Win32_Process -Filter "Name='cloudflared.exe'" -ErrorAction SilentlyContinue)){
  Start-Script 'Cloudflared' "$repo\scripts\start-t5500-dateapp-cloudflared.ps1"
  Start-Sleep -Seconds 6
} else { Write-Host 'Cloudflared already running' }
Write-Host '=== verify dashboard ==='
(Invoke-WebRequest -Uri 'http://127.0.0.1:5678/api/status' -UseBasicParsing -TimeoutSec 8).Content
Write-Host '=== done ==='
