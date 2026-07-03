# register-autostart-task.ps1 — Register autostart as Windows Scheduled Task
# RUN AS ADMINISTRATOR on each node
# Usage: pwsh -NoProfile -File scripts/register-autostart-task.ps1 -Node sabretooth

param(
  [Parameter(Mandatory)]
  [ValidateSet('sabretooth','9020','t5500')]
  [string]$Node
)

$taskName = "ANTIGRAVITY-Autostart-$Node"
$scriptPath = Join-Path $PSScriptRoot "node-$Node-autostart.bat"

if (-not (Test-Path $scriptPath)) {
  Write-Host "ERROR: $scriptPath not found" -ForegroundColor Red
  exit 1
}

$existing = Get-ScheduledTask -TaskName $taskName -ErrorAction SilentlyContinue
if ($existing) {
  Write-Host "Removing existing task: $taskName" -ForegroundColor Yellow
  Unregister-ScheduledTask -TaskName $taskName -Confirm:$false
}

$action = New-ScheduledTaskAction -Execute $scriptPath
$trigger = New-ScheduledTaskTrigger -AtStartup
$settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -StartWhenAvailable -RestartCount 3 -RestartInterval (New-TimeSpan -Minutes 1)
$principal = New-ScheduledTaskPrincipal -UserId "$env:USERDOMAIN\$env:USERNAME" -RunLevel Highest -LogonType S4U

Register-ScheduledTask -TaskName $taskName -Action $action -Trigger $trigger -Settings $settings -Principal $principal -Description "Auto-start ANTIGRAVITY services on $Node after reboot"

Write-Host "Registered: $taskName" -ForegroundColor Green
Write-Host "Script: $scriptPath" -ForegroundColor Green
Write-Host "Trigger: At Startup, run as admin" -ForegroundColor Green
Write-Host ""
Write-Host "Test with: Start-ScheduledTask -TaskName '$taskName'" -ForegroundColor Cyan
