param(
  [string]$Root = 'C:\antigravity-paperclip-dateapp-ops',
  [int]$Port = 3120,
  [string]$HealthUrl = 'http://127.0.0.1:3120/api/health'
)
$ErrorActionPreference = 'Stop'
$logDir = Join-Path $Root 'logs'
New-Item -ItemType Directory -Force -Path $logDir | Out-Null
$log = Join-Path $logDir 'paperclip-watchdog.log'
function Write-WatchdogLog([string]$Message) {
  "[$(Get-Date -Format o)] $Message" | Add-Content -LiteralPath $log -Encoding utf8
}
function Test-PaperclipHealthy {
  $portOpen = Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue | Where-Object { $_.LocalAddress -eq '127.0.0.1' -or $_.LocalAddress -eq '0.0.0.0' } | Select-Object -First 1
  if (-not $portOpen) { return $false }
  try {
    $response = Invoke-WebRequest -UseBasicParsing -Uri $HealthUrl -TimeoutSec 5
    return ($response.StatusCode -ge 200 -and $response.StatusCode -lt 500)
  } catch {
    Write-WatchdogLog "health check failed: $($_.Exception.Message)"
    return $false
  }
}
$runner = Join-Path $Root 'scripts\run-paperclip-loopback.ps1'
if (-not (Test-Path -LiteralPath $runner)) {
  Write-WatchdogLog "runner missing: $runner"
  exit 2
}
if (Test-PaperclipHealthy) {
  Write-WatchdogLog 'healthy; no action needed'
  exit 0
}
Write-WatchdogLog 'unhealthy or down; restarting PaperclipDateAppLoopback task'
try {
  $task = Get-ScheduledTask -TaskName 'PaperclipDateAppLoopback' -ErrorAction SilentlyContinue
  if ($task) {
    if ($task.State -eq 'Running') {
      Stop-ScheduledTask -TaskName 'PaperclipDateAppLoopback' -ErrorAction SilentlyContinue
      Start-Sleep -Seconds 3
    }
    Start-ScheduledTask -TaskName 'PaperclipDateAppLoopback'
  } else {
    Start-Process -FilePath 'powershell.exe' -ArgumentList @('-NoProfile','-ExecutionPolicy','Bypass','-File', $runner) -WorkingDirectory $Root -WindowStyle Hidden
  }
  Start-Sleep -Seconds 15
  if (Test-PaperclipHealthy) {
    Write-WatchdogLog 'restart successful'
    exit 0
  }
  Write-WatchdogLog 'restart attempted but health check still failed'
  exit 1
} catch {
  Write-WatchdogLog "restart failed: $($_.Exception.Message)"
  exit 1
}
