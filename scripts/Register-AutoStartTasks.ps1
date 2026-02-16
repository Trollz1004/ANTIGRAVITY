# ═══════════════════════════════════════════════════════════════════════════════
# ENIGMA — Register Auto-Start Tasks (Windows Task Scheduler)
# Registers tasks that start services after reboot/power loss
# Location: E:\OPUSONLY\scripts\Register-AutoStartTasks.ps1
# Author: ENIGMA
# ═══════════════════════════════════════════════════════════════════════════════

#Requires -RunAsAdministrator

param(
    [switch]$Unregister
)

$scriptsDir = "E:\OPUSONLY\scripts"
$logsDir = "E:\OPUSONLY\logs"

Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host " ENIGMA — Auto-Start Task Registration" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan

# Task definitions
$tasks = @(
    @{
        Name        = "ENIGMA-StartDateApp"
        Description = "Starts YouAndINotAI Dating Platform services after reboot"
        Script      = "$scriptsDir\deploy\T5500-Windows\Start-DateAppServices.ps1"
        Trigger     = "AtStartup"
        Delay       = "PT2M"  # 2 minute delay to let Docker start
    },
    @{
        Name        = "ENIGMA-StartMarketing"
        Description = "Starts Marketing Engine after reboot"
        Script      = "$scriptsDir\deploy\T5500-Windows\Start-DateAppServices.ps1"
        Trigger     = "AtStartup"
        Delay       = "PT3M"  # 3 minute delay
    },
    @{
        Name        = "ENIGMA-StartOllama"
        Description = "Starts Ollama AI server after reboot"
        Script      = "$scriptsDir\Start-Ollama.ps1"
        Arguments   = "-Background"
        Trigger     = "AtStartup"
        Delay       = "PT1M"  # 1 minute delay
    }
)

if ($Unregister) {
    Write-Host "`n🗑️  Unregistering tasks..." -ForegroundColor Yellow
    foreach ($task in $tasks) {
        Unregister-ScheduledTask -TaskName $task.Name -Confirm:$false -ErrorAction SilentlyContinue
        Write-Host "   Removed: $($task.Name)" -ForegroundColor Gray
    }
    Write-Host "`n✅ All auto-start tasks removed." -ForegroundColor Green
    exit 0
}

Write-Host "`n📝 Registering auto-start tasks..." -ForegroundColor Cyan

foreach ($task in $tasks) {
    Write-Host "`n   Task: $($task.Name)" -ForegroundColor White
    
    # Check if script exists
    if (-not (Test-Path $task.Script)) {
        Write-Host "      ⚠️  Script not found: $($task.Script)" -ForegroundColor Yellow
        continue
    }
    
    # Remove existing task
    Unregister-ScheduledTask -TaskName $task.Name -Confirm:$false -ErrorAction SilentlyContinue
    
    # Create trigger
    $trigger = New-ScheduledTaskTrigger -AtStartup
    
    # Add delay if specified
    if ($task.Delay) {
        $trigger.Delay = $task.Delay
    }
    
    # Create action
    $arguments = "-NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -File `"$($task.Script)`""
    if ($task.Arguments) {
        $arguments += " $($task.Arguments)"
    }
    $action = New-ScheduledTaskAction -Execute "powershell.exe" -Argument $arguments
    
    # Create principal (run as SYSTEM with highest privileges)
    $principal = New-ScheduledTaskPrincipal -UserId "SYSTEM" -LogonType ServiceAccount -RunLevel Highest
    
    # Create settings
    $settings = New-ScheduledTaskSettingsSet `
        -AllowStartIfOnBatteries `
        -DontStopIfGoingOnBatteries `
        -StartWhenAvailable `
        -RestartCount 3 `
        -RestartInterval (New-TimeSpan -Minutes 1)
    
    # Register task
    Register-ScheduledTask `
        -TaskName $task.Name `
        -Description $task.Description `
        -Trigger $trigger `
        -Action $action `
        -Principal $principal `
        -Settings $settings `
        -Force | Out-Null
    
    Write-Host "      ✅ Registered" -ForegroundColor Green
    Write-Host "      Script: $($task.Script)" -ForegroundColor Gray
    Write-Host "      Delay: $($task.Delay)" -ForegroundColor Gray
}

# Show summary
Write-Host "`n═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host " ✅ AUTO-START TASKS REGISTERED" -ForegroundColor Green
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""
Get-ScheduledTask -TaskName "ENIGMA-*" | Format-Table TaskName, State -AutoSize
Write-Host ""
Write-Host " To view/edit tasks: Open Task Scheduler > Task Scheduler Library" -ForegroundColor Gray
Write-Host " To remove all: .\Register-AutoStartTasks.ps1 -Unregister" -ForegroundColor Gray
