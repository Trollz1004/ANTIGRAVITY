param(
  [string]$RepoRoot = (Get-Location).Path,
  [string]$TaskName = 'NewsCreator Dashboard',
  [string]$RunAtLogonFor = $env:USERNAME
)

$ErrorActionPreference = 'Stop'

$bat = Join-Path $RepoRoot 'start_dashboard.bat'
if (-not (Test-Path $bat)) { throw "start_dashboard.bat not found: $bat" }

Write-Host "Creating Scheduled Task '$TaskName' to run at user logon..."

$action = New-ScheduledTaskAction -Execute $bat
$trigger = New-ScheduledTaskTrigger -AtLogOn -User $RunAtLogonFor
$principal = New-ScheduledTaskPrincipal -UserId $RunAtLogonFor -RunLevel Highest
$settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -MultipleInstances IgnoreNew

try {
  Unregister-ScheduledTask -TaskName $TaskName -Confirm:$false -ErrorAction SilentlyContinue | Out-Null
} catch {}

Register-ScheduledTask -TaskName $TaskName -Action $action -Trigger $trigger -Principal $principal -Settings $settings | Out-Null

Write-Host "Scheduled Task created: $TaskName"
