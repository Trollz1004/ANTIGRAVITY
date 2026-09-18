<#
Start remaining red services if not already listening.
Uses native Win32 process check, no try/catch/portrace style inline noise.
#>
$ErrorActionPreference='SilentlyContinue'
$repo='E:\ANTIGRAVITY'
$scripts=@{
  'AuthProxy'='ops\paperclip-runtime\run-paperclip-auth-proxy.ps1'
  'Paperclip'='ops\paperclip-runtime\run-paperclip-loopback.ps1'
  'MissionControl'='scripts\start-mission-control.ps1'
  'Frontend'='scripts\start-dateapp-frontend-3200.ps1'
}
$ports=@{
  'AuthProxy'=3110
  'Paperclip'=3120
  'MissionControl'=8787
  'Frontend'=3200
}
$started=@()
foreach ($label in $scripts.Keys) {
  $port=$ports[$label]
  $listening = Get-NetTCPConnection -State Listen -ErrorAction SilentlyContinue | Where-Object { $_.LocalPort -eq $port }
  if ($listening) { Write-Host "$label already up on :$port"; continue }
  $scriptPath = Join-Path $repo $scripts[$label]
  if (-not (Test-Path $scriptPath)) { Write-Host "$label script missing: $scriptPath"; continue }
  $p = Start-Process -FilePath 'powershell.exe' -ArgumentList '-NoProfile','-ExecutionPolicy','Bypass','-File',$scriptPath -WindowStyle Hidden -PassThru
  Write-Host "$label started pid $($p.Id)"
  $started += $label
}
Write-Host "started labels: $($started -join ',')"
