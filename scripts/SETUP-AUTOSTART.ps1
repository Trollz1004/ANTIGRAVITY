# ANTIGRAVITY Auto-Start Setup for Windows Task Scheduler
# This script registers a scheduled task that starts the Docker stack on boot (no login required)
#
# Run as Administrator:
#   Set-ExecutionPolicy -ExecutionPolicy Bypass -Scope Process
#   .\scripts\SETUP-AUTOSTART.ps1

#Requires -RunAsAdministrator

$ErrorActionPreference = "Stop"

$ProjectRoot = "C:\ANTIGRAVITY"
$ScriptPath = Join-Path $ProjectRoot "scripts\AUTOSTART-DOCKER-BOOT.bat"
$TaskName = "ANTIGRAVITY-Docker-Stack"
$TaskPath = "\ANTIGRAVITY\"
$LogDir = Join-Path $ProjectRoot "logs"

Write-Host "================================================" -ForegroundColor Cyan
Write-Host "  ANTIGRAVITY Auto-Start Task Setup" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""

# Create logs directory
if (-not (Test-Path $LogDir)) {
    Write-Host "Creating logs directory..." -ForegroundColor Yellow
    New-Item -ItemType Directory -Path $LogDir -Force | Out-Null
}

# Verify script exists
if (-not (Test-Path $ScriptPath)) {
    Write-Host "ERROR: Startup script not found at $ScriptPath" -ForegroundColor Red
    exit 1
}

# Check if task already exists
$existingTask = Get-ScheduledTask -TaskName $TaskName -ErrorAction SilentlyContinue
if ($existingTask) {
    Write-Host "Task '$TaskName' already exists." -ForegroundColor Yellow
    $response = Read-Host "Overwrite? (yes/no)"
    if ($response -ne "yes") {
        Write-Host "Cancelled." -ForegroundColor Yellow
        exit 0
    }
    Unregister-ScheduledTask -TaskName $TaskName -Confirm:$false
    Write-Host "Removed existing task." -ForegroundColor Yellow
}

# Create new scheduled task
Write-Host "Creating scheduled task '$TaskName'..." -ForegroundColor Yellow

$trigger = New-ScheduledTaskTrigger -AtStartup
$principal = New-ScheduledTaskPrincipal `
    -UserId "SYSTEM" `
    -LogonType "ServiceAccount" `
    -RunLevel "Highest"

$settings = New-ScheduledTaskSettingsSet `
    -AllowStartIfOnBatteries `
    -DontStopIfGoingOnBatteries `
    -StartWhenAvailable `
    -MultipleInstances "IgnoreNew"

$action = New-ScheduledTaskAction `
    -Execute "cmd.exe" `
    -Argument "/c `"$ScriptPath`""

$task = Register-ScheduledTask `
    -TaskName $TaskName `
    -TaskPath $TaskPath `
    -Trigger $trigger `
    -Principal $principal `
    -Settings $settings `
    -Action $action `
    -Force

Write-Host "Task registered successfully!" -ForegroundColor Green
Write-Host ""
Write-Host "Details:" -ForegroundColor Cyan
Write-Host "  Task Name:    $TaskName"
Write-Host "  Path:         $TaskPath"
Write-Host "  Script:       $ScriptPath"
Write-Host "  Trigger:      At System Startup"
Write-Host "  Principal:    SYSTEM (no login required)"
Write-Host "  Run Level:    Highest"
Write-Host "  Log File:     $LogDir\autostart-YYYYMMDD-HHMMSS.log"
Write-Host ""

# Verify registration
$verifyTask = Get-ScheduledTask -TaskName $TaskName -TaskPath $TaskPath -ErrorAction SilentlyContinue
if ($verifyTask) {
    Write-Host "Verification: Task is registered and ready." -ForegroundColor Green
    Write-Host ""
    Write-Host "Next steps:" -ForegroundColor Cyan
    Write-Host "  1. Edit .env.docker with your LLM provider keys"
    Write-Host "  2. Restart your computer to test auto-start"
    Write-Host "  3. Check logs in: $LogDir"
    Write-Host ""
    Write-Host "To disable auto-start later:" -ForegroundColor Yellow
    Write-Host "  Unregister-ScheduledTask -TaskName '$TaskName' -TaskPath '$TaskPath' -Confirm:`$false"
} else {
    Write-Host "ERROR: Task registration verification failed." -ForegroundColor Red
    exit 1
}
