# Run this from an ELEVATED PowerShell to upgrade OPUS-CLI-AutoStart to admin
# Right-click pwsh → "Run as Administrator" → paste this path

Unregister-ScheduledTask -TaskName "OPUS-CLI-AutoStart" -Confirm:$false -ErrorAction SilentlyContinue

$action = New-ScheduledTaskAction `
    -Execute "pwsh.exe" `
    -Argument "-NoExit -ExecutionPolicy Bypass -File C:\OPUSONLY\scripts\opus-autostart.ps1" `
    -WorkingDirectory "C:\OPUSONLY"

$triggerBoot = New-ScheduledTaskTrigger -AtStartup
$triggerLogon = New-ScheduledTaskTrigger -AtLogOn -User "joshl"

$settings = New-ScheduledTaskSettingsSet `
    -AllowStartIfOnBatteries `
    -DontStopIfGoingOnBatteries `
    -StartWhenAvailable `
    -RestartCount 3 `
    -RestartInterval (New-TimeSpan -Minutes 1)

$principal = New-ScheduledTaskPrincipal `
    -UserId "joshl" `
    -RunLevel Highest `
    -LogonType Interactive

Register-ScheduledTask `
    -TaskName "OPUS-CLI-AutoStart" `
    -Action $action `
    -Trigger @($triggerBoot, $triggerLogon) `
    -Settings $settings `
    -Principal $principal `
    -Description "Auto-starts PowerShell 7.5 with Claude CLI (admin) on boot and power recovery" `
    -Force

Write-Host "OPUS-CLI-AutoStart upgraded to admin with boot + logon triggers" -ForegroundColor Green
