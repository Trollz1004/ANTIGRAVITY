[CmdletBinding()]
param(
    [string]$RepoRoot = "c:\antigravity",
    [string]$CodeXRoot,
    [switch]$KeepOBS
)

$ErrorActionPreference = "Stop"

$isAdmin = ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).
    IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)

if (-not $isAdmin) {
    throw "Run this script from an elevated PowerShell session."
}

if (-not $CodeXRoot) {
    $CodeXRoot = Join-Path $RepoRoot "CodeX"
}

Write-Host "== Finalizing Codex move to C: ==" -ForegroundColor Cyan
Write-Host "RepoRoot : $RepoRoot"
Write-Host "CodeXRoot: $CodeXRoot"
Write-Host ""

if (-not (Test-Path -LiteralPath $RepoRoot)) {
    throw "Missing repo root: $RepoRoot"
}
if (-not (Test-Path -LiteralPath $CodeXRoot)) {
    throw "Missing CodeX root: $CodeXRoot"
}

& pwsh -NoProfile -ExecutionPolicy Bypass -File "$RepoRoot\scripts\upgrade-codex-brain-task-admin.ps1" `
    -RepoRoot $RepoRoot `
    -CodeXRoot $CodeXRoot `
    -SkipModelPull

& pwsh -NoProfile -ExecutionPolicy Bypass -File "$RepoRoot\scripts\upgrade-codex-mission-task-admin.ps1" `
    -RepoRoot $RepoRoot `
    -CodeXRoot $CodeXRoot `
    -MissionMode off

& pwsh -NoProfile -ExecutionPolicy Bypass -File "$RepoRoot\scripts\upgrade-codex-task-sentry-admin.ps1" `
    -RepoRoot $RepoRoot `
    -CodeXRoot $CodeXRoot

try {
    Disable-ScheduledTask -TaskName "Clawdbot Gateway" -ErrorAction Stop | Out-Null
    Write-Host "Clawdbot Gateway disabled." -ForegroundColor Green
} catch {
    Write-Warning ("Clawdbot Gateway disable failed: {0}" -f $_.Exception.Message)
}

& pwsh -NoProfile -ExecutionPolicy Bypass -File "$RepoRoot\scripts\cleanup-sabretooth-admin.ps1" @(
    if ($KeepOBS) { "-KeepOBS" }
)

Write-Host ""
Write-Host "== Verification ==" -ForegroundColor Cyan

Get-ScheduledTask | Where-Object {
    $_.TaskName -match 'CodeX-(Brain-Checkpoint|Mission-Guardian|Task-Sentry)|Clawdbot Gateway'
} | ForEach-Object {
    [pscustomobject]@{
        TaskName         = $_.TaskName
        State            = $_.State
        Execute          = ($_.Actions.Execute -join '; ')
        Arguments        = ($_.Actions.Arguments -join '; ')
        WorkingDirectory = ($_.Actions.WorkingDirectory -join '; ')
    }
} | Format-Table -Wrap -Auto

Write-Host ""
& pwsh -NoProfile -ExecutionPolicy Bypass -File "$RepoRoot\scripts\codex-doctor.ps1" -RepoRoot $RepoRoot -WorkspaceRoot $CodeXRoot

Write-Host ""
Write-Host "Admin finalize complete. Open a fresh Codex thread in c:\antigravity\CodeX before wiping E:." -ForegroundColor Green
