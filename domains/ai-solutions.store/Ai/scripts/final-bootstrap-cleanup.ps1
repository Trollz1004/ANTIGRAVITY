<#
.SYNOPSIS
One-time elevated cleanup: disable legacy ANTIGRAVITY boot tasks, keep ANTIGRAVITY-Bootstrap.
#>
$ErrorActionPreference='Stop'
$legacy = Get-ScheduledTask | Where-Object { $_.TaskName -match 'ANTIGRAVITY|Paperclip|MissionControl|OpenClaw|Cloudflared|OmniRoute|Watchdog|RuntimeOps|Serve-3200' -and $_.TaskName -ne 'ANTIGRAVITY-Bootstrap' }
foreach ($t in $legacy) {
  Write-Host "disabling $($t.TaskName)"
  Disable-ScheduledTask -TaskName $t.TaskName | Out-Null
}
Write-Host 'done. Surviving ANTIGRAVITY tasks:'
Get-ScheduledTask | Where-Object { $_.TaskName -eq 'ANTIGRAVITY-Bootstrap' } | Select-Object TaskName,State,@{N='Enabled';E={$_.Settings.Enabled}} | Format-Table -AutoSize
