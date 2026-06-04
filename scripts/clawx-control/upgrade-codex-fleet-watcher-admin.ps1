[CmdletBinding()]
param(
    [string]$RepoRoot,
    [string]$CodeXRoot,
    [string]$UserName = $env:USERNAME,
    [string]$TaskName = "CodeX-Fleet-Watcher",
    [string]$DailyAt = "03:00",
    [switch]$StartNow
)

$ErrorActionPreference = "Stop"

if (-not $RepoRoot) {
    $RepoRoot = Split-Path -Parent $PSScriptRoot
}
if (-not $CodeXRoot) {
    $CodeXRoot = Join-Path $RepoRoot "CodeX"
}

$wrapperScript = Join-Path $RepoRoot "scripts\Invoke-CodeX-FleetWatcher.ps1"
if (-not (Test-Path -LiteralPath $wrapperScript)) {
    throw "Missing watcher wrapper: $wrapperScript"
}

if (-not (Test-Path -LiteralPath $CodeXRoot)) {
    New-Item -ItemType Directory -Path $CodeXRoot -Force | Out-Null
}

Unregister-ScheduledTask -TaskName $TaskName -Confirm:$false -ErrorAction SilentlyContinue

$arguments = "-NoLogo -NoProfile -NonInteractive -WindowStyle Hidden -ExecutionPolicy Bypass -File `"$wrapperScript`" -RepoRoot `"$RepoRoot`""

$action = New-ScheduledTaskAction `
    -Execute "pwsh.exe" `
    -Argument $arguments `
    -WorkingDirectory $CodeXRoot

$trigger = New-ScheduledTaskTrigger -Daily -At ([DateTime]::Parse($DailyAt))

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
    -TaskName $TaskName `
    -Action $action `
    -Trigger $trigger `
    -Settings $settings `
    -Principal $principal `
    -Description "Runs the daily CodeX fleet watcher: git health, scheduled tasks, SSH reachability, public surfaces, Cloudflare status, guardian checks, and unresolved SMS escalation." `
    -Force | Out-Null

if ($StartNow) {
    Start-ScheduledTask -TaskName $TaskName -ErrorAction SilentlyContinue
}

Write-Host "$TaskName installed for user '$UserName' (daily at $DailyAt)." -ForegroundColor Green
