[CmdletBinding()]
param(
    [string]$RepoRoot = "E:\ANTIGRAVITY",
    [string]$UserName = $env:USERNAME
)

$ErrorActionPreference = "Stop"
$taskName = "CodeX-Mission-Guardian"
$ensureScript = Join-Path $RepoRoot "scripts\Ensure-CodeX-Mission.ps1"

if (-not (Test-Path -LiteralPath $ensureScript)) {
    throw "Missing guardian script: $ensureScript"
}

Unregister-ScheduledTask -TaskName $taskName -Confirm:$false -ErrorAction SilentlyContinue

$action = New-ScheduledTaskAction `
    -Execute "pwsh.exe" `
    -Argument "-NoLogo -NoProfile -NonInteractive -WindowStyle Hidden -ExecutionPolicy Bypass -File `"$ensureScript`"" `
    -WorkingDirectory $RepoRoot

$triggerBoot = New-ScheduledTaskTrigger -AtStartup
$triggerLogon = New-ScheduledTaskTrigger -AtLogOn -User $UserName
$triggerWatchdog = New-ScheduledTaskTrigger `
    -Once `
    -At (Get-Date).AddMinutes(1) `
    -RepetitionInterval (New-TimeSpan -Minutes 1) `
    -RepetitionDuration (New-TimeSpan -Days 3650)

$settings = New-ScheduledTaskSettingsSet `
    -AllowStartIfOnBatteries `
    -DontStopIfGoingOnBatteries `
    -StartWhenAvailable `
    -MultipleInstances IgnoreNew

$principal = New-ScheduledTaskPrincipal `
    -UserId $UserName `
    -RunLevel Highest `
    -LogonType Interactive

Register-ScheduledTask `
    -TaskName $taskName `
    -Action $action `
    -Trigger @($triggerBoot, $triggerLogon, $triggerWatchdog) `
    -Settings $settings `
    -Principal $principal `
    -Description "Keeps CodeX Mission terminal running as admin on startup/logon and relaunches if closed." `
    -Force | Out-Null

Write-Host "$taskName installed for user '$UserName'." -ForegroundColor Green
