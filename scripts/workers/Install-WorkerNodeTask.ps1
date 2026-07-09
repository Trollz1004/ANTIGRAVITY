# Registers a worker node startup task.

[CmdletBinding()]
param(
  [ValidateSet('web','ai','display')]
  [string]$Role = 'ai',
  [string]$RepoRoot = 'C:\antigravity',
  [string]$TaskName = '',
  [string]$AgentHubUrl = 'http://192.168.0.8:3130'
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
