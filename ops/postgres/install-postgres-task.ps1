# One-time installer (run as Administrator): PostgreSQL boot task.
#
# C:\Users\joshi\pgsql16 is a portable/manual Postgres 18 install — no Windows service.
# Without this task :5432 is simply absent after a reboot, which is what made Paperclip
# HQ's startup doctor abort and mcp.youandinotai.com stay down until someone intervened.
#
# Non-elevated (Limited): postgres refuses to run with admin rights, and the data dir
# belongs to the logged-in user.
#
#   Right-click PowerShell -> Run as administrator, then:
#   powershell -ExecutionPolicy Bypass -File C:\ANTIGRAVITY\ops\postgres\install-postgres-task.ps1
$ErrorActionPreference = 'Stop'
$u = 'T5500-2-XEON-72\joshi'
$a = New-ScheduledTaskAction -Execute 'powershell.exe' -Argument '-NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -File "C:\ANTIGRAVITY\ops\postgres\start-postgres.ps1"' -WorkingDirectory 'C:\ANTIGRAVITY'
$boot = New-ScheduledTaskTrigger -AtStartup; $boot.Delay = 'PT30S'
$logon = New-ScheduledTaskTrigger -AtLogOn -User $u
$p = New-ScheduledTaskPrincipal -UserId $u -LogonType S4U -RunLevel Limited
$s = New-ScheduledTaskSettingsSet -ExecutionTimeLimit ([TimeSpan]::Zero) -RestartCount 999 -RestartInterval (New-TimeSpan -Minutes 1) -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -MultipleInstances IgnoreNew -StartWhenAvailable
Register-ScheduledTask -TaskName 'ANTIGRAVITY Postgres' -Action $a -Trigger @($boot, $logon) -Principal $p -Settings $s -Force -Description 'Portable PostgreSQL 18 (:5432, data C:\Users\joshi\pgsql16-data). Non-elevated, starts before Paperclip HQ needs it.' | Out-Null
Start-ScheduledTask -TaskName 'ANTIGRAVITY Postgres'
Write-Host 'ANTIGRAVITY Postgres task installed (boot+logon, non-elevated, :5432) and started.' -ForegroundColor Green
