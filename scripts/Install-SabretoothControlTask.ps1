# Registers the safe Sabretooth startup task for Mission Control + Agent Hub.
# It intentionally does not start Cloudflared, Hermes, FCC, watchdogs, sentries,
# browser controllers, payment tools, or DNS tooling on the workstation.

[CmdletBinding()]
param(
  [string]$RepoRoot = 'C:\antigravity',
  [string]$TaskName = 'ANTIGRAVITY-Sabretooth-Control'
)

$ErrorActionPreference = 'Stop'
$autostart = Join-Path $RepoRoot 'scripts\node-sabretooth-autostart.bat'
if (-not (Test-Path -LiteralPath $autostart)) {
  throw "Missing Sabretooth autostart script: $autostart"
}

$action = New-ScheduledTaskAction -Execute 'cmd.exe' -Argument "/c `"$autostart`"" -WorkingDirectory $RepoRoot
$trigger = New-ScheduledTaskTrigger -AtLogOn
$settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -MultipleInstances IgnoreNew -RestartCount 3 -RestartInterval (New-TimeSpan -Minutes 2)

Register-ScheduledTask -TaskName $TaskName -Action $action -Trigger $trigger -Settings $settings -Force | Out-Null
Write-Host "Registered $TaskName for Mission Control + Agent Hub only"
