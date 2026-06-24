$ErrorActionPreference = 'Stop'

$RepoRoot = 'C:\antigravity'
$ScriptsDir = Join-Path $RepoRoot 'scripts\9020'

function Register-StartupTask {
    param(
        [string]$TaskName,
        [string]$ScriptPath,
        [int]$DelaySeconds = 0
    )

    $argument = "-NoProfile -ExecutionPolicy Bypass -File `"$ScriptPath`""
    $action = New-ScheduledTaskAction -Execute 'powershell.exe' -Argument $argument

    $startup = New-ScheduledTaskTrigger -AtStartup
    $logon = New-ScheduledTaskTrigger -AtLogOn
    if ($DelaySeconds -gt 0) {
        $startup.Delay = "PT${DelaySeconds}S"
        $logon.Delay = "PT${DelaySeconds}S"
    }

    $settings = New-ScheduledTaskSettingsSet `
        -AllowStartIfOnBatteries `
        -DontStopIfGoingOnBatteries `
        -RestartCount 3 `
        -RestartInterval (New-TimeSpan -Minutes 1) `
        -StartWhenAvailable

    Register-ScheduledTask `
        -TaskName $TaskName `
        -Action $action `
        -Trigger @($startup, $logon) `
        -Settings $settings `
        -Description "ANTIGRAVITY 9020 orchestrator autostart: $TaskName" `
        -RunLevel Highest `
        -Force | Out-Null
}

Register-StartupTask `
    -TaskName 'ANTIGRAVITY-9020-HermesRouter' `
    -ScriptPath (Join-Path $ScriptsDir 'Start-HermesRouter-9020.ps1') `
    -DelaySeconds 15

Register-StartupTask `
    -TaskName 'ANTIGRAVITY-9020-BusinessExchange' `
    -ScriptPath (Join-Path $ScriptsDir 'Start-BusinessExchange-9020.ps1') `
    -DelaySeconds 45

Start-ScheduledTask -TaskName 'ANTIGRAVITY-9020-HermesRouter'
Start-Sleep -Seconds 5
Start-ScheduledTask -TaskName 'ANTIGRAVITY-9020-BusinessExchange'

Get-ScheduledTask -TaskName 'ANTIGRAVITY-9020-*' | Select-Object TaskName, State

