# Registers T5500 runtime-only ops restart tasks.
# Use this when C:\antigravity is a dirty checkout and runtime services are
# deployed under C:\antigravity-runtime.

[CmdletBinding()]
param(
  [string]$RepoRoot = 'C:\antigravity-runtime',
  [string]$TaskName = 'ANTIGRAVITY-T5500-RuntimeOps'
)

$ErrorActionPreference = 'Stop'
$script = Join-Path $RepoRoot 'scripts\t5500\Start-T5500-RuntimeOps.ps1'
if (-not (Test-Path -LiteralPath $script)) {
  throw "Missing runtime ops start script: $script"
}

$args = "-NoProfile -ExecutionPolicy Bypass -File `"$script`" -RepoRoot `"$RepoRoot`""
$action = New-ScheduledTaskAction -Execute 'powershell.exe' -Argument $args -WorkingDirectory $RepoRoot
$trigger = New-ScheduledTaskTrigger -AtLogOn
$settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -MultipleInstances IgnoreNew -RestartCount 3 -RestartInterval (New-TimeSpan -Minutes 2)

Register-ScheduledTask -TaskName $TaskName -Action $action -Trigger $trigger -Settings $settings -Force | Out-Null
Write-Host "Registered $TaskName for $RepoRoot"

$healthTaskName = "$TaskName-Health30m"
$healthTrigger = New-ScheduledTaskTrigger -Once -At (Get-Date).Date -RepetitionInterval (New-TimeSpan -Minutes 30) -RepetitionDuration (New-TimeSpan -Days 3650)
$healthSettings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -MultipleInstances IgnoreNew -RestartCount 1 -RestartInterval (New-TimeSpan -Minutes 2)

Register-ScheduledTask -TaskName $healthTaskName -Action $action -Trigger $healthTrigger -Settings $healthSettings -Force | Out-Null
Write-Host "Registered $healthTaskName interval=30m"
