$action = New-ScheduledTaskAction -Execute 'pwsh.exe' -Argument '-ExecutionPolicy Bypass -File C:\Antigravity\scripts\opus-marketing-watchdog.ps1' -WorkingDirectory 'C:\Antigravity'
$trigger = New-ScheduledTaskTrigger -AtLogOn
$settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -StartWhenAvailable -RestartCount 3 -RestartInterval (New-TimeSpan -Minutes 5)
Register-ScheduledTask -TaskName 'OPUS-Marketing-Watchdog' -Action $action -Trigger $trigger -Settings $settings -Description 'Auto-starts Claude Code marketing on boot/restart. Marketing NEVER stops.' -Force
Write-Host "Task registered:"
Get-ScheduledTask -TaskName 'OPUS-Marketing-Watchdog' | Format-List TaskName,State,Description
