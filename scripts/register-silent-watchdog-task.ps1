# Register silent watchdog as Windows scheduled task
# Runs hidden on startup + logon, zero user interaction
# No terminal windows, no cursor pop-ups, pure background

#Requires -RunAsAdministrator
#Requires -Version 5.1

param(
    [string]$RepoRoot = "F:\ANTIGRAVITY",
    [switch]$DryRun
)

$ErrorActionPreference = 'SilentlyContinue'

function Log { Write-Host "[watchdog-register]" $args }

$taskName = "ANTIGRAVITY-Silent-Watchdog-T5500"
$watchdogScript = "$RepoRoot\scripts\silent-watchdog-t5500.ps1"

if (-not (Test-Path $watchdogScript)) {
    Log "ERROR: Watchdog script not found at $watchdogScript"
    exit 1
}

Log "Removing existing task if present..."
Unregister-ScheduledTask -TaskName $taskName -Confirm:$false -ErrorAction SilentlyContinue | Out-Null

Log "Registering new silent watchdog task..."

# Task settings: NO visible windows, restart if crashes, run hidden
$principal = New-ScheduledTaskPrincipal -UserId "SYSTEM" -RunLevel Highest -LogonType S4U
$settings = New-ScheduledTaskSettingsSet `
    -AllowStartIfOnBatteries `
    -DontStopIfGoingOnBatteries `
    -StartWhenAvailable `
    -ExecutionTimeLimit ([TimeSpan]::Zero) `
    -RestartCount 2 `
    -RestartInterval (New-TimeSpan -Minutes 5)

# Action: PowerShell hidden, no window, no cursor
$action = New-ScheduledTaskAction `
    -Execute "powershell.exe" `
    -Argument "-NoProfile -NonInteractive -WindowStyle Hidden -ExecutionPolicy Bypass -File `"$watchdogScript`""

# Triggers: startup + logon
$triggerStartup = New-ScheduledTaskTrigger -AtStartup
$triggerLogon = New-ScheduledTaskTrigger -AtLogOn

if ($DryRun) {
    Log "DRY RUN: Would register task with:"
    Log "  Name: $taskName"
    Log "  Script: $watchdogScript"
    Log "  User: SYSTEM (highest privileges)"
    Log "  Triggers: At Startup, At Logon"
    Log "  Window: Hidden (no popups)"
} else {
    try {
        Register-ScheduledTask `
            -TaskName $taskName `
            -Principal $principal `
            -Action $action `
            -Trigger @($triggerStartup, $triggerLogon) `
            -Settings $settings `
            -Force | Out-Null
        
        Log "✓ Task registered successfully"
        Log "✓ Watchdog will start silently on next boot/logon"
        Log "✓ Logs: $RepoRoot\logs\watchdog-silent-YYYYMMDD.log"
        Log ""
        Log "Verification:"
        Log "  Get-ScheduledTask -TaskName '$taskName'"
        Log "  Get-ScheduledTaskInfo -TaskName '$taskName'"
        
    } catch {
        Log "ERROR: Failed to register task"
        Log $_
        exit 1
    }
}
