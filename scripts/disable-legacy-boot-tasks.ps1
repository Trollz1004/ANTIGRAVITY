<#
Disable all legacy ANTIGRAVITY scheduled tasks except ANTIGRAVITY-Bootstrap.
#>
$ErrorActionPreference='SilentlyContinue'
$keep = 'ANTIGRAVITY-Bootstrap'
Get-ScheduledTask | Where-Object {
  $_.TaskName -ne $keep -and (
    $_.TaskName -match 'ANTIGRAVITY|Paperclip|MissionControl|Watchdog|RuntimeOps|FullStack|PublicStack|OpsWatchdog|OmniRouter'
  )
} | ForEach-Object {
  Write-Host "disabling $($_.TaskName)"
  Disable-ScheduledTask -TaskName $_.TaskName -ErrorAction SilentlyContinue | Out-Null
}
Write-Host 'done. Surviving ANTIGRAVITY tasks:'
Get-ScheduledTask | Where-Object {
  $_.TaskName -ne $keep -and (
    $_.TaskName -match 'ANTIGRAVITY|Paperclip|MissionControl|Watchdog|RuntimeOps|FullStack|PublicStack|OpsWatchdog|OmniRouter'
  )
} | Select-Object TaskName,State,@{N='Enabled';E={$_.Settings.Enabled}} | Format-Table -AutoSize
Write-Host 'ANTIGRAVITY-Bootstrap state:'
Get-ScheduledTask -TaskName $keep | Select-Object TaskName,State,@{N='Enabled';E={$_.Settings.Enabled}} | Format-Table -AutoSize
