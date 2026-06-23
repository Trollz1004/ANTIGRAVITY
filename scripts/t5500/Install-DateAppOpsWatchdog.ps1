param(
    [string]$RepoRoot = "C:\antigravity",
    [string]$TaskName = "ANTIGRAVITY-T5500-DateApp-OpsWatchdog",
    [int]$IntervalMinutes = 30
)

$ErrorActionPreference = "Stop"

$watchdog = Join-Path $RepoRoot "scripts\t5500\Invoke-DateAppOpsWatchdog.ps1"
if (-not (Test-Path -LiteralPath $watchdog)) {
    throw "Watchdog script not found: $watchdog"
}

$actionArgs = "-NoProfile -ExecutionPolicy Bypass -File `"$watchdog`" -DeployPagesOnPublicDown"
$action = New-ScheduledTaskAction -Execute "powershell.exe" -Argument $actionArgs -WorkingDirectory $RepoRoot

$startupTrigger = New-ScheduledTaskTrigger -AtStartup
$repeatTrigger = New-ScheduledTaskTrigger -Once -At (Get-Date).AddMinutes(5)
$repeatTrigger.Repetition.Interval = "PT${IntervalMinutes}M"
$repeatTrigger.Repetition.Duration = "P3650D"

$principal = New-ScheduledTaskPrincipal -UserId "SYSTEM" -RunLevel Highest
$settings = New-ScheduledTaskSettingsSet `
    -AllowStartIfOnBatteries `
    -DontStopIfGoingOnBatteries `
    -StartWhenAvailable `
    -MultipleInstances IgnoreNew `
    -RestartCount 3 `
    -RestartInterval (New-TimeSpan -Minutes 5) `
    -ExecutionTimeLimit (New-TimeSpan -Minutes 20)

Register-ScheduledTask `
    -TaskName $TaskName `
    -Action $action `
    -Trigger @($startupTrigger, $repeatTrigger) `
    -Principal $principal `
    -Settings $settings `
    -Description "ANTIGRAVITY T5500 watchdog for date app Pages, local ports, Paperclip, and Cloudflare tunnel." `
    -Force | Out-Null

Write-Host "Registered $TaskName every $IntervalMinutes minutes and at startup."
