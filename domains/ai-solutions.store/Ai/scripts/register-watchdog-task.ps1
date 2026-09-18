# Run once from elevated PowerShell. Requires admin.

$action = New-ScheduledTaskAction -Execute "powershell.exe" -Argument "-NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -File E:\ANTIGRAVITY\scripts\mission-control-watchdog.ps1"
$trigger1 = New-ScheduledTaskTrigger -AtStartup
$trigger2 = New-ScheduledTaskTrigger -AtLogOn
$principal = New-ScheduledTaskPrincipal -UserId $env:USERNAME -LogonType S4U -RunLevel Limited
$settings = New-ScheduledTaskSettingsSet -RestartCount 999 -RestartInterval (New-TimeSpan -Minutes 1) -StartWhenAvailable -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -ExecutionTimeLimit (New-TimeSpan -Days 0)

Register-ScheduledTask -TaskName "MissionControlWatchdog" -Action $action -Trigger @($trigger1, $trigger2) -Principal $principal -Settings $settings -Force

Get-ScheduledTask -TaskName 'MissionControlWatchdog' | Format-List TaskName, State, Author
(Get-ScheduledTask -TaskName 'MissionControlWatchdog').Settings.RestartCount
(Get-ScheduledTask -TaskName 'MissionControlWatchdog').Settings.RestartInterval
