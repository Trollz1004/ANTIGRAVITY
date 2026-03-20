[CmdletBinding()]
param(
    [string]$RepoRoot,
    [string]$CodeXRoot,
    [string]$UserName = $env:USERNAME,
    [int]$IntervalMinutes = 5,
    [string]$TaskName = "CodeX-Task-Sentry"
)

$ErrorActionPreference = "Stop"

if (-not $RepoRoot) {
    $RepoRoot = Split-Path -Parent $PSScriptRoot
}
if (-not $CodeXRoot) {
    $CodeXRoot = Join-Path $RepoRoot "CodeX"
}

if ($IntervalMinutes -lt 1) {
    throw "IntervalMinutes must be at least 1."
}

$nodeScript = Join-Path $RepoRoot "scripts\codex-task-sentry.js"
if (-not (Test-Path -LiteralPath $nodeScript)) {
    throw "Missing sentry script: $nodeScript"
}
if (-not (Test-Path -LiteralPath $CodeXRoot)) {
    throw "Missing CodeX root: $CodeXRoot"
}

$nodeCmd = Get-Command node -ErrorAction SilentlyContinue
if ($null -eq $nodeCmd) {
    throw "Node.js is required but 'node' was not found in PATH."
}

$execute = "node"
$args = "`"$nodeScript`" --run-once --export-markdown --fallback-chain ollama,codex"

Unregister-ScheduledTask -TaskName $TaskName -Confirm:$false -ErrorAction SilentlyContinue

$action = New-ScheduledTaskAction `
    -Execute $execute `
    -Argument $args `
    -WorkingDirectory $CodeXRoot

$triggerBoot = New-ScheduledTaskTrigger -AtStartup
$triggerLogon = New-ScheduledTaskTrigger -AtLogOn -User $UserName
$triggerLoop = New-ScheduledTaskTrigger `
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
    -TaskName $TaskName `
    -Action $action `
    -Trigger @($triggerBoot, $triggerLogon, $triggerLoop) `
    -Settings $settings `
    -Principal $principal `
    -Description "Runs CodeX Task Sentry queue dispatcher for e-waste intake, OnlineRecycle responses, and low-cost revenue operations." `
    -Force | Out-Null

Start-ScheduledTask -TaskName $TaskName -ErrorAction SilentlyContinue

Write-Host "$TaskName installed for user '$UserName' (every $IntervalMinutes minutes)." -ForegroundColor Green
