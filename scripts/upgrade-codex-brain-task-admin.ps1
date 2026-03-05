[CmdletBinding()]
param(
    [string]$RepoRoot = "E:\ANTIGRAVITY",
    [string]$CodeXRoot = "E:\ANTIGRAVITY\CodeX",
    [string]$UserName = $env:USERNAME,
    [string]$ModelName = "qwen2.5:3b",
    [int]$IntervalMinutes = 20,
    [switch]$SkipModelPull
)

$ErrorActionPreference = "Stop"
$taskName = "CodeX-Brain-Checkpoint"
$checkpointScript = Join-Path $RepoRoot "scripts\Invoke-CodeX-BrainCheckpoint.ps1"

if (-not (Test-Path -LiteralPath $checkpointScript)) {
    throw "Missing checkpoint script: $checkpointScript"
}
if (-not (Test-Path -LiteralPath $CodeXRoot)) {
    throw "Missing CodeX root: $CodeXRoot"
}

if (-not (Get-Command ollama -ErrorAction SilentlyContinue)) {
    Write-Warning "Ollama not found. Task will run with fallback summaries."
} elseif (-not $SkipModelPull) {
    try {
        $modelsRaw = (& ollama list 2>$null | Out-String)
        $hasModel = $modelsRaw -match "(?m)^\s*$([regex]::Escape($ModelName))\s+"
        if (-not $hasModel) {
            Write-Host "Pulling Ollama model: $ModelName" -ForegroundColor Cyan
            & ollama pull $ModelName
        }
    } catch {
        Write-Warning "Model pull failed: $($_.Exception.Message). Continuing with fallback mode."
    }
}

Unregister-ScheduledTask -TaskName $taskName -Confirm:$false -ErrorAction SilentlyContinue

$action = New-ScheduledTaskAction `
    -Execute "pwsh.exe" `
    -Argument "-NoLogo -NoProfile -NonInteractive -WindowStyle Hidden -ExecutionPolicy Bypass -File `"$checkpointScript`" -ModelName `"$ModelName`"" `
    -WorkingDirectory $CodeXRoot

$triggerBoot = New-ScheduledTaskTrigger -AtStartup
$triggerLogon = New-ScheduledTaskTrigger -AtLogOn -User $UserName
$triggerLoop = New-ScheduledTaskTrigger `
    -Once `
    -At (Get-Date).AddMinutes(2) `
    -RepetitionInterval (New-TimeSpan -Minutes $IntervalMinutes) `
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
    -Trigger @($triggerBoot, $triggerLogon, $triggerLoop) `
    -Settings $settings `
    -Principal $principal `
    -Description "Creates CodeX orchestrator checkpoints and handoff files for token-safe recovery." `
    -Force | Out-Null

Start-ScheduledTask -TaskName $taskName -ErrorAction SilentlyContinue

Write-Host "$taskName installed for user '$UserName' (every $IntervalMinutes minutes)." -ForegroundColor Green
