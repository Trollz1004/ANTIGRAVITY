# One-time installer (run as Administrator): the ONLY Paperclip boot task on this node.
#
# 2026-10-17 consolidation: this node runs exactly ONE Paperclip instance.
#   port 4747, upstream npm paperclipai, PostgreSQL 5432 / paperclip_hq,
#   public URL https://mcp.youandinotai.com (cloudflared proxies it).
# The old :3917 "marketing command layer" task is retired; do not re-create it.
#
# Task runs NON-elevated (Limited) because Paperclip's startup doctor and the
# Postgres owner must not be admin. S4U lets it start at boot with nobody logged in,
# which is what a restart-safe deploy needs.
#
#   Right-click PowerShell -> Run as administrator, then:
#   powershell -ExecutionPolicy Bypass -File C:\ANTIGRAVITY\ops\paperclip\install-paperclip-task.ps1
$ErrorActionPreference = 'Stop'
$u = 'T5500-2-XEON-72\joshi'
$a = New-ScheduledTaskAction -Execute 'powershell.exe' -Argument '-NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -File "C:\ANTIGRAVITY\ops\paperclip\start-paperclip-hq.ps1" -Port 4747' -WorkingDirectory 'C:\ANTIGRAVITY'
$boot = New-ScheduledTaskTrigger -AtStartup; $boot.Delay = 'PT90S'
$logon = New-ScheduledTaskTrigger -AtLogOn -User $u
$p = New-ScheduledTaskPrincipal -UserId $u -LogonType S4U -RunLevel Limited
$s = New-ScheduledTaskSettingsSet -ExecutionTimeLimit ([TimeSpan]::Zero) -RestartCount 999 -RestartInterval (New-TimeSpan -Minutes 1) -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -MultipleInstances IgnoreNew -StartWhenAvailable
Register-ScheduledTask -TaskName 'ANTIGRAVITY Paperclip' -Action $a -Trigger @($boot, $logon) -Principal $p -Settings $s -Force -Description 'The single Paperclip instance on this node: port 4747, Postgres paperclip_hq, public via https://mcp.youandinotai.com. Non-elevated, starts at boot. Healed by the T5500 keepalive.' | Out-Null
Start-ScheduledTask -TaskName 'ANTIGRAVITY Paperclip'
Write-Host 'ANTIGRAVITY Paperclip task installed (boot+logon, non-elevated, :4747) and started.' -ForegroundColor Green
