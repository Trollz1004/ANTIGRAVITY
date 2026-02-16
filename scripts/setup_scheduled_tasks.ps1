# OPUS Automation - Windows Task Scheduler Setup
# Sets up recurring tasks for Protocol Omega autonomous operation
# Run as Administrator: powershell -ExecutionPolicy Bypass -File setup_scheduled_tasks.ps1

param(
    [switch]$Remove,
    [switch]$Status,
    [switch]$DryRun
)

$ErrorActionPreference = "Continue"

# Auto-detect Python
$PythonExe = "python"
try {
    $PythonExe = (Get-Command python).Source
} catch {
    # Fallback paths for 9020/Sabretooth
    if (Test-Path "C:\Program Files\Microsoft SDKs\Azure\CLI2\python.exe") {
        $PythonExe = "C:\Program Files\Microsoft SDKs\Azure\CLI2\python.exe"
    } elseif (Test-Path "C:\Program Files (x86)\Google\Cloud SDK\google-cloud-sdk\platform\bundledpython\python.exe") {
        $PythonExe = "C:\Program Files (x86)\Google\Cloud SDK\google-cloud-sdk\platform\bundledpython\python.exe"
    }
}

$NodePath = "node"
$ScriptsDir = "$PSScriptRoot"
$KrakenDir = "C:\REVENUE-CORE\Kraken_Assist_Local_Disk_9020\marketing-engine"
$LogDir = "$PSScriptRoot\..\logs"

# Create log directory
if (-not (Test-Path $LogDir)) { New-Item -ItemType Directory -Path $LogDir -Force }

# Task definitions
$Tasks = @(
    @{
        Name = "OPUS-Orchestrator-Hourly"
        Description = "Master orchestrator - hourly cycle (content generation + posting queue)"
        Command = "$PythonExe `"$ScriptsDir\master_orchestrator.py`" --run-once"
        Trigger = "Hourly"
        IntervalMinutes = 60
    },
    @{
        Name = "OPUS-Kraken-Sentry"
        Description = "Kraken content engine - generate and validate marketing content"
        Command = "$NodePath `"$KrakenDir\engine.js`""
        Trigger = "Hourly"
        IntervalMinutes = 120  # Every 2 hours
    },
    @{
        Name = "OPUS-Status-Report"
        Description = "Generate status report every 6 hours"
        Command = "$PythonExe `"$ScriptsDir\master_orchestrator.py`" --status"
        Trigger = "Hourly"
        IntervalMinutes = 360  # Every 6 hours
    },
    @{
        Name = "OPUS-Countdown-Update"
        Description = "Generate fresh countdown image daily"
        Command = "$PythonExe `"$ScriptsDir\countdown_generator.py`" --spots 97"
        Trigger = "Daily"
        TimeOfDay = "08:00"
    }
)

function Show-Status {
    Write-Host "`n===== OPUS Scheduled Tasks Status =====" -ForegroundColor Cyan
    foreach ($task in $Tasks) {
        $existing = Get-ScheduledTask -TaskName $task.Name -ErrorAction SilentlyContinue
        if ($existing) {
            $info = Get-ScheduledTaskInfo -TaskName $task.Name -ErrorAction SilentlyContinue
            $state = $existing.State
            $lastRun = if ($info.LastRunTime) { $info.LastRunTime.ToString("yyyy-MM-dd HH:mm") } else { "Never" }
            $lastResult = $info.LastTaskResult
            $color = if ($state -eq "Ready") { "Green" } else { "Yellow" }
            Write-Host "  [$state] $($task.Name) | Last: $lastRun | Result: $lastResult" -ForegroundColor $color
        } else {
            Write-Host "  [NOT SET] $($task.Name)" -ForegroundColor Red
        }
    }
    Write-Host ""
}

function Remove-Tasks {
    Write-Host "`nRemoving OPUS scheduled tasks..." -ForegroundColor Yellow
    foreach ($task in $Tasks) {
        $existing = Get-ScheduledTask -TaskName $task.Name -ErrorAction SilentlyContinue
        if ($existing) {
            Unregister-ScheduledTask -TaskName $task.Name -Confirm:$false
            Write-Host "  Removed: $($task.Name)" -ForegroundColor Red
        }
    }
}

function Register-Tasks {
    Write-Host "`nRegistering OPUS scheduled tasks..." -ForegroundColor Cyan

    foreach ($task in $Tasks) {
        $existing = Get-ScheduledTask -TaskName $task.Name -ErrorAction SilentlyContinue
        if ($existing) {
            Write-Host "  [SKIP] $($task.Name) already exists" -ForegroundColor Yellow
            continue
        }

        if ($DryRun) {
            Write-Host "  [DRY] Would register: $($task.Name) ($($task.Description))" -ForegroundColor Gray
            continue
        }

        try {
            $user = [System.Security.Principal.WindowsIdentity]::GetCurrent().Name
            $action = New-ScheduledTaskAction -Execute "cmd.exe" -Argument "/c `"$($task.Command)`" >> `"$LogDir\$($task.Name).log`" 2>&1"
            
            $trigger = $null
            if ($task.Trigger -eq "Hourly") {
                $trigger = New-ScheduledTaskTrigger -Once -At (Get-Date).AddMinutes(5) `
                    -RepetitionInterval (New-TimeSpan -Minutes $task.IntervalMinutes) `
                    -RepetitionDuration (New-TimeSpan -Days 9999)
            } elseif ($task.Trigger -eq "Daily") {
                $trigger = New-ScheduledTaskTrigger -Daily -At $task.TimeOfDay
            }

            $settings = New-ScheduledTaskSettingsSet `
                -AllowStartIfOnBatteries `
                -DontStopIfGoingOnBatteries `
                -StartWhenAvailable `
                -RestartCount 3 `
                -RestartInterval (New-TimeSpan -Minutes 5)

            Register-ScheduledTask `
                -TaskName $task.Name `
                -Description $task.Description `
                -Action $action `
                -Trigger $trigger `
                -Settings $settings `
                -User $user `
                -RunLevel Highest

            Write-Host "  [OK] $($task.Name) registered" -ForegroundColor Green
        } catch {
            Write-Host "  [FAIL] $($task.Name): $_" -ForegroundColor Red
        }
    }
}

# Main
Write-Host @"

===============================================
  OPUS Protocol Omega - Task Scheduler Setup
  Node: 9020 | $(Get-Date -Format "yyyy-MM-dd HH:mm")
===============================================
"@ -ForegroundColor Cyan

if ($Status) {
    Show-Status
} elseif ($Remove) {
    Remove-Tasks
} else {
    Register-Tasks
    Write-Host ""
    Show-Status
}
