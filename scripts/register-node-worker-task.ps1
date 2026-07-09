[CmdletBinding(SupportsShouldProcess=$true)]
param(
  [Parameter(Mandatory=$true)][string]$TaskName,
  [Parameter(Mandatory=$true)][string]$StartScript,
  [string]$RepoRoot = 'C:\antigravity',
  [string]$User = $env:USERNAME
)

$ErrorActionPreference = 'Stop'
$resolvedRepo = (Resolve-Path -LiteralPath $RepoRoot).Path
$resolvedScript = (Resolve-Path -LiteralPath $StartScript).Path

if (-not $resolvedScript.StartsWith($resolvedRepo, [System.StringComparison]::OrdinalIgnoreCase)) {
  throw "StartScript must be inside RepoRoot. Refusing: $resolvedScript"
}

$action = New-ScheduledTaskAction -Execute 'powershell.exe' -Argument "-NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -File `"$resolvedScript`" -RepoRoot `"$resolvedRepo`""
$trigger = New-ScheduledTaskTrigger -AtStartup
$settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DisallowStartIfOnBatteries:$false -RestartCount 3 -RestartInterval (New-TimeSpan -Minutes 1)

if ($PSCmdlet.ShouldProcess($TaskName, 'Register startup node worker task')) {
  Register-ScheduledTask -TaskName $TaskName -Action $action -Trigger $trigger -Settings $settings -User $User -RunLevel Highest -Force | Out-Null
  Write-Host "Registered scheduled task: $TaskName"
}
