# Setup script for Agent Health Monitor Scheduled Task

# Define variables
$TaskName = "AgentHealthMonitor"
$ScriptPath = "C:\ANTIGRAVITY\agent_health_monitor.py"
$PythonPath = "python"  # Assuming Python is in PATH, adjust if needed
$Schedule = "0 */1 * * *"  # Every hour at minute 0

# Check if running as administrator
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
if (-not $isAdmin) {
    Write-Host "This script needs to be run as Administrator to create scheduled tasks."
    Write-Host "Please run PowerShell as Administrator and try again."
    exit 1
}

# Check if Python is available
try {
    $pythonVersion = & $PythonPath --version 2>$null
    if ($LASTEXITCODE -ne 0) {
        throw "Python not found"
    }
    Write-Host "Found Python: $pythonVersion"
} catch {
    Write-Host "ERROR: Python not found. Please install Python or adjust the `$PythonPath variable."
    exit 1
}

# Check if the script file exists
if (-not (Test-Path $ScriptPath)) {
    Write-Host "ERROR: Script file not found at $ScriptPath"
    Write-Host "Please make sure the agent_health_monitor.py script exists."
    exit 1
}

# Create the scheduled task
try {
    # Create action to run the Python script
    $action = New-ScheduledTaskAction -Execute $PythonPath -Argument $ScriptPath -WorkingDirectory "C:\ANTIGRAVITY"

    # Create trigger for hourly execution
    $trigger = New-ScheduledTaskTrigger -Once -At (Get-Date) -RepetitionInterval (New-TimeSpan -Hours 1) -RepetitionDuration (New-TimeSpan -Days 365)

    # Create settings
    $settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -StartWhenAvailable

    # Register the task
    Register-ScheduledTask -TaskName $TaskName -Action $action -Trigger $trigger -Settings $settings -Description "Monitors Paperclip agent health status hourly" -RunLevel Highest -Force

    Write-Host "SUCCESS: Scheduled task '$TaskName' created successfully!"
    Write-Host "The task will run every hour and monitor agent health."
} catch {
    Write-Host "ERROR: Failed to create scheduled task: $_"
    exit 1
}

# Display task information
try {
    $task = Get-ScheduledTask -TaskName $TaskName
    Write-Host "`nTask Information:"
    Write-Host "Name: $($task.TaskName)"
    Write-Host "State: $($task.State)"
    Write-Host "Last Run: $(($task | Get-ScheduledTaskInfo).LastRunTime)"
    Write-Host "Next Run: $(($task | Get-ScheduledTaskInfo).NextRunTime)"
} catch {
    Write-Host "INFO: Could not retrieve task information."
}