<#
.SYNOPSIS
Registers or updates (when -Apply is explicitly passed) the headless T5500 OpenClaw
watchdog scheduled task running ops/t5500/openclaw-sentry.ps1 -Headless.

.DESCRIPTION
Print-by-default safety script (Stage 4 — Judge-gated on T5500):
- Configures powershell.exe with -NoProfile -NonInteractive -WindowStyle Hidden
  and ScheduledTaskSettingsSet Hidden = $true so it never steals focus or opens popups.
- Dry-run by default: prints exact scheduled task commands without mutating Task Scheduler.
- Applies changes only when -Apply is passed on T5500.
#>
[CmdletBinding()]
param(
    [switch]$Apply,
    [string]$RepoPath = '',
    [string]$TaskName = 'ANTIGRAVITY OpenClaw Watchdog'
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

if (-not $RepoPath) {
    $RepoPath = (Resolve-Path (Join-Path $PSScriptRoot '..\..')).Path
} elseif (Test-Path $RepoPath) {
    $RepoPath = (Resolve-Path $RepoPath).Path
}

$SentryScript = Join-Path $RepoPath 'ops\t5500\openclaw-sentry.ps1'
if (-not (Test-Path $SentryScript)) {
    throw "OpenClaw sentry script not found at: $SentryScript"
}

$PsExe = Join-Path $env:SystemRoot 'System32\WindowsPowerShell\v1.0\powershell.exe'
$TaskArgs = "-NoProfile -NonInteractive -WindowStyle Hidden -ExecutionPolicy Bypass -File `"$SentryScript`" -RepoPath `"$RepoPath`" -Headless"

$modeLabel = if ($Apply) { 'APPLY (live Windows Task Scheduler registration)' } else { 'DRY-RUN (print-only; pass -Apply on T5500 to enact)' }

Write-Output '# ANTIGRAVITY T5500 OpenClaw Headless Watchdog Task'
Write-Output "# Mode: $modeLabel"
Write-Output "# TaskName: $TaskName"
Write-Output "# RepoPath: $RepoPath"
Write-Output "# Script: $SentryScript"
Write-Output '# WindowStyle: Hidden | ScheduledTaskSettingsSet Hidden = $true'
Write-Output ''

if (-not $Apply) {
    Write-Output "`$action = New-ScheduledTaskAction -Execute '$PsExe' -Argument '$TaskArgs' -WorkingDirectory '$RepoPath'"
    Write-Output '$triggerBoot = New-ScheduledTaskTrigger -AtStartup'
    Write-Output '$triggerLogon = New-ScheduledTaskTrigger -AtLogOn'
    Write-Output '$settings = New-ScheduledTaskSettingsSet -Hidden -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -StartWhenAvailable -MultipleInstances IgnoreNew -ExecutionTimeLimit ([TimeSpan]::Zero) -RestartCount 999 -RestartInterval (New-TimeSpan -Minutes 1)'
    Write-Output "Register-ScheduledTask -TaskName '$TaskName' -Action `$action -Trigger @(`$triggerBoot, `$triggerLogon) -Settings `$settings -Description 'Headless T5500 OpenClaw fleet watchdog (60s poll + 5m Telegram alert)' -Force"
    Write-Output "Start-ScheduledTask -TaskName '$TaskName'"
    exit 0
}

$action = New-ScheduledTaskAction -Execute $PsExe -Argument $TaskArgs -WorkingDirectory $RepoPath
$triggerBoot = New-ScheduledTaskTrigger -AtStartup
$triggerLogon = New-ScheduledTaskTrigger -AtLogOn
$settings = New-ScheduledTaskSettingsSet `
    -Hidden `
    -AllowStartIfOnBatteries `
    -DontStopIfGoingOnBatteries `
    -StartWhenAvailable `
    -MultipleInstances IgnoreNew `
    -ExecutionTimeLimit ([TimeSpan]::Zero) `
    -RestartCount 999 `
    -RestartInterval (New-TimeSpan -Minutes 1)

Register-ScheduledTask `
    -TaskName $TaskName `
    -Action $action `
    -Trigger @($triggerBoot, $triggerLogon) `
    -Settings $settings `
    -Description 'Headless T5500 OpenClaw fleet watchdog (60s poll + 5m Telegram alert)' `
    -Force | Out-Null

Start-ScheduledTask -TaskName $TaskName
Write-Output "APPLIED: Registered and started '$TaskName' (Hidden = $($settings.Hidden))."
