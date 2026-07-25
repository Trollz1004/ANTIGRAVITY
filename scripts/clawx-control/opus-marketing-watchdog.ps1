$ErrorActionPreference = "Continue"
$logFile = "E:\ANTIGRAVITY\data\watchdog-log.txt"

function Write-Log {
    param([string]$Message)
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    "$timestamp | $Message" | Out-File -Append -FilePath $logFile
    Write-Host "[$timestamp] $Message"
}

Write-Log "SAFE WATCHDOG STARTED"
Write-Log "Legacy browser autopost flow is retired. Running safe draft generation instead."

$repoRoot = Split-Path -Parent $PSScriptRoot
$safeScript = Join-Path $repoRoot "scripts\Run-Safe-NodeAutomation.ps1"

if (-not (Test-Path $safeScript)) {
    Write-Log "ERROR: Missing safe node automation script at $safeScript"
    exit 1
}

pwsh -NoProfile -ExecutionPolicy Bypass -File $safeScript -Profile 9020-content -RepoRoot $repoRoot 2>&1 |
    Out-File -Append -FilePath $logFile

Write-Log "SAFE WATCHDOG COMPLETE"
