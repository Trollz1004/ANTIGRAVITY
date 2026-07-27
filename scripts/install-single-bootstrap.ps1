<#
.SYNOPSIS
Disable legacy ANTIGRAVITY scheduled tasks and register single bootstrap.
#>
$ErrorActionPreference = 'Continue'
$keep = @('ANTIGRAVITY-Bootstrap','Hermes_Dashboard_9119','Hermes_Dashboard_9119_SYSTEM','Hermes_Cloudflared_Tunnel','Hermes_Cloudflared_Tunnel_SYSTEM')
Get-ScheduledTask | Where-Object { $_.TaskName -match 'ANTIGRAVITY|Paperclip|MissionControl|OpenClaw|Cloudflared|OmniRoute|Watchdog|RuntimeOps|Serve-3200' } | ForEach-Object {
  if ($keep -notcontains $_.TaskName) {
    Write-Host "disabling $($_.TaskName)"
    Disable-ScheduledTask -TaskName $_.TaskName -ErrorAction SilentlyContinue | Out-Null
  }
}
$action = New-ScheduledTaskAction -Execute 'powershell.exe' -Argument '-NoProfile -ExecutionPolicy Bypass -NonInteractive -File E:\ANTIGRAVITY\scripts\autostart-mission.ps1'
$trigger = New-ScheduledTaskTrigger -AtLogOn
$settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -StartWhenAvailable -RunOnlyIfNetworkAvailable -RestartInterval (New-TimeSpan -Minutes 1) -RestartCount 3
Register-ScheduledTask -TaskName 'ANTIGRAVITY-Bootstrap' -Action $action -Trigger $trigger -Settings $settings -Description 'ANTIGRAVITY single boot loader' -Force | Select-Object TaskName,State
Write-Host "done. Surviving tasks:"
Get-ScheduledTask | Where-Object { $_.TaskName -match 'ANTIGRAVITY|Paperclip|MissionControl|OpenClaw|Cloudflared|OmniRoute|Watchdog|RuntimeOps|Serve-3200' } | Select-Object TaskName,State,@{N='Enabled';E={$_.Settings.Enabled}} | Format-Table -AutoSize
