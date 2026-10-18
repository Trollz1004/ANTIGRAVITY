[CmdletBinding()]
param(
    [ValidateSet("T5500", "t5500", "t5500")]
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
    "T5500" {
        $taskName = "CodeX-T5500-Safe-Drafts"
        Register-CodeXTask `
            -TaskName $taskName `
            -Action (New-CodeXAction -Profile "T5500-content") `
            -Triggers @(
                (New-LogonTrigger),
                (New-DailyTrigger -Time "06:15"),
                (New-DailyTrigger -Time "12:15"),
                (New-DailyTrigger -Time "18:15")
            ) `
            -Description "Generates legal-safe draft packs and handoff queues for T5500 without live posting."
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
            -Description "Runs the legal-safe marketing audit, node matrix refresh, public-copy policy scan, and queue summary on T5500."

        Register-CodeXTask `
            -TaskName "CodeX-T5500-Revenue-Pack" `
            -Action (New-CodeXAction -Profile "t5500-revenue-pack") `
            -Triggers @(
                (New-LogonTrigger),
                (New-DailyTrigger -Time "08:30")
            ) `
            -Description "Builds the deterministic OnlineRecycle revenue pack, reply templates, and eBay-ready output on T5500."
    }
    "t5500" {
        Register-CodeXTask `
            -TaskName "CodeX-T5500-Safe-Control" `
            -Action (New-CodeXAction -Profile "t5500-control") `
            -Triggers @(
                (New-LogonTrigger),
                (New-DailyTrigger -Time "09:00")
            ) `
            -Description "Refreshes the safe-node control pack, node matrix, and public-copy policy audit on T5500."
    }
}

Write-Host ""
Write-Host "Safe node automation tasks are installed for profile '$NodeProfile'." -ForegroundColor Green
