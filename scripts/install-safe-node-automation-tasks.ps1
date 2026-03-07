[CmdletBinding()]
param(
    [ValidateSet("9020", "t5500", "sabretooth")]
    [string]$NodeProfile,
    [string]$RepoRoot,
    [string]$UserName = $env:USERNAME
)

$ErrorActionPreference = "Stop"

if (-not $RepoRoot) {
    $RepoRoot = Split-Path -Parent $PSScriptRoot
}

function Remove-TaskIfPresent {
    param([string]$TaskName)

    if (Get-ScheduledTask -TaskName $TaskName -ErrorAction SilentlyContinue) {
        Unregister-ScheduledTask -TaskName $TaskName -Confirm:$false | Out-Null
        Write-Host "Removed legacy task: $TaskName" -ForegroundColor Yellow
    }
}

function New-CodeXAction {
    param([string]$Profile)

    $scriptPath = Join-Path $RepoRoot "scripts\Run-Safe-NodeAutomation.ps1"
    $arguments = @(
        "-NoProfile",
        "-ExecutionPolicy", "Bypass",
        "-File", ('"{0}"' -f $scriptPath),
        "-Profile", $Profile,
        "-RepoRoot", ('"{0}"' -f $RepoRoot)
    ) -join " "

    New-ScheduledTaskAction -Execute "pwsh.exe" -Argument $arguments -WorkingDirectory $RepoRoot
}

function Register-CodeXTask {
    param(
        [string]$TaskName,
        [Microsoft.Management.Infrastructure.CimInstance]$Action,
        [Microsoft.Management.Infrastructure.CimInstance[]]$Triggers,
        [string]$Description
    )

    $settings = New-ScheduledTaskSettingsSet `
        -AllowStartIfOnBatteries `
        -DontStopIfGoingOnBatteries `
        -StartWhenAvailable `
        -MultipleInstances IgnoreNew

    $principal = New-ScheduledTaskPrincipal `
        -UserId $UserName `
        -RunLevel Limited `
        -LogonType Interactive

    if (Get-ScheduledTask -TaskName $TaskName -ErrorAction SilentlyContinue) {
        Unregister-ScheduledTask -TaskName $TaskName -Confirm:$false | Out-Null
    }

    Register-ScheduledTask `
        -TaskName $TaskName `
        -Action $Action `
        -Trigger $Triggers `
        -Settings $settings `
        -Principal $principal `
        -Description $Description `
        -Force | Out-Null

    Write-Host "Installed task: $TaskName" -ForegroundColor Green
}

function New-DailyTrigger {
    param([string]$Time)
    return New-ScheduledTaskTrigger -Daily -At ([DateTime]::Parse($Time))
}

function New-LogonTrigger {
    return New-ScheduledTaskTrigger -AtLogOn -User $UserName
}

$legacyTasks = @(
    "OPUS-Marketing-Watchdog",
    "OPUS Auto Start",
    "OPUS-CLI-AutoStart",
    "Social Engine 24x7"
)

foreach ($legacy in $legacyTasks) {
    Remove-TaskIfPresent -TaskName $legacy
}

switch ($NodeProfile) {
    "9020" {
        $taskName = "CodeX-9020-Safe-Drafts"
        Register-CodeXTask `
            -TaskName $taskName `
            -Action (New-CodeXAction -Profile "9020-content") `
            -Triggers @(
                (New-LogonTrigger),
                (New-DailyTrigger -Time "06:15"),
                (New-DailyTrigger -Time "12:15"),
                (New-DailyTrigger -Time "18:15")
            ) `
            -Description "Generates legal-safe draft packs and handoff queues for 9020 without live posting."
    }
    "t5500" {
        Register-CodeXTask `
            -TaskName "CodeX-T5500-Safe-Marketing-Audit" `
            -Action (New-CodeXAction -Profile "t5500-audit") `
            -Triggers @(
                (New-LogonTrigger),
                (New-DailyTrigger -Time "07:00"),
                (New-DailyTrigger -Time "13:00"),
                (New-DailyTrigger -Time "19:00")
            ) `
            -Description "Runs the legal-safe marketing policy audit and queue summary on T5500."

        Register-CodeXTask `
            -TaskName "CodeX-T5500-Revenue-Pack" `
            -Action (New-CodeXAction -Profile "t5500-revenue-pack") `
            -Triggers @(
                (New-LogonTrigger),
                (New-DailyTrigger -Time "08:30")
            ) `
            -Description "Builds the local OnlineRecycle revenue and marketing pack on T5500."
    }
    "sabretooth" {
        Register-CodeXTask `
            -TaskName "CodeX-SABRETOOTH-Safe-Control" `
            -Action (New-CodeXAction -Profile "sabretooth-control") `
            -Triggers @(
                (New-LogonTrigger),
                (New-DailyTrigger -Time "09:00")
            ) `
            -Description "Refreshes the safe-node control pack on Sabretooth."
    }
}

Write-Host ""
Write-Host "Safe node automation tasks are installed for profile '$NodeProfile'." -ForegroundColor Green
