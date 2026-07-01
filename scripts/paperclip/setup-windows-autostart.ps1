#Requires -RunAsAdministrator
# Register Paperclip watchdog as a Windows Scheduled Task so it survives reboot/power loss.
# Run from an elevated PowerShell:  scripts\paperclip\setup-windows-autostart.ps1
$ErrorActionPreference = 'Stop'

$RepoRoot = 'C:\antigravity'
$WatchdogScript = Join-Path $RepoRoot 'scripts\paperclip\paperclip-watchdog.ps1'
$TaskName = 'PaperclipHQ-Watchdog'
$LogDir = Join-Path $RepoRoot 'logs'
New-Item -ItemType Directory -Force -Path $LogDir | Out-Null

function Log($msg) {
    $line = "[{0}] {1}" -f (Get-Date -Format 'yyyy-MM-dd HH:mm:ss'), $msg
    Write-Output $line
    Add-Content -Path (Join-Path $LogDir 'paperclip-setup.log') -Value $line
}

if (-not (Test-Path $WatchdogScript -PathType Leaf)) {
    throw "Watchdog script not found: $WatchdogScript"
}

$action = New-ScheduledTaskAction -Execute 'powershell.exe' -Argument "-NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -File `"$WatchdogScript`"" -WorkingDirectory $RepoRoot

# Note: registering this task requires Administrator privileges one time.
# The running watchdog itself has no UI, receives no input, and never moves the cursor.

# Trigger 1: at system startup (runs when machine boots, before user logon).
$triggerStartup = New-ScheduledTaskTrigger -AtStartup

# Trigger 2: at any user logon (helps if startup trigger is delayed or missed).
$triggerLogon = New-ScheduledTaskTrigger -AtLogon

# Run as the current user with highest privileges; stop existing instance if still running.
$principal = New-ScheduledTaskPrincipal -UserId "$env:USERDOMAIN\$env:USERNAME" -LogonType Interactive -RunLevel Highest
$settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -StartWhenAvailable -ExecutionTimeLimit (New-TimeSpan -Hours 0) -MultipleInstances IgnoreNew

Log "Registering scheduled task '$TaskName'..."
Register-ScheduledTask -TaskName $TaskName -Action $action -Trigger @($triggerStartup, $triggerLogon) -Principal $principal -Settings $settings -Force | Out-Null

# Start it now so the user does not have to reboot.
Log "Starting $TaskName..."
Start-ScheduledTask -TaskName $TaskName

Log "Scheduled task '$TaskName' registered and started."
Log "Watchdog log: $LogDir\paperclip-watchdog.log"
Write-Output "Done. The watchdog will relaunch Paperclip automatically on restart or power loss."
