# One-time installer (run as Administrator): Paperclip boot task, non-elevated, fixed port 3917.
# Why admin: a task that starts at boot without anyone logged in (S4U) can only be registered
# by an administrator. The task itself runs NON-elevated, because Paperclip's embedded
# Postgres refuses to start with admin rights.
#   Right-click PowerShell -> Run as administrator, then:
#   powershell -ExecutionPolicy Bypass -File C:\ANTIGRAVITY\ops\paperclip\install-paperclip-task.ps1
$ErrorActionPreference = 'Stop'
$u = 'T5500-2-XEON-72\joshi'
$a = New-ScheduledTaskAction -Execute 'powershell.exe' -Argument '-NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -File "C:\ANTIGRAVITY\ops\paperclip\start-paperclip.ps1" -Port 3917 -Foreground' -WorkingDirectory 'C:\ANTIGRAVITY'
$boot = New-ScheduledTaskTrigger -AtStartup; $boot.Delay = 'PT90S'
$p = New-ScheduledTaskPrincipal -UserId $u -LogonType S4U -RunLevel Limited
$s = New-ScheduledTaskSettingsSet -ExecutionTimeLimit ([TimeSpan]::Zero) -RestartCount 999 -RestartInterval (New-TimeSpan -Minutes 1) -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -MultipleInstances IgnoreNew -StartWhenAvailable
Register-ScheduledTask -TaskName 'ANTIGRAVITY Paperclip' -Action $a -Trigger $boot -Principal $p -Settings $s -Description 'Paperclip (marketing command layer) on fixed port 3917, non-elevated, starts at boot. Healed by the T5500 keepalive.' -Force | Out-Null
Start-ScheduledTask -TaskName 'ANTIGRAVITY Paperclip'
Write-Host 'ANTIGRAVITY Paperclip task installed (boot, non-elevated) and started.' -ForegroundColor Green
