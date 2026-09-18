[CmdletBinding()]
param(
    [string]$RepoRoot,
    [string]$CodeXRoot,
    [string]$UserName = $env:USERNAME,
    [ValidateSet("docker", "host", "off")]
    [string]$MissionMode = "off",
    [switch]$AllowHostLaunch,
    [int]$IntervalMinutes = 5
)

$ErrorActionPreference = "Stop"

if (-not $RepoRoot) {
    $RepoRoot = Split-Path -Parent $PSScriptRoot
}
if (-not $CodeXRoot) {
    $CodeXRoot = Join-Path $RepoRoot "CodeX"
}
$taskName = "CodeX-Mission-Guardian"
$ensureScript = Join-Path $RepoRoot "scripts\Ensure-CodeX-Mission.ps1"

if ($IntervalMinutes -lt 1) {
    throw "IntervalMinutes must be at least 1."
}

if (-not (Test-Path -LiteralPath $ensureScript)) {
    throw "Missing guardian script: $ensureScript"
}
if (-not (Test-Path -LiteralPath $CodeXRoot)) {
    throw "Missing CodeX root: $CodeXRoot"
}

Unregister-ScheduledTask -TaskName $taskName -Confirm:$false -ErrorAction SilentlyContinue

$hostFlag = if ($AllowHostLaunch) { "-AllowHostLaunch" } else { "" }
$arguments = "-NoLogo -NoProfile -NonInteractive -WindowStyle Hidden -ExecutionPolicy Bypass -File `"$ensureScript`" -Mode $MissionMode $hostFlag"

$action = New-ScheduledTaskAction `
    -Execute "pwsh.exe" `
    -Argument $arguments `
    -WorkingDirectory $CodeXRoot

$triggerBoot = New-ScheduledTaskTrigger -AtStartup
$triggerLogon = New-ScheduledTaskTrigger -AtLogOn -User $UserName
$triggerWatchdog = New-ScheduledTaskTrigger `
    -Once `
    -At (Get-Date).AddMinutes(1) `
    -RepetitionInterval (New-TimeSpan -Minutes $IntervalMinutes) `
    -RepetitionDuration (New-TimeSpan -Days 3650)

$settings = New-ScheduledTaskSettingsSet `
    -AllowStartIfOnBatteries `
    -DontStopIfGoingOnBatteries `
    -StartWhenAvailable `
    -MultipleInstances IgnoreNew

$principal = New-ScheduledTaskPrincipal `
    -UserId $UserName `
    -RunLevel Highest `
    -LogonType Interactive

Register-ScheduledTask `
    -TaskName $taskName `
    -Action $action `
    -Trigger @($triggerBoot, $triggerLogon, $triggerWatchdog) `
    -Settings $settings `
    -Principal $principal `
    -Description "CodeX mission guardian for desktop-app-first operation. Off by default on Sabretooth unless host/docker relaunch is intentionally re-enabled." `
    -Force | Out-Null

Write-Host "$taskName installed for user '$UserName' (mode=$MissionMode, every $IntervalMinutes minutes)." -ForegroundColor Green
