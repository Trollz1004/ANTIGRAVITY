# setup-vault-and-baseline.ps1
# Purpose: Purge OneDrive Personal Vault-Sabretooth of redundant env files, mirror the
# master env to T5500 and 9020, and generate a baseline manifest of files Claude places
# on Sabretooth (drift detection). Josh runs this on each node.
# Generated: 2026-06-01 by Claude (Opus) per Josh's "1 master env" + "Sabretooth = only Claude-placed files" rule.

[CmdletBinding()]
param(
    [switch]$Mirror,
    [switch]$Baseline,
    [switch]$Purge,
    [switch]$All
)

$ErrorActionPreference = 'Stop'

$Vault      = 'C:\Users\joshl\OneDrive\Personal Vault-Sabretooth'
$MasterEnv  = 'MASTER-UNIVERSAL-ENV-TROLLZ1004.env'
$MasterPath = Join-Path $Vault $MasterEnv
$T5500      = '\\192.168.0.15\C$\OPUS\env'
$N9020      = '\\192.168.0.5\D$\OPUSONLY\env'
$Local      = 'C:\OPUS\baseline\sabretooth-manifest.txt'

if ($All) { $Mirror = $true; $Baseline = $true; $Purge = $true }

# ----------------------------------------------------------------------
# PURGE — Remove redundant env files from the OneDrive vault.
# Only $MasterEnv is allowed. Everything else in the vault is drift.
# ----------------------------------------------------------------------
if ($Purge) {
    Write-Host "==> PURGE: scanning $Vault" -ForegroundColor Cyan
    if (-not (Test-Path $Vault)) {
        Write-Error "Vault not found: $Vault"
    }
    $envFiles = Get-ChildItem -Path $Vault -Recurse -File -ErrorAction SilentlyContinue |
        Where-Object { $_.Extension -in '.env', '.env.example', '.env.template' -or $_.Name -match '\.env' }
    foreach ($f in $envFiles) {
        if ($f.Name -eq $MasterEnv) { continue }
        Write-Host "  PURGE  $($f.FullName)" -ForegroundColor Yellow
        Remove-Item $f.FullName -Force
    }
    Write-Host "==> PURGE: complete. Only $MasterEnv remains in vault." -ForegroundColor Green
}

# ----------------------------------------------------------------------
# MIRROR — Copy master env to T5500, 9020, and local OPUS\env\.
# ----------------------------------------------------------------------
if ($Mirror) {
    Write-Host "==> MIRROR: copying $MasterEnv to T5500, 9020, local" -ForegroundColor Cyan
    if (-not (Test-Path $MasterPath)) {
        Write-Error "Master env not found: $MasterPath. Create it before mirroring."
    }
    $targets = @($T5500, $N9020, 'C:\OPUS\env')
    foreach ($t in $targets) {
        $dir = Split-Path $t -Parent
        if (-not (Test-Path $dir)) {
            New-Item -ItemType Directory -Path $dir -Force | Out-Null
        }
        $dest = Join-Path $t $MasterEnv
        Copy-Item -Path $MasterPath -Destination $dest -Force
        Write-Host "  MIRROR  $dest" -ForegroundColor Green
    }
    Write-Host "==> MIRROR: complete. 3 nodes synced." -ForegroundColor Green
}

# ----------------------------------------------------------------------
# BASELINE — Generate the Sabretooth filesystem manifest.
# Allowed roots only. Anything else is drift.
# ----------------------------------------------------------------------
if ($Baseline) {
    Write-Host "==> BASELINE: generating manifest" -ForegroundColor Cyan
    $allowed = @(
        'E:\ANTIGRAVITY',
        'C:\OPUS',
        'C:\Users\joshl\.claude\projects',
        $Vault,
        'E:\DateApp'
    )
    $exclude = @('node_modules', '\.git\', '\dist\', '\build\', '\.venv\', '__pycache__', '\.next\')
    $out = @()
    $out += "# sabretooth-manifest.txt"
    $out += "# Generated: $(Get-Date -Format o)"
    $out += "# Allowed roots: $($allowed -join ', ')"
    $out += "# Drift = any file outside these roots. Hermes posts drift to PAPERWEIGHT BLOCKED."
    $out += ''
    foreach ($root in $allowed) {
        if (-not (Test-Path $root)) { continue }
        $files = Get-ChildItem -Path $root -Recurse -File -Force -ErrorAction SilentlyContinue |
            Where-Object { $_.FullName -notmatch ($exclude -join '|') } |
            Select-Object -ExpandProperty FullName
        foreach ($f in $files) { $out += $f }
    }
    $dir = Split-Path $Local -Parent
    if (-not (Test-Path $dir)) {
        New-Item -ItemType Directory -Path $dir -Force | Out-Null
    }
    $out | Out-File $Local -Encoding utf8
    $count = ($out | Where-Object { $_ -and $_ -notmatch '^#' }).Count
    Write-Host "==> BASELINE: $count files in manifest at $Local" -ForegroundColor Green
}

Write-Host "==> DONE." -ForegroundColor Green
