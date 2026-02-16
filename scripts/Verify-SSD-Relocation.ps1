# Verify-SSD-Relocation.ps1
# Post-SSD-Move Verification Script for Opus 4.6
# Verifies T5500 and 9020 SSDs are properly configured after physical relocation
# Owner: Joshua Coleman (Trollz1004) + OPUS
# Last Updated: 2026-02-07

param(
    [switch]$Detailed
)

$ErrorActionPreference = 'Stop'

Write-Host "╔══════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║  OPUS 4.6 — SSD Relocation Verification                ║" -ForegroundColor Cyan
Write-Host "╚══════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

# Check SABRETOOTH config files
Write-Host "[1/6] Checking SABRETOOTH config files..." -ForegroundColor Yellow
$configFiles = @(
    'E:\OPUSONLY\config\node_manifest.json',
    'E:\OPUSONLY\config\project_index.json',
    'E:\OPUSONLY\memory\CONSOLIDATED_USER_PREFERENCES.md',
    'E:\OPUSONLY\memory\OPUS-STATUS.md'
)

foreach ($file in $configFiles) {
    if (Test-Path $file) {
        Write-Host "  ✓ Found: $(Split-Path $file -Leaf)" -ForegroundColor Green
        
        # Check for old drive letters (G:\ or H:\)
        $content = Get-Content $file -Raw
        if ($content -match 'G:\\OPUSONLY' -or $content -match 'H:\\OPUSONLY') {
            Write-Host "    ⚠ WARNING: Found old drive letters (G:\ or H:\) in file!" -ForegroundColor Red
        }
    } else {
        Write-Host "  ✗ Missing: $(Split-Path $file -Leaf)" -ForegroundColor Red
    }
}

# Verify node_manifest.json structure
Write-Host "`n[2/6] Validating node_manifest.json..." -ForegroundColor Yellow
$manifest = Get-Content 'E:\OPUSONLY\config\node_manifest.json' -Raw | ConvertFrom-Json
$t5500Node = $manifest.nodes | Where-Object { $_.name -eq 'T5500' }
$9020Node = $manifest.nodes | Where-Object { $_.name -eq 'OPTIPLEX9020' }

if ($t5500Node.driveLetter -eq 'C' -and $t5500Node.opusRoot -eq 'C:\OPUSONLY') {
    Write-Host "  ✓ T5500 configuration: CORRECT (C:\OPUSONLY)" -ForegroundColor Green
} else {
    Write-Host "  ✗ T5500 configuration: INCORRECT" -ForegroundColor Red
    Write-Host "    Expected: C:\OPUSONLY | Found: $($t5500Node.opusRoot)" -ForegroundColor Red
}

if ($9020Node.driveLetter -eq 'C' -and $9020Node.opusRoot -eq 'C:\OPUSONLY') {
    Write-Host "  ✓ 9020 configuration: CORRECT (C:\OPUSONLY)" -ForegroundColor Green
} else {
    Write-Host "  ✗ 9020 configuration: INCORRECT" -ForegroundColor Red
    Write-Host "    Expected: C:\OPUSONLY | Found: $($9020Node.opusRoot)" -ForegroundColor Red
}

# Check SSH key
Write-Host "`n[3/6] Checking SSH key..." -ForegroundColor Yellow
$sshKey = 'C:\Users\joshl\.ssh\id_ed25519'
if (Test-Path $sshKey) {
    Write-Host "  ✓ SSH private key found: $sshKey" -ForegroundColor Green
} else {
    Write-Host "  ✗ SSH private key missing: $sshKey" -ForegroundColor Red
}

# Check network accessibility (requires nodes to be booted)
Write-Host "`n[4/6] Checking network accessibility..." -ForegroundColor Yellow
Write-Host "  → T5500 SSH test (requires T5500 to be booted)" -ForegroundColor Gray
Write-Host "    Manual test: ssh joshl@<T5500-IP> 'dir C:\OPUSONLY'" -ForegroundColor Gray

Write-Host "  → 9020 SSH test (requires 9020 to be booted)" -ForegroundColor Gray
Write-Host "    Manual test: ssh joshl@<9020-IP> 'dir C:\OPUSONLY'" -ForegroundColor Gray

# Remote node checklist
Write-Host "`n[5/6] Remote node post-boot checklist..." -ForegroundColor Yellow
Write-Host "  After booting T5500, verify:" -ForegroundColor Gray
Write-Host "    • C:\OPUSONLY exists" -ForegroundColor Gray
Write-Host "    • C:\OPUSONLY\scripts\Setup-SSHServer.ps1 exists" -ForegroundColor Gray
Write-Host "    • C:\OPUSONLY\scripts\Start-DateAppServices.ps1 exists" -ForegroundColor Gray
Write-Host "    • SSH service is running (Test-NetConnection)" -ForegroundColor Gray
Write-Host "    • SABRETOOTH pubkey in C:\Users\joshl\.ssh\authorized_keys" -ForegroundColor Gray

Write-Host "`n  After booting 9020, verify:" -ForegroundColor Gray
Write-Host "    • C:\OPUSONLY exists" -ForegroundColor Gray
Write-Host "    • C:\OPUSONLY\scripts\Setup-SSHServer.ps1 exists" -ForegroundColor Gray
Write-Host "    • SSH service is running" -ForegroundColor Gray
Write-Host "    • SABRETOOTH pubkey in C:\Users\joshl\.ssh\authorized_keys" -ForegroundColor Gray

# Summary
Write-Host "`n[6/6] Summary" -ForegroundColor Yellow
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "Config files updated for Opus 4.6 SSD relocation." -ForegroundColor White
Write-Host "Next steps:" -ForegroundColor White
Write-Host "  1. Physically move T5500 SSD from G:\ (SABRETOOTH) to T5500" -ForegroundColor White
Write-Host "  2. Physically move 9020 SSD from H:\ (SABRETOOTH) to 9020" -ForegroundColor White
Write-Host "  3. Boot T5500 and verify C:\OPUSONLY is accessible" -ForegroundColor White
Write-Host "  4. Boot 9020 and verify C:\OPUSONLY is accessible" -ForegroundColor White
Write-Host "  5. Test SSH from SABRETOOTH to both nodes" -ForegroundColor White
Write-Host "  6. Test DateApp services on T5500" -ForegroundColor White
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

if ($Detailed) {
    Write-Host "`nDETAILED NODE MANIFEST:" -ForegroundColor Cyan
    $manifest | ConvertTo-Json -Depth 10 | Write-Host
}
