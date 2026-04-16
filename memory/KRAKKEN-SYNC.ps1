# ==============================================================================
# KRAKKEN PROTOCOL: PERSISTENT MEMORY & ARTIFACT BACKUP
# ==============================================================================
# Execution Environment: Sabretooth (run from PowerShell 7.5 as admin)
# Purpose: Mirrors all agent memory states (C: Drive Opus, E: Drive Gemini/CodeX)
#          AND the current ENV template to the physical offline backup drive (KRAKKEN).
#
# KRAKKEN drive is the external removable drive — currently labelled E: on Sabretooth
# (was I: in older sessions). Script auto-detects the correct drive letter.
#
# Prevents complete amnesia if SSDs melt down from 24/7 inference loads.
# Run this any time you update .env, CLAUDE.md, or add new memory files.
# ==============================================================================

# --- Dynamic KRAKKEN drive detection ---
# Tries E: first (current label), falls back to I: (old label).
# If neither has the ANTIGRAVITY_BACKUPS folder, creates it on E:.
$KrakkenDrive = $null
foreach ($letter in @("E", "I", "F", "G", "H")) {
    if (Test-Path "${letter}:\ANTIGRAVITY_BACKUPS") {
        $KrakkenDrive = "${letter}:"
        Write-Host "KRAKKEN drive found at ${letter}:" -ForegroundColor Green
        break
    }
}
if (-not $KrakkenDrive) {
    # First-time setup — create the vault structure on E: (krakken default)
    $KrakkenDrive = "E:"
    Write-Host "KRAKKEN vault not found — creating on E: (first-time setup)" -ForegroundColor Yellow
    New-Item -ItemType Directory -Force -Path "E:\ANTIGRAVITY_BACKUPS\memory_vault" | Out-Null
    New-Item -ItemType Directory -Force -Path "E:\ANTIGRAVITY_BACKUPS\env_vault"    | Out-Null
}

$Vault       = "$KrakkenDrive\ANTIGRAVITY_BACKUPS\memory_vault"
$EnvVault    = "$KrakkenDrive\ANTIGRAVITY_BACKUPS\env_vault"

$Drive_E_Antigravity   = "E:\ANTIGRAVITY\memory"
$Drive_E_CodeX         = "E:\ANTIGRAVITY\CodeX\memory"
$Drive_C_Opus          = "C:\OPUS\memory"
$Drive_C_Opus_Antigravity = "C:\ANTIGRAVITY\memory"
$Drive_C_Antigravity_Root = "C:\ANTIGRAVITY"

Write-Host ""
Write-Host "=========================================================" -ForegroundColor Cyan
Write-Host "  KRAKKEN SYNC PROTOCOL — RELEASE THE KRAKEN" -ForegroundColor Cyan
Write-Host "  Target Vault : $Vault" -ForegroundColor DarkGray
Write-Host "  ENV Vault    : $EnvVault" -ForegroundColor DarkGray
Write-Host "=========================================================" -ForegroundColor Cyan

# Ensure all target directories exist
$Targets = @(
    "$Vault\E_Drive_Sabretooth\ANTIGRAVITY",
    "$Vault\E_Drive_Sabretooth\CodeX",
    "$Vault\C_Drive_Opus\OPUS",
    "$Vault\C_Drive_Opus\ANTIGRAVITY",
    $EnvVault
)
foreach ($Target in $Targets) {
    if (-not (Test-Path $Target)) {
        New-Item -ItemType Directory -Force -Path $Target | Out-Null
    }
}

# ------------------------------------------------------------------------------
# [1/5] E: Drive — ANTIGRAVITY memory (Gemini)
# ------------------------------------------------------------------------------
Write-Host "`n[1/5] Syncing E:\ANTIGRAVITY\memory (Gemini)..." -ForegroundColor Yellow
if (Test-Path $Drive_E_Antigravity) {
    Copy-Item -Path "$Drive_E_Antigravity\*" -Destination "$Vault\E_Drive_Sabretooth\ANTIGRAVITY" -Recurse -Force
    Write-Host "  OK: Gemini memory -> KRAKKEN" -ForegroundColor Green
} else {
    Write-Host "  SKIP: $Drive_E_Antigravity not found" -ForegroundColor DarkGray
}

# ------------------------------------------------------------------------------
# [2/5] E: Drive — CodeX memory
# ------------------------------------------------------------------------------
Write-Host "[2/5] Syncing E:\ANTIGRAVITY\CodeX\memory..." -ForegroundColor Yellow
if (Test-Path $Drive_E_CodeX) {
    Copy-Item -Path "$Drive_E_CodeX\*" -Destination "$Vault\E_Drive_Sabretooth\CodeX" -Recurse -Force
    Write-Host "  OK: CodeX memory -> KRAKKEN" -ForegroundColor Green
} else {
    Write-Host "  SKIP: $Drive_E_CodeX not found" -ForegroundColor DarkGray
}

# ------------------------------------------------------------------------------
# [3/5] C: Drive — Opus memory
# ------------------------------------------------------------------------------
Write-Host "[3/5] Syncing C:\OPUS\memory..." -ForegroundColor Yellow
if (Test-Path $Drive_C_Opus) {
    Copy-Item -Path "$Drive_C_Opus\*" -Destination "$Vault\C_Drive_Opus\OPUS" -Recurse -Force
    Write-Host "  OK: Opus C: memory -> KRAKKEN" -ForegroundColor Green
} else {
    Write-Host "  SKIP: $Drive_C_Opus not found" -ForegroundColor DarkGray
}

# ------------------------------------------------------------------------------
# [4/5] C: Drive — ANTIGRAVITY memory
# ------------------------------------------------------------------------------
Write-Host "[4/5] Syncing C:\ANTIGRAVITY\memory..." -ForegroundColor Yellow
if (Test-Path $Drive_C_Opus_Antigravity) {
    Copy-Item -Path "$Drive_C_Opus_Antigravity\*" -Destination "$Vault\C_Drive_Opus\ANTIGRAVITY" -Recurse -Force
    Write-Host "  OK: C:\ANTIGRAVITY\memory -> KRAKKEN" -ForegroundColor Green
} else {
    Write-Host "  SKIP: $Drive_C_Opus_Antigravity not found" -ForegroundColor DarkGray
}

# ------------------------------------------------------------------------------
# [5/5] ENV VAULT — .env template + critical config docs
# This is the new step: back up the authoritative ENV key list and AI config
# so the krakken drive always has the current source of truth.
# NOTE: This copies the TEMPLATE (.env.example) not your live secrets.
#       Copy your actual .env / MASTER-UNIVERSAL-ENV manually if needed.
# ------------------------------------------------------------------------------
Write-Host "[5/5] Syncing ENV template + config docs to env_vault..." -ForegroundColor Yellow

$EnvSources = @(
    @{ Src = "$Drive_C_Antigravity_Root\.env.example";         Dst = "$EnvVault\.env.example" },
    @{ Src = "$Drive_C_Antigravity_Root\CLAUDE.md";             Dst = "$EnvVault\CLAUDE.md" },
    @{ Src = "$Drive_C_Antigravity_Root\AGENTS.md";             Dst = "$EnvVault\AGENTS.md" },
    @{ Src = "$Drive_C_Antigravity_Root\REPO-AUDIT.md";         Dst = "$EnvVault\REPO-AUDIT.md" },
    @{ Src = "$Drive_C_Antigravity_Root\memory\credentials-map.md"; Dst = "$EnvVault\credentials-map.md" }
)

foreach ($item in $EnvSources) {
    if (Test-Path $item.Src) {
        Copy-Item -Path $item.Src -Destination $item.Dst -Force
        Write-Host "  OK: $(Split-Path $item.Src -Leaf) -> env_vault" -ForegroundColor Green
    } else {
        Write-Host "  SKIP: $(Split-Path $item.Src -Leaf) not found" -ForegroundColor DarkGray
    }
}

# If the live MASTER-UNIVERSAL-ENV exists in briefings, back it up too
$MasterEnv = "$Drive_C_Antigravity_Root\briefings\MASTER-UNIVERSAL-ENV-TROLLZ1004.env"
if (Test-Path $MasterEnv) {
    Copy-Item -Path $MasterEnv -Destination "$EnvVault\MASTER-UNIVERSAL-ENV-TROLLZ1004.env" -Force
    Write-Host "  OK: MASTER-UNIVERSAL-ENV-TROLLZ1004.env -> env_vault" -ForegroundColor Green
} else {
    Write-Host "  NOTE: MASTER-UNIVERSAL-ENV not found at $MasterEnv" -ForegroundColor Yellow
    Write-Host "        Copy it manually: cp C:\ANTIGRAVITY\briefings\MASTER-UNIVERSAL-ENV-TROLLZ1004.env $EnvVault\" -ForegroundColor Yellow
}

# Stamp the backup with a timestamp
$Stamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
"KRAKKEN sync completed: $Stamp" | Out-File -FilePath "$KrakkenDrive\ANTIGRAVITY_BACKUPS\LAST-SYNC.txt" -Force

Write-Host ""
Write-Host "=========================================================" -ForegroundColor Cyan
Write-Host "  KRAKKEN SYNC COMPLETE. AI MINDS SECURED." -ForegroundColor Green
Write-Host "  Drive  : $KrakkenDrive" -ForegroundColor DarkGray
Write-Host "  Memory : $Vault" -ForegroundColor DarkGray
Write-Host "  ENV    : $EnvVault" -ForegroundColor DarkGray
Write-Host "  Stamp  : $Stamp" -ForegroundColor DarkGray
Write-Host "=========================================================" -ForegroundColor Cyan
Start-Sleep -Seconds 3
