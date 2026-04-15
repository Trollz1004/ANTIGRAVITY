# Run this ONCE as Administrator to register the autostart task
# Usage: Right-click -> Run with PowerShell (as Admin)

# Fail fast if not admin
if (-not ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]"Administrator")) {
    Write-Host "ERROR: Must run as Administrator. Right-click PowerShell -> Run as administrator." -ForegroundColor Red
    exit 1
}

$TaskName = "ANTIGRAVITY-AutoStart"
$ScriptPath = "C:\ANTIGRAVITY\scripts\autostart.ps1"
$User = $env:USERNAME

# Remove old task if it exists
Unregister-ScheduledTask -TaskName $TaskName -Confirm:$false -ErrorAction SilentlyContinue

$Action = New-ScheduledTaskAction `
    -Execute "powershell.exe" `
    -Argument "-NonInteractive -WindowStyle Minimized -ExecutionPolicy Bypass -File `"$ScriptPath`""

# Trigger: at logon of this user, with 30s delay for Docker Desktop to load
$Trigger = New-ScheduledTaskTrigger -AtLogOn -User $User
$Trigger.Delay = "PT30S"

$Settings = New-ScheduledTaskSettingsSet `
    -ExecutionTimeLimit (New-TimeSpan -Hours 1) `
    -RestartCount 2 `
    -RestartInterval (New-TimeSpan -Minutes 1) `
    -StartWhenAvailable `
    -RunOnlyIfNetworkAvailable:$false

$Principal = New-ScheduledTaskPrincipal `
    -UserId $User `
    -LogonType Interactive `
    -RunLevel Highest

Register-ScheduledTask `
    -TaskName $TaskName `
    -Action $Action `
    -Trigger $Trigger `
    -Settings $Settings `
    -Principal $Principal `
    -Description "ANTIGRAVITY stack auto-start: Docker services, LiteLLM proxy, Paperclip" `
    -Force

Write-Host ""
Write-Host "Task '$TaskName' registered successfully." -ForegroundColor Green
Write-Host "It will run 30 seconds after you log in, with highest privileges."
Write-Host ""
Write-Host "To test it now without rebooting:"
Write-Host "  Start-ScheduledTask -TaskName '$TaskName'"
Write-Host ""
Write-Host "To check status:"
Write-Host "  Get-ScheduledTaskInfo -TaskName '$TaskName'"
Write-Host ""
Write-Host "Logs will appear at: C:\ANTIGRAVITY\logs\"
