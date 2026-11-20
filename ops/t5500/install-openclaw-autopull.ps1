<#
.SYNOPSIS
Prints or registers (when -Apply is passed) the hourly T5500 scheduled task
'ANTIGRAVITY OpenClaw Autopull' running ops/t5500/openclaw-autopull.ps1 -Apply.

.DESCRIPTION
Print-by-default safety installer for the T5500 hourly OpenClaw autopull task:
- Task name: 'ANTIGRAVITY OpenClaw Autopull'
- Runs ops/t5500/openclaw-autopull.ps1 -Apply once an hour, completely hidden
  (-WindowStyle Hidden, ScheduledTaskSettingsSet -Hidden) so it never opens a window
  or steals keyboard focus.
- Without -Apply (default): prints the exact scheduled task definition it would register.
- With -Apply: registers the scheduled task in Windows Task Scheduler.
#>
[CmdletBinding()]
param(
    [switch]$Apply,
    [string]$RepoPath = '',
    [string]$TaskName = 'ANTIGRAVITY OpenClaw Autopull'
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

if (-not $RepoPath) {
    $RepoPath = (Resolve-Path (Join-Path $PSScriptRoot '..\..')).Path
} elseif (Test-Path $RepoPath) {
    $RepoPath = (Resolve-Path $RepoPath).Path
}

$AutopullScript = Join-Path $RepoPath 'ops\t5500\openclaw-autopull.ps1'
if (-not (Test-Path $AutopullScript)) {
    throw "OpenClaw autopull script not found at: $AutopullScript"
}

function Format-SafePath([string]$RawPath) {
    $out = [string]$RawPath
    if ($env:LOCALAPPDATA) {
        $out = $out.Replace($env:LOCALAPPDATA, '%LOCALAPPDATA%')
    }
    if ($env:USERPROFILE) {
        $out = $out.Replace($env:USERPROFILE, '%USERPROFILE%')
    }
    return $out
}

$DisplayRepoPath = Format-SafePath $RepoPath
$DisplayAutopullScript = Format-SafePath $AutopullScript
$PsExe = Join-Path $env:SystemRoot 'System32\WindowsPowerShell\v1.0\powershell.exe'
$TaskArgs = "-NoProfile -NonInteractive -WindowStyle Hidden -ExecutionPolicy Bypass -File `"$AutopullScript`" -RepoPath `"$RepoPath`" -Apply"
$DisplayTaskArgs = Format-SafePath $TaskArgs

$modeLabel = if ($Apply) { 'APPLY (live Windows Task Scheduler registration)' } else { 'DRY-RUN (print-only; pass -Apply on T5500 to register)' }

Write-Output '# ANTIGRAVITY T5500 OpenClaw Hourly Autopull Scheduled Task'
Write-Output "# Mode: $modeLabel"
Write-Output "# TaskName: $TaskName"
Write-Output '# Schedule: Hourly (every 1 hour)'
Write-Output "# RepoPath: $DisplayRepoPath"
Write-Output "# Script: $DisplayAutopullScript"
Write-Output '# WindowStyle: Hidden | ScheduledTaskSettingsSet Hidden = $true'
Write-Output ''

if (-not $Apply) {
    Write-Output "`$action = New-ScheduledTaskAction -Execute '$PsExe' -Argument '$DisplayTaskArgs' -WorkingDirectory '$DisplayRepoPath'"
    Write-Output '$triggerHourly = New-ScheduledTaskTrigger -Once -At (Get-Date).Date.AddHours(1) -RepetitionInterval (New-TimeSpan -Hours 1) -RepetitionDuration (New-TimeSpan -Days 3650)'
    Write-Output '$settings = New-ScheduledTaskSettingsSet -Hidden -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -StartWhenAvailable -MultipleInstances IgnoreNew -ExecutionTimeLimit (New-TimeSpan -Minutes 15)'
    Write-Output "Register-ScheduledTask -TaskName '$TaskName' -Action `$action -Trigger `$triggerHourly -Settings `$settings -Description 'Hourly T5500 OpenClaw fast-forward autopull, service health verifier, and pause way-back' -Force"
    exit 0
}

$action = New-ScheduledTaskAction -Execute $PsExe -Argument $TaskArgs -WorkingDirectory $RepoPath
$triggerHourly = New-ScheduledTaskTrigger `
    -Once `
    -At (Get-Date).Date.AddHours(1) `
    -RepetitionInterval (New-TimeSpan -Hours 1) `
    -RepetitionDuration (New-TimeSpan -Days 3650)
$settings = New-ScheduledTaskSettingsSet `
    -Hidden `
    -AllowStartIfOnBatteries `
    -DontStopIfGoingOnBatteries `
    -StartWhenAvailable `
    -MultipleInstances IgnoreNew `
    -ExecutionTimeLimit (New-TimeSpan -Minutes 15)

Register-ScheduledTask `
    -TaskName $TaskName `
    -Action $action `
    -Trigger $triggerHourly `
    -Settings $settings `
    -Description 'Hourly T5500 OpenClaw fast-forward autopull, service health verifier, and pause way-back' `
    -Force | Out-Null

Write-Output "APPLIED: Registered hourly scheduled task '$TaskName' (Hidden = $($settings.Hidden))."
