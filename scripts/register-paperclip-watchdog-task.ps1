# Register paperclip-watchdog.ps1 as an elevated Windows scheduled task.
# Run this script once from an elevated (Administrator) PowerShell prompt.
# The task starts at boot, restarts on failure, and runs the watchdog hidden.

$ErrorActionPreference = 'Stop'

if (-not ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole(
        [Security.Principal.WindowsBuiltInRole]'Administrator')) {
    Write-Host 'ERROR: Run this script as Administrator.' -ForegroundColor Red
    exit 1
}

$CurrentUser = "$env:USERDOMAIN\$env:USERNAME"

Write-Host ''
Write-Host '=== Paperclip Watchdog Scheduled Task Registration ===' -ForegroundColor Cyan
Write-Host "Running as: $CurrentUser"
Write-Host ''

$TaskName = 'ANTIGRAVITY-Paperclip-Watchdog'

# Remove any stale registration.
Unregister-ScheduledTask -TaskName $TaskName -Confirm:$false -ErrorAction SilentlyContinue
Write-Host "[CLEANUP] Removed old task: $TaskName" -ForegroundColor DarkGray

$Action = New-ScheduledTaskAction `
    -Execute 'powershell.exe' `
    -Argument '-NoProfile -NonInteractive -ExecutionPolicy Bypass -WindowStyle Hidden -File "C:\antigravity\scripts\paperclip-watchdog.ps1"'

$TriggerStartup = New-ScheduledTaskTrigger -AtStartup
$TriggerStartup.Delay = 'PT30S'
$TriggerLogon   = New-ScheduledTaskTrigger -AtLogOn -User $CurrentUser

$Settings = New-ScheduledTaskSettingsSet `
    -ExecutionTimeLimit ([TimeSpan]::Zero) `
    -RestartCount 99 `
    -RestartInterval (New-TimeSpan -Minutes 1) `
    -StartWhenAvailable `
    -RunOnlyIfNetworkAvailable:$false `
    -RunOnlyIfIdle:$false `
    -DisallowHardTerminate:$false `
    -MultipleInstances IgnoreNew

# S4U logon lets the task run whether or not the user is logged in, without
# storing a plaintext password. Requires admin to register.
$Principal = New-ScheduledTaskPrincipal `
    -UserId $CurrentUser `
    -LogonType S4U `
    -RunLevel Highest

Register-ScheduledTask `
    -TaskName    $TaskName `
    -Action      $Action `
    -Trigger     @($TriggerStartup, $TriggerLogon) `
    -Settings    $Settings `
    -Principal   $Principal `
    -Description 'ANTIGRAVITY Paperclip Watchdog: monitors FCC:8082, HermesWorkspace:3000, HermesDashboard:9119, PaperclipHQ:3110 and restarts them on failure. Survives reboots.' `
    -Force | Out-Null

Write-Host "[OK] $TaskName registered." -ForegroundColor Green

$task = Get-ScheduledTask -TaskName $TaskName
Write-Host ''
Write-Host '--- Task summary ---' -ForegroundColor Cyan
$task | Select-Object TaskName, State, Author | Format-List
Write-Host "RestartCount: $($task.Settings.RestartCount)"
Write-Host "RestartInterval: $($task.Settings.RestartInterval)"
Write-Host ''
Write-Host '--- Start the task now ---' -ForegroundColor Cyan
Write-Host "  Start-ScheduledTask -TaskName '$TaskName'"
Write-Host ''
Write-Host '--- Check status ---' -ForegroundColor Cyan
Write-Host "  Get-ScheduledTaskInfo -TaskName '$TaskName'"
Write-Host "  Get-Content c:\antigravity\logs\paperclip-watchdog.log -Tail 50"
Write-Host ''
