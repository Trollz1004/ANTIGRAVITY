param(
    [string]$RepoRoot = "C:\antigravity",
    [string]$TaskName = "ANTIGRAVITY-T5500-DateApp-OpsWatchdog",
    [int]$IntervalMinutes = 30,
    [string]$VaultRuntimeEnvFile = "C:\Users\joshl\OneDrive\Personal Vault\ENV-AUTHORITY-20260608-082127\derived-platform-envs\runtime-misc.env",
    [string]$MachineRuntimeEnvFile = "C:\ProgramData\Antigravity\secrets\cloudflare-wrangler.env"
)

$ErrorActionPreference = "Stop"

function Sync-CloudflareEnvCache {
    param(
        [string]$Source,
        [string]$Target
    )

    if (-not (Test-Path -LiteralPath $Source)) {
        Write-Host "Cloudflare env source not available; leaving existing machine cache unchanged."
        return
    }

    $allowed = "^(CLOUDFLARE_|CF_|WRANGLER_)"
    $lines = New-Object System.Collections.Generic.List[string]
    foreach ($line in Get-Content -LiteralPath $Source -ErrorAction Stop) {
        $trimmed = $line.Trim()
        if (-not $trimmed -or $trimmed.StartsWith("#")) { continue }
        if ($trimmed -notmatch "^([A-Za-z_][A-Za-z0-9_]*)=(.*)$") { continue }
        if ($matches[1] -match $allowed) {
            $lines.Add($trimmed) | Out-Null
        }
    }

    if ($lines.Count -eq 0) {
        Write-Host "No Cloudflare/Wrangler env keys found in source; leaving machine cache unchanged."
        return
    }

    $targetDir = Split-Path -Parent $Target
    New-Item -ItemType Directory -Force -Path $targetDir | Out-Null
    Set-Content -LiteralPath $Target -Value $lines -Encoding UTF8

    icacls $targetDir /inheritance:r /grant:r "SYSTEM:(OI)(CI)F" "Administrators:(OI)(CI)F" | Out-Null
    icacls $Target /inheritance:r /grant:r "SYSTEM:F" "Administrators:F" | Out-Null

    Write-Host "Cached $($lines.Count) Cloudflare/Wrangler env keys for SYSTEM watchdog use at $Target."
}

$watchdog = Join-Path $RepoRoot "scripts\t5500\Invoke-DateAppOpsWatchdog.ps1"
if (-not (Test-Path -LiteralPath $watchdog)) {
    throw "Watchdog script not found: $watchdog"
}

Sync-CloudflareEnvCache -Source $VaultRuntimeEnvFile -Target $MachineRuntimeEnvFile

$actionArgs = "-NoProfile -ExecutionPolicy Bypass -File `"$watchdog`" -DeployPagesOnPublicDown"
$action = New-ScheduledTaskAction -Execute "powershell.exe" -Argument $actionArgs -WorkingDirectory $RepoRoot

$startupTrigger = New-ScheduledTaskTrigger -AtStartup
$repeatTrigger = New-ScheduledTaskTrigger `
    -Once `
    -At (Get-Date).AddMinutes(5) `
    -RepetitionInterval (New-TimeSpan -Minutes $IntervalMinutes) `
    -RepetitionDuration (New-TimeSpan -Days 3650)

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
