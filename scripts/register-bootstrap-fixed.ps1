<#
.SYNOPSIS
Register/replace single ANTIGRAVITY-Bootstrap scheduled task.
#>
$ErrorActionPreference='SilentlyContinue'
$action = New-ScheduledTaskAction -Execute 'powershell.exe' -Argument '-NoProfile -ExecutionPolicy Bypass -NonInteractive -File E:\ANTIGRAVITY\scripts\autostart-mission.ps1'
$trigger = New-ScheduledTaskTrigger -AtLogOn
$settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -StartWhenAvailable -RunOnlyIfNetworkAvailable -RestartInterval (New-TimeSpan -Minutes 1) -RestartCount 3
$principal = New-ScheduledTaskPrincipal -UserId "$env:USERDOMAIN\$env:USERNAME" -RunLevel Highest -LogonType InteractiveToken
$task = Register-ScheduledTask -TaskName 'ANTIGRAVITY-Bootstrap' -Action $action -Trigger $trigger -Settings $settings -Principal $principal -Description 'ANTIGRAVITY single boot loader' -Force
$task | Select-Object TaskName,State | Format-List
Write-Host 'legacy matches:'
Get-ScheduledTask | Where-Object { $_.TaskName -match 'ANTIGRAVITY|Paperclip|MissionControl|Watchdog|RuntimeOps' } | Select-Object TaskName,State,@{N='Enabled';E={$_.Settings.Enabled}} | Format-Table -AutoSize
