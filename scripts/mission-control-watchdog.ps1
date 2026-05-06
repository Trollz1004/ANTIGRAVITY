# Mission Control API Watchdog
# Purpose: Monitor MC API (8787) and restart if down, log all checks
# How to run: .\mission-control-watchdog.ps1 from elevated PowerShell
# How to stop: Ctrl+C or stop scheduled task

$logPath = "C:\Antigravity\logs\mission-control-watchdog.log"
$apiPort = 8787
$portsToCheck = @(3100, 11434, 11435, 18789)
$restartCounts = @{}
$startTime = Get-Date
Add-Content -Path $logPath -Value "watchdog started at $(Get-Date -Format o)"

while ($true) {
  $timestamp = Get-Date -Format "HH:mm:ss"
  
  # Check MC API (8787)
  $conn = Get-NetTCPConnection -LocalPort $apiPort -State Listen -ErrorAction SilentlyContinue
  if (-not $conn) {
    $key = "api"
    $now = Get-Date
    if (-not $restartCounts[$key]) { $restartCounts[$key] = @() }
    $restartCounts[$key] = $restartCounts[$key] | Where-Object { ($now - $_).TotalMinutes -lt 5 }
    if ($restartCounts[$key].Count -lt 3) {
      Add-Content -Path $logPath -Value "[$timestamp] MC API down, restarting"
      Start-Process python -ArgumentList "-m","uvicorn","mission_control_api.main:app","--host","127.0.0.1","--port","8787" -WorkingDirectory "C:\Antigravity\services\mission-control-api" -WindowStyle Hidden
      $restartCounts[$key] += $now
    } else {
      Add-Content -Path $logPath -Value "[$timestamp] ALERT: MC API restart cap reached"
      Start-Sleep -Seconds 600
    }
  } else {
    Add-Content -Path $logPath -Value "[$timestamp] MC API ok"
  }

  # Check other ports (log only)
  foreach ($port in $portsToCheck) {
    $pConn = Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue
    $status = if ($pConn) { "ok" } else { "down" }
    Add-Content -Path $logPath -Value "[$timestamp] port $port $status"
  }

  Start-Sleep -Seconds 30
}
