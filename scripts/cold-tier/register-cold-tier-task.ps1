<#
.SYNOPSIS
    Register (or remove) the ANTIGRAVITY ColdTierBackup scheduled task on T5500.

.PARAMETER Time
    24h HH:mm local trigger time. Default 03:30 per BACKUP-DESIGN.md.

.PARAMETER TaskName
    Default 'ANTIGRAVITY ColdTierBackup'.

.PARAMETER Unregister
    Remove the task instead of creating it.
#>
[CmdletBinding()]
param(
    [ValidatePattern('^\d{1,2}:\d{2}$')]
    [string] $Time = '03:30',

    [string] $TaskName = 'ANTIGRAVITY ColdTierBackup',

    [switch] $Unregister
)

$ErrorActionPreference = 'Stop'
$runner = 'C:\ANTIGRAVITY\scripts\cold-tier\run-cold-tier.ps1'

if ($Unregister) {
    if (Get-ScheduledTask -TaskName $TaskName -ErrorAction SilentlyContinue) {
        Unregister-ScheduledTask -TaskName $TaskName -Confirm:$false
        Write-Output "removed scheduled task: $TaskName"
    } else {
        Write-Output "no such scheduled task: $TaskName"
    }
    return
}

if (-not (Test-Path $runner)) {
    throw "runner not found: $runner"
}

$action = New-ScheduledTaskAction `
    -Execute 'powershell.exe' `
    -Argument "-NoProfile -NonInteractive -ExecutionPolicy Bypass -File `"$runner`"" `
    -WorkingDirectory 'C:\ANTIGRAVITY'

$trigger = New-ScheduledTaskTrigger -Daily -At $Time

$settings = New-ScheduledTaskSettingsSet `
    -StartWhenAvailable `
    -AllowStartIfOnBatteries `
    -DontStopIfGoingOnBatteries `
    -ExecutionTimeLimit (New-TimeSpan -Hours 2) `
    -MultipleInstances IgnoreNew

$principal = New-ScheduledTaskPrincipal `
    -UserId "$env:USERDOMAIN\$env:USERNAME" `
    -LogonType Interactive `
    -RunLevel Limited

Register-ScheduledTask `
    -TaskName $TaskName `
    -Action $action `
    -Trigger $trigger `
    -Settings $settings `
    -Principal $principal `
    -Description 'Nightly cold-tier backup (03:30): git bundle create -> tar.zst day folders -> rclone copy to Google Drive (antigravity/bundles & antigravity/content) -> 14-day bundle prune.' `
    -Force | Out-Null

$task = Get-ScheduledTask -TaskName $TaskName
$info = Get-ScheduledTaskInfo -TaskName $TaskName

Write-Output "registered scheduled task: $TaskName"
Write-Output "  state:     $($task.State)"
Write-Output "  daily at:  $Time"
Write-Output "  next run:  $($info.NextRunTime)"
Write-Output "  runner:    $runner"
