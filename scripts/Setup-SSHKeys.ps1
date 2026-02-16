# ═══════════════════════════════════════════════════════════════
# SABRETOOTH SSH Key Setup for Remote Node Access
# Location: E:\OPUSONLY\scripts\Setup-SSHKeys.ps1
# Purpose: Generate SSH keypair on SABRETOOTH and show
#          instructions for deploying to T5500 and 9020
# Run on: SABRETOOTH (this machine)
# ═══════════════════════════════════════════════════════════════

Write-Host "=== SABRETOOTH SSH Key Setup ===" -ForegroundColor Cyan

$sshDir = "$env:USERPROFILE\.ssh"
$keyPath = "$sshDir\id_ed25519"
$pubKeyPath = "$keyPath.pub"

# Ensure .ssh directory exists
if (-not (Test-Path $sshDir)) {
    New-Item -ItemType Directory -Path $sshDir -Force | Out-Null
    Write-Host "[+] Created $sshDir" -ForegroundColor Green
}

# Generate key if it doesn't exist
if (-not (Test-Path $keyPath)) {
    Write-Host "[+] Generating ed25519 keypair..." -ForegroundColor Yellow
    ssh-keygen -t ed25519 -f $keyPath -N '""' -C "opus@sabretooth"
    Write-Host "[+] Key generated at $keyPath" -ForegroundColor Green
} else {
    Write-Host "[=] Key already exists at $keyPath" -ForegroundColor Green
}

# Show the public key
Write-Host ""
Write-Host "=== YOUR PUBLIC KEY ===" -ForegroundColor Green
Write-Host "(Copy this to T5500 and 9020 authorized_keys files)" -ForegroundColor Yellow
Write-Host ""
Get-Content $pubKeyPath
Write-Host ""

# Show deployment instructions
Write-Host "=== DEPLOYMENT INSTRUCTIONS ===" -ForegroundColor Cyan
Write-Host ""
Write-Host "OPTION A: SSDs still mounted on SABRETOOTH (do this NOW)" -ForegroundColor Yellow
Write-Host "  The public key needs to go into the authorized_keys on each node."
Write-Host "  But since Windows stores authorized_keys per-user on the OS drive,"
Write-Host "  you need to do this AFTER the SSDs are back in their machines."
Write-Host ""
Write-Host "OPTION B: After SSDs are in their machines" -ForegroundColor Yellow
Write-Host "  1. Boot T5500 with its SSD"
Write-Host "  2. Run AS ADMIN: powershell -File C:\OPUSONLY\scripts\Setup-SSHServer.ps1"
Write-Host "     (The script is already on the SSD at G:\OPUSONLY\scripts\Setup-SSHServer.ps1)"
Write-Host "     (When SSD boots as C: on T5500, it becomes C:\OPUSONLY\scripts\...)"
Write-Host "  3. Then manually paste this public key into:"
Write-Host "     C:\Users\joshl\.ssh\authorized_keys"
Write-Host "  4. Test from SABRETOOTH: ssh joshl@<T5500-IP>"
Write-Host ""
Write-Host "  5. Repeat for 9020 (same script, same key)"
Write-Host ""
Write-Host "OPTION C: Quick copy while SSDs are here" -ForegroundColor Yellow
Write-Host "  Save the public key to a file on each SSD now:"

# Auto-save public key to both drives if mounted
if (Test-Path "G:\OPUSONLY") {
    Copy-Item $pubKeyPath "G:\OPUSONLY\config\sabretooth_pubkey.pub" -Force
    Write-Host "  -> Saved to G:\OPUSONLY\config\sabretooth_pubkey.pub" -ForegroundColor Green
}
if (Test-Path "H:\OPUSONLY") {
    Copy-Item $pubKeyPath "H:\OPUSONLY\config\sabretooth_pubkey.pub" -Force
    Write-Host "  -> Saved to H:\OPUSONLY\config\sabretooth_pubkey.pub" -ForegroundColor Green
}

Write-Host ""
Write-Host "After SSDs are installed, on each node run:" -ForegroundColor Yellow
Write-Host "  type C:\OPUSONLY\config\sabretooth_pubkey.pub >> C:\Users\joshl\.ssh\authorized_keys"
Write-Host ""
Write-Host "=== DONE ===" -ForegroundColor Green
