# Registers Mission Control GUI auto-start tasks.
# Safe to run repeatedly. It removes the retired Python API task that used port 8787.

[CmdletBinding()]
param(
    [string]$RepoRoot = 'C:\antigravity',
    [int]$Port = 8787
)

$ErrorActionPreference = 'Stop'

$startScript = Join-Path $RepoRoot 'scripts\start-mission-control.ps1'
$watchdogScript = Join-Path $RepoRoot 'scripts\mission-control-watchdog.ps1'

if (-not (Test-Path -LiteralPath $startScript)) {
    throw "Mission Control start script missing: $startScript"
}
if (-not (Test-Path -LiteralPath $watchdogScript)) {
    throw "Mission Control watchdog script missing: $watchdogScript"
}

$principalUser = [Security.Principal.WindowsIdentity]::GetCurrent().Name
$isAdmin = ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole(
    [Security.Principal.WindowsBuiltInRole]::Administrator
)
$settings = New-ScheduledTaskSettingsSet `
    -RestartCount 999 `
    -RestartInterval (New-TimeSpan -Minutes 1) `
    -StartWhenAvailable `
    -AllowStartIfOnBatteries `
    -DontStopIfGoingOnBatteries `
    -ExecutionTimeLimit (New-TimeSpan -Days 0)

$triggers = if ($isAdmin) {
    @(
        (New-ScheduledTaskTrigger -AtStartup),
        (New-ScheduledTaskTrigger -AtLogOn)
    )
} else {
    @(
        (New-ScheduledTaskTrigger -AtLogOn)
    )
}

function Install-StartupFallback {
    $startupDir = [Environment]::GetFolderPath('Startup')
    $startupCmd = Join-Path $startupDir 'MissionControlGUI.cmd'
    $contents = @"
@echo off
start "" /min powershell.exe -NoProfile -NonInteractive -ExecutionPolicy Bypass -WindowStyle Hidden -File "$startScript" -RepoRoot "$RepoRoot" -Port $Port
start "" /min powershell.exe -NoProfile -NonInteractive -ExecutionPolicy Bypass -WindowStyle Hidden -File "$watchdogScript" -RepoRoot "$RepoRoot" -Port $Port
"@
    Set-Content -LiteralPath $startupCmd -Value $contents -Encoding ascii
    Write-Output "OK: installed Startup-folder fallback at $startupCmd"
}

if (-not $isAdmin) {
    Install-StartupFallback
    Start-Process -FilePath 'powershell.exe' `
        -ArgumentList @(
            '-NoProfile',
            '-NonInteractive',
            '-ExecutionPolicy',
            'Bypass',
            '-WindowStyle',
            'Hidden',
            '-File',
            $startScript,
            '-RepoRoot',
            $RepoRoot,
            '-Port',
            [string]$Port
        ) `
        -WindowStyle Hidden | Out-Null
    $watchdogRunning = $false
    Get-CimInstance Win32_Process -Filter "Name='powershell.exe'" -ErrorAction SilentlyContinue |
        Where-Object { $_.CommandLine -match 'mission-control-watchdog\.ps1' } |
        ForEach-Object { $watchdogRunning = $true }
    if (-not $watchdogRunning) {
        Start-Process -FilePath 'powershell.exe' `
            -ArgumentList @(
                '-NoProfile',
                '-NonInteractive',
                '-ExecutionPolicy',
                'Bypass',
                '-WindowStyle',
                'Hidden',
                '-File',
                $watchdogScript,
                '-RepoRoot',
                $RepoRoot,
                '-Port',
                [string]$Port
            ) `
            -WindowStyle Hidden | Out-Null
    }
    Write-Output 'NOTE: Startup-folder fallback starts Mission Control after user login. Run this command from Administrator PowerShell for true AtStartup boot-before-login registration.'
    return
}

function Register-MissionTask {
    param(
        [string]$TaskName,
        [string]$ScriptPath,
        [string]$Description
    )

    $action = New-ScheduledTaskAction `
        -Execute 'powershell.exe' `
        -Argument "-NoProfile -NonInteractive -ExecutionPolicy Bypass -WindowStyle Hidden -File `"$ScriptPath`" -RepoRoot `"$RepoRoot`" -Port $Port"

    $principalCandidates = if ($isAdmin) { @(
        (New-ScheduledTaskPrincipal -UserId $principalUser -LogonType S4U -RunLevel Highest),
        (New-ScheduledTaskPrincipal -UserId $principalUser -LogonType S4U -RunLevel Limited),
        (New-ScheduledTaskPrincipal -UserId $principalUser -LogonType Interactive -RunLevel Limited)
    ) } else { @(
        (New-ScheduledTaskPrincipal -UserId $principalUser -LogonType Interactive -RunLevel Limited)
    ) }

    $lastError = $null
    foreach ($principal in $principalCandidates) {
        try {
            Register-ScheduledTask `
                -TaskName $TaskName `
                -Action $action `
                -Trigger $triggers `
                -Settings $settings `
                -Principal $principal `
                -Description $Description `
                -Force | Out-Null
            Write-Output "OK: registered $TaskName as $($principal.UserId) with $($principal.LogonType)/$($principal.RunLevel)"
            return
        } catch {
            $lastError = $_
        }
    }

    throw "Failed to register $TaskName. Last error: $($lastError.Exception.Message)"
}

# Remove the retired Python API task so it cannot fight the GUI server for port 8787.
Unregister-ScheduledTask -TaskName 'MissionControlAPI' -Confirm:$false -ErrorAction SilentlyContinue

try {
    Register-MissionTask `
        -TaskName 'MissionControlGUI' `
        -ScriptPath $startScript `
        -Description 'Starts the ANTIGRAVITY Mission Control GUI and shared memory server on localhost:8787 at boot and login.'

    Register-MissionTask `
        -TaskName 'MissionControlWatchdog' `
        -ScriptPath $watchdogScript `
        -Description 'Keeps the ANTIGRAVITY Mission Control GUI and memory server healthy after reboot or process failure.'

    Start-ScheduledTask -TaskName 'MissionControlGUI'
    Start-ScheduledTask -TaskName 'MissionControlWatchdog'
    Start-Sleep -Seconds 5

    Get-ScheduledTask -TaskName 'MissionControlGUI','MissionControlWatchdog' |
        Select-Object TaskName, State, @{ Name = 'Triggers'; Expression = { ($_.Triggers | ForEach-Object { $_.Subscription + $_.StartBoundary + $_.Enabled }) -join '; ' } }

} catch {
    Write-Output "WARN: scheduled task registration failed: $($_.Exception.Message)"
    Install-StartupFallback
    Write-Output 'NOTE: Startup-folder fallback starts Mission Control after user login. Run this command from Administrator PowerShell for true AtStartup boot-before-login registration.'
}
