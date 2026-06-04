#Requires -RunAsAdministrator
<#
.SYNOPSIS
    Fix SSH authorized_keys for Windows OpenSSH admin users.
.DESCRIPTION
    On Windows OpenSSH, if a user is in the Administrators group, sshd ignores
    ~/.ssh/authorized_keys and only reads C:\ProgramData\ssh\administrators_authorized_keys.
    This script creates/updates that file with the correct keys and permissions.
.NOTES
    Run this ON EACH REMOTE NODE (T5500, 9020) as Administrator.
    Do NOT run this on SABRETOOTH (the SSH client).
#>

$ErrorActionPreference = 'Stop'

$keyFile = "C:\ProgramData\ssh\administrators_authorized_keys"
$sshDir  = "C:\ProgramData\ssh"

# Keys to authorize
$keys = @(
    "ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIAA0qiTYQ/l+LXub9RviriX00NwQGVsqO4HV42FSo1UB KRAKKEN@SABRETOOTH"
)

# Also pull in any keys from joshl's personal authorized_keys (e.g. opus keys)
$userKeys = "C:\Users\joshl\.ssh\authorized_keys"
if (Test-Path $userKeys) {
    $existing = Get-Content $userKeys | Where-Object { $_.Trim() -ne '' -and -not $_.StartsWith('#') }
    foreach ($k in $existing) {
        if ($keys -notcontains $k) {
            $keys += $k
        }
    }
    Write-Host "[+] Merged $($existing.Count) key(s) from $userKeys"
}

# Ensure ProgramData\ssh exists
if (-not (Test-Path $sshDir)) {
    Write-Error "OpenSSH server directory $sshDir does not exist. Is OpenSSH Server installed?"
    exit 1
}

# Write the keys
$keys | Set-Content -Path $keyFile -Encoding UTF8
Write-Host "[+] Wrote $($keys.Count) key(s) to $keyFile"

# Lock down permissions: only SYSTEM and Administrators (required by OpenSSH)
& icacls $keyFile /inheritance:r | Out-Null
& icacls $keyFile /grant "SYSTEM:(F)" | Out-Null
& icacls $keyFile /grant "Administrators:(F)" | Out-Null
Write-Host "[+] Permissions locked to SYSTEM and Administrators"

# Verify sshd_config has the Match Group administrators block
$sshdConfig = Join-Path $sshDir "sshd_config"
if (Test-Path $sshdConfig) {
    $content = Get-Content $sshdConfig -Raw
    if ($content -match 'Match Group administrators') {
        Write-Host "[+] sshd_config has 'Match Group administrators' block (expected)"
    } else {
        Write-Host "[!] WARNING: sshd_config does NOT have 'Match Group administrators' block"
        Write-Host "    If joshl is an admin, keys in ~/.ssh/authorized_keys may still work instead"
    }
} else {
    Write-Host "[!] sshd_config not found at $sshdConfig"
}

# Check if joshl account is locked and offer to unlock
$netUser = & net user joshl 2>&1 | Out-String
if ($netUser -match 'Account active\s+No') {
    Write-Host "[!] Account 'joshl' is NOT active (locked/disabled)"
    $unlock = Read-Host "Unlock joshl account? (y/n)"
    if ($unlock -eq 'y') {
        & net user joshl /active:yes
        Write-Host "[+] Account joshl unlocked"
    }
} else {
    Write-Host "[+] Account 'joshl' is active"
}

# Restart sshd to pick up changes
Write-Host "[*] Restarting sshd service..."
Restart-Service sshd -Force
Write-Host "[+] sshd restarted"

Write-Host ""
Write-Host "=== DONE ==="
Write-Host "Test from SABRETOOTH with:"
Write-Host "  ssh -i ~/.ssh/krakken_ed25519 joshl@<this-machine-ip>"
