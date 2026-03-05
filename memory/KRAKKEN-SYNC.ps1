# ==============================================================================
# KRAKKEN PROTOCOL: PERSISTENT MEMORY & ARTIFACT BACKUP
# ==============================================================================
# Execution Environment: Sabretooth OR T5500
# Purpose: Mirrors all agent memory states (C: Drive Opus, E: Drive Gemini/CodeX) 
#          to the physical offline backup drive (I: KRAKKEN).
#
# Prevents complete amnesia if SSDs melt down from 24/7 inference loads.
# ==============================================================================

$Drive_I = "I:\ANTIGRAVITY_BACKUPS\memory_vault"
$Drive_E_Antigravity = "E:\ANTIGRAVITY\memory"
$Drive_E_CodeX = "E:\ANTIGRAVITY\CodeX\memory"
$Drive_C_Opus = "C:\OPUS\memory"
$Drive_C_Opus_Antigravity = "C:\ANTIGRAVITY\memory"

Write-Host "INITIALIZING KRAKKEN SYNC PROTOCOL..." -ForegroundColor Cyan
Write-Host "Target Vault: $Drive_I" -ForegroundColor DarkGray

# Ensure Target Directories Exist
$Targets = @(
    "$Drive_I\E_Drive_Sabretooth\ANTIGRAVITY",
    "$Drive_I\E_Drive_Sabretooth\CodeX",
    "$Drive_I\C_Drive_Opus\OPUS",
    "$Drive_I\C_Drive_Opus\ANTIGRAVITY"
)

foreach ($Target in $Targets) {
    if (-not (Test-Path $Target)) {
        New-Item -ItemType Directory -Force -Path $Target | Out-Null
    }
}

# ------------------------------------------------------------------------------
# 1. Backing up Sabretooth E: Drive (Gemini / CodeX)
# ------------------------------------------------------------------------------
Write-Host "`n[1/4] Scanning E: Drive (ANTIGRAVITY)..." -ForegroundColor Yellow
if (Test-Path $Drive_E_Antigravity) {
    Copy-Item -Path "$Drive_E_Antigravity\*" -Destination "$Drive_I\E_Drive_Sabretooth\ANTIGRAVITY" -Recurse -Force
    Write-Host "SUCCESS: Gemini memory synced to KRAKKEN." -ForegroundColor Green
} else {
    Write-Host "SKIP: Path $Drive_E_Antigravity not found." -ForegroundColor DarkGray
}

Write-Host "[2/4] Scanning E: Drive (CodeX)..." -ForegroundColor Yellow
if (Test-Path $Drive_E_CodeX) {
    Copy-Item -Path "$Drive_E_CodeX\*" -Destination "$Drive_I\E_Drive_Sabretooth\CodeX" -Recurse -Force
    Write-Host "SUCCESS: CodeX memory synced to KRAKKEN." -ForegroundColor Green
} else {
    Write-Host "SKIP: Path $Drive_E_CodeX not found." -ForegroundColor DarkGray
}

# ------------------------------------------------------------------------------
# 2. Backing up T5500 / Sabretooth C: Drive (Opus / KRAKKEN isolation)
# ------------------------------------------------------------------------------
Write-Host "[3/4] Scanning C: Drive (OPUS)..." -ForegroundColor Yellow
if (Test-Path $Drive_C_Opus) {
    Copy-Item -Path "$Drive_C_Opus\*" -Destination "$Drive_I\C_Drive_Opus\OPUS" -Recurse -Force
    Write-Host "SUCCESS: Opus C: memory synced to KRAKKEN." -ForegroundColor Green
} else {
    Write-Host "SKIP: Path $Drive_C_Opus not found." -ForegroundColor DarkGray
}

Write-Host "[4/4] Scanning C: Drive (ANTIGRAVITY)..." -ForegroundColor Yellow
if (Test-Path $Drive_C_Opus_Antigravity) {
    Copy-Item -Path "$Drive_C_Opus_Antigravity\*" -Destination "$Drive_I\C_Drive_Opus\ANTIGRAVITY" -Recurse -Force
    Write-Host "SUCCESS: Opus C:\ANTIGRAVITY memory synced to KRAKKEN." -ForegroundColor Green
} else {
    Write-Host "SKIP: Path $Drive_C_Opus_Antigravity not found." -ForegroundColor DarkGray
}

Write-Host "`n==========================================================" -ForegroundColor Cyan
Write-Host "KRAKKEN SYNC COMPLETE. AI MINDS SECURED." -ForegroundColor Green
Write-Host "==========================================================" -ForegroundColor Cyan
Start-Sleep -Seconds 5
