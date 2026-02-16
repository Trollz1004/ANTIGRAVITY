# Build-ENIGMA-Workspace.ps1
# Creates C:\ENIGMA monorepo workspace — DateApp + Crosslister consolidation
# Owner: Joshua Coleman (Trollz1004) + Claude (OPUS 4.6)
# Last Updated: 2026-02-07
# RUN THIS AFTER SSH VERIFICATION COMPLETES

param(
    [switch]$Force
)

$ErrorActionPreference = 'Stop'

Write-Host "╔════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║  OPUS 4.6 — ENIGMA Monorepo Workspace Builder        ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

# STEP 1: Create C:\ENIGMA root
Write-Host "[1/7] Creating C:\ENIGMA root directory..." -ForegroundColor Yellow
if (Test-Path 'C:\ENIGMA') {
    if ($Force) {
        Write-Host "  → C:\ENIGMA exists, Force flag set, proceeding..." -ForegroundColor Yellow
    } else {
        Write-Host "  ⚠ C:\ENIGMA already exists. Use -Force to proceed anyway." -ForegroundColor Red
        exit 1
    }
} else {
    New-Item -Path 'C:\ENIGMA' -ItemType Directory -Force | Out-Null
    Write-Host "  ✓ Created C:\ENIGMA" -ForegroundColor Green
}

# STEP 2: Clone youandinotai/youandinotai
Write-Host "`n[2/7] Cloning youandinotai/youandinotai (DateApp)..." -ForegroundColor Yellow
if (Test-Path 'C:\ENIGMA\youandinotai') {
    Write-Host "  → C:\ENIGMA\youandinotai already exists, skipping clone" -ForegroundColor Yellow
} else {
    Push-Location 'C:\ENIGMA'
    git clone git@github.com:youandinotai/youandinotai.git youandinotai
    if ($LASTEXITCODE -eq 0) {
        Write-Host "  ✓ Cloned youandinotai → C:\ENIGMA\youandinotai" -ForegroundColor Green
    } else {
        Write-Host "  ✗ Clone failed. Check SSH keys and network." -ForegroundColor Red
        Pop-Location
        exit 1
    }
    Pop-Location
}

# STEP 3: Clone onlinerecycle/onlinerecycle
Write-Host "`n[3/7] Cloning onlinerecycle/onlinerecycle (Crosslister)..." -ForegroundColor Yellow
if (Test-Path 'C:\ENIGMA\crosslister') {
    Write-Host "  → C:\ENIGMA\crosslister already exists, skipping clone" -ForegroundColor Yellow
} else {
    Push-Location 'C:\ENIGMA'
    # Note: Assuming repo exists. If not, create it first via gh CLI or web UI.
    git clone git@github.com:onlinerecycle/onlinerecycle.git crosslister 2>$null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "  ✓ Cloned onlinerecycle → C:\ENIGMA\crosslister" -ForegroundColor Green
    } else {
        Write-Host "  ⚠ Clone failed (repo may not exist yet). Creating placeholder." -ForegroundColor Yellow
        New-Item -Path 'C:\ENIGMA\crosslister' -ItemType Directory -Force | Out-Null
        Write-Host "  → Created placeholder: C:\ENIGMA\crosslister" -ForegroundColor Yellow
    }
    Pop-Location
}

# STEP 4: Copy OPUS-STATUS.md to root
Write-Host "`n[4/7] Copying OPUS-STATUS.md to root..." -ForegroundColor Yellow
Copy-Item 'E:\OPUSONLY\memory\OPUS-STATUS.md' -Destination 'C:\ENIGMA\OPUS-STATUS.md' -Force
Write-Host "  ✓ Copied OPUS-STATUS.md" -ForegroundColor Green

# STEP 5: Copy MISSION_CONTINUITY.md to root
Write-Host "`n[5/7] Copying MISSION_CONTINUITY.md to root..." -ForegroundColor Yellow
Copy-Item 'E:\OPUSONLY\memory\MISSION_CONTINUITY.md' -Destination 'C:\ENIGMA\MISSION_CONTINUITY.md' -Force
Write-Host "  ✓ Copied MISSION_CONTINUITY.md" -ForegroundColor Green

# STEP 6: Create root .gitignore
Write-Host "`n[6/7] Creating root .gitignore..." -ForegroundColor Yellow
$gitignoreContent = @'
# Node modules
node_modules/
**/node_modules/

# Build outputs
dist/
build/
.next/
out/
.vite/

# Environment files
.env
.env.local
.env.*.local
*.env

# Logs
logs/
*.log
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# OS files
.DS_Store
Thumbs.db

# IDE
.vscode/
.idea/
*.swp
*.swo

# Dependencies
.pnp
.pnp.js

# Testing
coverage/

# Misc
.cache/
temp/
tmp/
'@

Set-Content -Path 'C:\ENIGMA\.gitignore' -Value $gitignoreContent -Encoding UTF8
Write-Host "  ✓ Created root .gitignore" -ForegroundColor Green

# STEP 7: Summary
Write-Host "`n[7/7] Summary" -ForegroundColor Yellow
Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "ENIGMA Monorepo Workspace created at C:\ENIGMA" -ForegroundColor White
Write-Host ""
Write-Host "Structure:" -ForegroundColor White
Write-Host "  C:\ENIGMA\" -ForegroundColor Gray
Write-Host "  ├── youandinotai\        (DateApp codebase)" -ForegroundColor Gray
Write-Host "  ├── crosslister\         (Crosslister codebase)" -ForegroundColor Gray
Write-Host "  ├── OPUS-STATUS.md       (Universal status)" -ForegroundColor Gray
Write-Host "  ├── MISSION_CONTINUITY.md (Dead-man's-switch)" -ForegroundColor Gray
Write-Host "  └── .gitignore           (Root ignores)" -ForegroundColor Gray
Write-Host ""
Write-Host "Next steps:" -ForegroundColor White
Write-Host "  1. Verify SSH to T5500: ssh joshl@192.168.0.15" -ForegroundColor White
Write-Host "  2. Verify SSH to 9020: ssh joshl@192.168.0.5" -ForegroundColor White
Write-Host "  3. Set up Claude Code on 9020 pointing to youandinotai repo" -ForegroundColor White
Write-Host "  4. Start DateApp pre-order landing page development" -ForegroundColor White
Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""
