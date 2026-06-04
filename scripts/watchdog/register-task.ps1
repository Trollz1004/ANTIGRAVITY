<#
  Register the ANTIGRAVITY bootstrap as a Windows Scheduled Task that fires
  at user logon. Same script on every node — pass -Role to choose the variant.

  Examples (run in elevated PowerShell once per node):
      pwsh C:\Antigravity\scripts\watchdog\register-task.ps1 -Role node
      pwsh C:\Antigravity\scripts\watchdog\register-task.ps1 -Role display

  Roles:
    node    — T5500 / Sabretooth / 9020 → run bootstrap-claude-node.cmd
    display — mini-ASUS PC → run serve-dashboard.cmd (HTTP server for the
              browser tab pinned to the always-on display)

  Reversible: re-run with -Unregister to remove the task.
#>

[CmdletBinding()]
param(
    [ValidateSet('node', 'display')]
    [string]$Role = 'node',
    [switch]$Unregister
)

$ErrorActionPreference = 'Stop'

$repo = 'C:\Antigravity'
$watchdog = Join-Path $repo 'scripts\watchdog'

$taskName = if ($Role -eq 'display') { 'ANTIGRAVITY-Dashboard' } else { 'ANTIGRAVITY-Bootstrap' }
$script = if ($Role -eq 'display') {
    Join-Path $watchdog 'serve-dashboard.cmd'
} else {
    Join-Path $watchdog 'bootstrap-claude-node.cmd'
}

if ($Unregister) {
    if (Get-ScheduledTask -TaskName $taskName -ErrorAction SilentlyContinue) {
        Unregister-ScheduledTask -TaskName $taskName -Confirm:$false
        Write-Host "[ok] Unregistered $taskName" -ForegroundColor Green
    } else {
        Write-Host "[skip] $taskName not found" -ForegroundColor DarkGray
    }
    return
}

if (-not (Test-Path $script)) {
    throw "Script not found: $script. Run 'git pull' first."
}

# Use the current interactive user (the one running this script as elevated)
$user = "$env:USERDOMAIN\$env:USERNAME"

$action = New-ScheduledTaskAction -Execute 'cmd.exe' -Argument "/c `"$script`""
$trigger = New-ScheduledTaskTrigger -AtLogOn -User $user
$settings = New-ScheduledTaskSettingsSet `
    -AllowStartIfOnBatteries `
    -DontStopIfGoingOnBatteries `
    -StartWhenAvailable `
    -ExecutionTimeLimit ([TimeSpan]::Zero) `
    -RestartInterval (New-TimeSpan -Minutes 5) `
    -RestartCount 3

# Run interactively as the logged-on user (not SYSTEM — needs OneDrive access)
$principal = New-ScheduledTaskPrincipal -UserId $user -LogonType Interactive -RunLevel Limited

if (Get-ScheduledTask -TaskName $taskName -ErrorAction SilentlyContinue) {
    Set-ScheduledTask -TaskName $taskName -Action $action -Trigger $trigger -Settings $settings -Principal $principal
    Write-Host "[ok] Updated existing task: $taskName" -ForegroundColor Green
} else {
    Register-ScheduledTask -TaskName $taskName -Action $action -Trigger $trigger -Settings $settings -Principal $principal -Description "ANTIGRAVITY $Role auto-start ($($script))"
    Write-Host "[ok] Registered new task: $taskName" -ForegroundColor Green
}

Write-Host "[next] Either reboot, or run: Start-ScheduledTask -TaskName '$taskName'" -ForegroundColor Cyan
