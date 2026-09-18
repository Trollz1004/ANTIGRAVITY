# Yesterday's News Today - Task Scheduler Setup
# Run this on 9020 to create scheduled tasks
# Authority: Josh Coleman
# Date: 2026-03-19

$TaskName = "YesterdayNewsToday"
$ScriptPath = "E:\ANTIGRAVITY\scripts\dashboard-aidoesitall\yesterday-news-today.py"
$RuntimeRoot = Join-Path $env:USERPROFILE "Documents\ANTIGRAVITY-RUNTIME"
$LogPath = Join-Path $RuntimeRoot "logs\yesterday-news-today.log"

# Ensure log directory exists
New-Item -ItemType Directory -Force -Path (Join-Path $RuntimeRoot "logs") | Out-Null
New-Item -ItemType Directory -Force -Path (Join-Path $RuntimeRoot "yesterday-news\content") | Out-Null
New-Item -ItemType Directory -Force -Path (Join-Path $RuntimeRoot "yesterday-news\archive") | Out-Null

# Create the scheduled task
$Action = New-ScheduledTaskAction -Execute "python.exe" -Argument "$ScriptPath --mode generate" -WorkingDirectory "E:\ANTIGRAVITY\scripts\dashboard-aidoesitall"

# Trigger: Daily at 6:00 AM
$Trigger = New-ScheduledTaskTrigger -Daily -At "06:00"

# Settings
$Settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -StartWhenAvailable -RunOnlyIfNetworkAvailable

# Principal (run as current user)
$Principal = New-ScheduledTaskPrincipal -UserId "$env:USERNAME" -LogonType Interactive

# Register the task
Register-ScheduledTask -TaskName $TaskName -Action $Action -Trigger $Trigger -Settings $Settings -Principal $Principal -Force

Write-Host "Task '$TaskName' created successfully" -ForegroundColor Green
Write-Host "Schedule: Daily at 6:00 AM" -ForegroundColor Cyan
Write-Host "Script: $ScriptPath" -ForegroundColor Gray
Write-Host "Log: $LogPath" -ForegroundColor Gray
Write-Host "Runtime root: $RuntimeRoot" -ForegroundColor Gray
Write-Host "Requires: NEWSAPI_KEY in E:\ANTIGRAVITY\.env for NewsAPI, otherwise RSS fallback is used" -ForegroundColor Gray
Write-Host "Optional: OMNI_BASE_URL / OMNI_MODEL / OMNIROUTE_KEY in E:\ANTIGRAVITY\.env for cloud-model script generation via OmniRouter" -ForegroundColor Gray
Write-Host ""
Write-Host "To manage the task:" -ForegroundColor Yellow
Write-Host "  Start: Start-ScheduledTask -TaskName '$TaskName'" -ForegroundColor Gray
Write-Host "  Stop: Stop-ScheduledTask -TaskName '$TaskName'" -ForegroundColor Gray
Write-Host "  Disable: Disable-ScheduledTask -TaskName '$TaskName'" -ForegroundColor Gray
Write-Host "  Remove: Unregister-ScheduledTask -TaskName '$TaskName' -Confirm:$false" -ForegroundColor Gray
