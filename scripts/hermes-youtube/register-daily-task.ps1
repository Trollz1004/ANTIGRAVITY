<#
.SYNOPSIS
    Register (or remove) the HermesDailyVideo scheduled task.

.DESCRIPTION
    Rebuilt 2026-10-09. The original register-daily-task.ps1 was destroyed in
    the 2026-09-13 wipe along with the task itself, which is why every morning
    from 2026-09-14 onward reports NO RUN: nothing was firing at all.

    The task runs scripts/hermes-youtube/run-daily.ps1, which pins PATH, tees a
    log, and passes the pipeline's exit code through to "Last Run Result".

    StartWhenAvailable is set on purpose: if the machine is asleep or off at the
    scheduled minute, the run happens when it next wakes rather than being
    skipped silently. A late video is recoverable; a missing one is not.

.PARAMETER Time
    24h HH:mm local trigger time. Default 06:30, the pre-wipe schedule.

.PARAMETER TaskName
    Default HermesDailyVideo.

.PARAMETER Unregister
    Remove the task instead of creating it.

.EXAMPLE
    .\register-daily-task.ps1
    .\register-daily-task.ps1 -Time 07:15
    .\register-daily-task.ps1 -Unregister
#>
[CmdletBinding()]
param(
    [ValidatePattern('^\d{1,2}:\d{2}$')]
    [string] $Time = '06:30',

    [string] $TaskName = 'HermesDailyVideo',

    [switch] $Unregister
)

$ErrorActionPreference = 'Stop'

$runner = 'C:\ANTIGRAVITY\scripts\hermes-youtube\run-daily.ps1'

if ($Unregister) {
    if (Get-ScheduledTask -TaskName $TaskName -ErrorAction SilentlyContinue) {
        Unregister-ScheduledTask -TaskName $TaskName -Confirm:$false
        Write-Output "removed scheduled task: $TaskName"
    }
    else {
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
    -WorkingDirectory 'C:\ANTIGRAVITY\ops\hermes'

$trigger = New-ScheduledTaskTrigger -Daily -At $Time

$settings = New-ScheduledTaskSettingsSet `
    -StartWhenAvailable `
    -AllowStartIfOnBatteries `
    -DontStopIfGoingOnBatteries `
    -ExecutionTimeLimit (New-TimeSpan -Hours 1) `
    -MultipleInstances IgnoreNew

# Interactive token: the run needs the user's PATH and the edge-tts network
# path, and it must not require a stored password.
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
    -Description 'Hermes unattended daily video: source -> day folder -> voice -> visuals -> mp4 -> thumbnail -> upload -> summary. Last Run Result: 0 shipped, 2 stage/gate failed, 3 rendered but upload not armed, 4 bad environment.' `
    -Force | Out-Null

$task = Get-ScheduledTask -TaskName $TaskName
$info = Get-ScheduledTaskInfo -TaskName $TaskName

Write-Output "registered scheduled task: $TaskName"
Write-Output "  state:     $($task.State)"
Write-Output "  daily at:  $Time"
Write-Output "  next run:  $($info.NextRunTime)"
Write-Output "  runner:    $runner"
