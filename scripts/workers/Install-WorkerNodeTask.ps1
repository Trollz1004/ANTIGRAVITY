# Registers a worker node startup task.

[CmdletBinding()]
param(
  [ValidateSet('web','ai','display')]
  [string]$Role = 'ai',
  [string]$RepoRoot = 'C:\antigravity',
  [string]$TaskName = '',
  [string]$AgentHubUrl = 'http://192.168.0.8:3130',
  [switch]$SkipHealthCheckTask
)

$ErrorActionPreference = 'Stop'

if (-not $TaskName) {
  $TaskName = "ANTIGRAVITY-Worker-$Role"
}

$script = Join-Path $RepoRoot 'scripts\workers\Start-WorkerNode.ps1'
if (-not (Test-Path -LiteralPath $script)) {
  throw "Missing worker start script: $script"
}

$args = "-NoProfile -ExecutionPolicy Bypass -File `"$script`" -Role $Role -RepoRoot `"$RepoRoot`" -AgentHubUrl `"$AgentHubUrl`""
$action = New-ScheduledTaskAction -Execute 'powershell.exe' -Argument $args -WorkingDirectory $RepoRoot
$trigger = New-ScheduledTaskTrigger -AtLogOn
$settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -MultipleInstances IgnoreNew -RestartCount 3 -RestartInterval (New-TimeSpan -Minutes 2)

Register-ScheduledTask -TaskName $TaskName -Action $action -Trigger $trigger -Settings $settings -Force | Out-Null
Write-Host "Registered $TaskName role=$Role"

if (-not $SkipHealthCheckTask) {
  $healthScript = Join-Path $RepoRoot 'scripts\workers\Test-WorkerNode.ps1'
  if (-not (Test-Path -LiteralPath $healthScript)) {
    throw "Missing worker health script: $healthScript"
  }

  $healthTaskName = "$TaskName-Health30m"
  $healthArgs = "-NoProfile -ExecutionPolicy Bypass -File `"$healthScript`" -Role $Role -RepoRoot `"$RepoRoot`" -AgentHubUrl `"$AgentHubUrl`""
  $healthAction = New-ScheduledTaskAction -Execute 'powershell.exe' -Argument $healthArgs -WorkingDirectory $RepoRoot
  $healthTrigger = New-ScheduledTaskTrigger -Once -At (Get-Date).Date -RepetitionInterval (New-TimeSpan -Minutes 30) -RepetitionDuration (New-TimeSpan -Days 3650)
  $healthSettings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -MultipleInstances IgnoreNew -RestartCount 1 -RestartInterval (New-TimeSpan -Minutes 2)

  Register-ScheduledTask -TaskName $healthTaskName -Action $healthAction -Trigger $healthTrigger -Settings $healthSettings -Force | Out-Null
  Write-Host "Registered $healthTaskName role=$Role interval=30m"
}
