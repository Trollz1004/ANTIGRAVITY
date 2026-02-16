#Requires -RunAsAdministrator
<#
.SYNOPSIS
    OPUS Post-Factory-Reset Node Setup - 9020 Edition
    Generated 2026-02-10 by OPUS 4.6
.DESCRIPTION
    Sets up 9020 (192.168.0.5) as marketing/storage node.
    D:\ = 480GB SSD for DateApp file storage.
    Network share for SABRETOOTH access (Z:\ mapped drive).
    SSH user: opus (local account, not Microsoft account).
.NOTES
    User: opus (local account created for SSH/SMB)
    Login account: "9020" (Microsoft account)
    IP: 192.168.0.5
    Role: Marketing + Storage (480GB SSD on D:\)
    Vault: C:\OPUSONLY\.vault\
    Backup access: Chrome Remote Desktop (joshlcoleman@gmail.com, PIN 1004)
    Cloud Run: https://dateapp-backend-io5tscl75a-ue.a.run.app (LIVE)
#>

param(
    [int]$MaxRetries = 3,
    [switch]$SkipDocker,
    [string]$OpusPassword = "opus2026"
)

$ErrorActionPreference = 'Continue'
$ProgressPreference = 'Continue'

# -- Helpers -----------------------------------------------------------
function Write-Step   { param($msg) Write-Host "`n>> $msg" -ForegroundColor Cyan }
function Write-OK     { param($msg) Write-Host "  [OK] $msg" -ForegroundColor Green }
function Write-Warn   { param($msg) Write-Host "  [!!] $msg" -ForegroundColor Yellow }
function Write-Fail   { param($msg) Write-Host "  [XX] $msg" -ForegroundColor Red }
function Write-Info   { param($msg) Write-Host "  --> $msg" -ForegroundColor Gray }

$script:Results = [System.Collections.ArrayList]::new()
function Add-Result {
    param([string]$Name, [string]$Status, [string]$Detail)
    $null = $script:Results.Add([PSCustomObject]@{ Name=$Name; Status=$Status; Detail=$Detail })
}

function Invoke-WithRetry {
    param([scriptblock]$Action, [string]$Name, [int]$Retries = $MaxRetries)
    for ($i = 1; $i -le $Retries; $i++) {
        try {
            & $Action
            return $true
        } catch {
            if ($i -lt $Retries) {
                Write-Warn "$Name failed (attempt $i/$Retries): $($_.Exception.Message)"
                Write-Info "Retrying in 5 seconds..."
                Start-Sleep -Seconds 5
            } else {
                Write-Fail "$Name failed after $Retries attempts: $($_.Exception.Message)"
                return $false
            }
        }
    }
    return $false
}

function Test-CommandExists { param([string]$Cmd); $null -ne (Get-Command $Cmd -ErrorAction SilentlyContinue) }

function Update-Path {
    $machinePath = [Environment]::GetEnvironmentVariable("Path", "Machine")
    $userPath    = [Environment]::GetEnvironmentVariable("Path", "User")
    $env:Path = "$machinePath;$userPath"
}

# -- BANNER ------------------------------------------------------------
Clear-Host
Write-Host ""
Write-Host "================================================================" -ForegroundColor Green
Write-Host "    OPUS 4.6 - Post-Reset Node Setup (9020)"                     -ForegroundColor Green
Write-Host "    Role: Marketing + Storage (D:\ 480GB SSD)"                   -ForegroundColor Green
Write-Host "    IP: 192.168.0.5 | SSH User: opus"                            -ForegroundColor Green
Write-Host "================================================================" -ForegroundColor Green
Write-Host ""

$totalSteps = 17
$currentStep = 0

# ==================================================================
# STEP 1: winget
# ==================================================================
$currentStep++
Write-Progress -Activity "9020 Setup" -Status "Step $currentStep/$totalSteps - Package Manager" -PercentComplete (($currentStep/$totalSteps)*100)
Write-Step "[$currentStep/$totalSteps] Checking winget..."

if (Test-CommandExists "winget") {
    $wingetVer = (winget --version 2>$null)
    Write-OK "winget found: $wingetVer"
    Add-Result "winget" "OK" $wingetVer
} else {
    Write-Warn "winget not found - attempting install..."
    try {
        Add-AppxPackage -RegisterByFamilyName -MainPackage Microsoft.DesktopAppInstaller_8wekyb3d8bbwe -ErrorAction Stop
        Update-Path
        if (Test-CommandExists "winget") {
            Write-OK "winget installed"
            Add-Result "winget" "INSTALLED" "via AppxPackage"
        } else {
            Write-Warn "winget may need Store update or reboot"
            Add-Result "winget" "WARN" "May need reboot"
        }
    } catch {
        Write-Fail "Could not install winget: $($_.Exception.Message)"
        Add-Result "winget" "FAIL" "Manual install needed"
    }
}

# ==================================================================
# STEP 2: Git
# ==================================================================
$currentStep++
Write-Progress -Activity "9020 Setup" -Status "Step $currentStep/$totalSteps - Git" -PercentComplete (($currentStep/$totalSteps)*100)
Write-Step "[$currentStep/$totalSteps] Installing Git..."

if (Test-CommandExists "git") {
    Write-OK "Git already installed: $(git --version 2>$null)"
    Add-Result "Git" "OK" (git --version 2>$null)
} else {
    $ok = Invoke-WithRetry -Name "Git" -Action {
        winget install --id Git.Git -e --accept-source-agreements --accept-package-agreements --silent
        Update-Path
        if (-not (Test-CommandExists "git")) { throw "git not in PATH" }
    }
    if ($ok) { Write-OK "Git installed"; Add-Result "Git" "INSTALLED" "via winget" }
    else { Add-Result "Git" "FAIL" "winget install failed" }
}

# ==================================================================
# STEP 3: Node.js LTS
# ==================================================================
$currentStep++
Write-Progress -Activity "9020 Setup" -Status "Step $currentStep/$totalSteps - Node.js" -PercentComplete (($currentStep/$totalSteps)*100)
Write-Step "[$currentStep/$totalSteps] Installing Node.js LTS..."

if (Test-CommandExists "node") {
    Write-OK "Node.js already installed: $(node --version 2>$null)"
    Add-Result "Node.js" "OK" (node --version 2>$null)
} else {
    $ok = Invoke-WithRetry -Name "Node.js" -Action {
        winget install --id OpenJS.NodeJS.LTS -e --accept-source-agreements --accept-package-agreements --silent
        Update-Path
        if (-not (Test-CommandExists "node")) { throw "node not in PATH" }
    }
    if ($ok) { Write-OK "Node.js installed"; Add-Result "Node.js" "INSTALLED" "via winget" }
    else { Add-Result "Node.js" "FAIL" "winget install failed" }
}

# ==================================================================
# STEP 4: Python
# ==================================================================
$currentStep++
Write-Progress -Activity "9020 Setup" -Status "Step $currentStep/$totalSteps - Python" -PercentComplete (($currentStep/$totalSteps)*100)
Write-Step "[$currentStep/$totalSteps] Installing Python..."

if (Test-CommandExists "python") {
    Write-OK "Python already installed: $(python --version 2>$null)"
    Add-Result "Python" "OK" (python --version 2>$null)
} else {
    $ok = Invoke-WithRetry -Name "Python" -Action {
        winget install --id Python.Python.3.12 -e --accept-source-agreements --accept-package-agreements --silent
        Update-Path
        if (-not (Test-CommandExists "python")) { throw "python not in PATH" }
    }
    if ($ok) { Write-OK "Python installed"; Add-Result "Python" "INSTALLED" "via winget" }
    else { Add-Result "Python" "FAIL" "winget install failed" }
}

# ==================================================================
# STEP 5: VS Code
# ==================================================================
$currentStep++
Write-Progress -Activity "9020 Setup" -Status "Step $currentStep/$totalSteps - VS Code" -PercentComplete (($currentStep/$totalSteps)*100)
Write-Step "[$currentStep/$totalSteps] Installing VS Code..."

if (Test-CommandExists "code") {
    Write-OK "VS Code already installed"
    Add-Result "VS Code" "OK" "Already installed"
} else {
    $ok = Invoke-WithRetry -Name "VS Code" -Action {
        winget install --id Microsoft.VisualStudioCode -e --accept-source-agreements --accept-package-agreements --silent
        Update-Path
    }
    if ($ok) { Write-OK "VS Code installed"; Add-Result "VS Code" "INSTALLED" "via winget" }
    else { Add-Result "VS Code" "FAIL" "winget install failed" }
}

# ==================================================================
# STEP 6: GitHub CLI
# ==================================================================
$currentStep++
Write-Progress -Activity "9020 Setup" -Status "Step $currentStep/$totalSteps - GitHub CLI" -PercentComplete (($currentStep/$totalSteps)*100)
Write-Step "[$currentStep/$totalSteps] Installing GitHub CLI..."

if (Test-CommandExists "gh") {
    Write-OK "GitHub CLI already installed"
    Add-Result "GitHub CLI" "OK" "Already installed"
} else {
    $ok = Invoke-WithRetry -Name "GitHub CLI" -Action {
        winget install --id GitHub.cli -e --accept-source-agreements --accept-package-agreements --silent
        Update-Path
        if (-not (Test-CommandExists "gh")) { throw "gh not in PATH" }
    }
    if ($ok) { Write-OK "GitHub CLI installed"; Add-Result "GitHub CLI" "INSTALLED" "via winget" }
    else { Add-Result "GitHub CLI" "FAIL" "winget install failed" }
}

# ==================================================================
# STEP 7: Claude Code
# ==================================================================
$currentStep++
Write-Progress -Activity "9020 Setup" -Status "Step $currentStep/$totalSteps - Claude Code" -PercentComplete (($currentStep/$totalSteps)*100)
Write-Step "[$currentStep/$totalSteps] Installing Claude Code CLI..."

if (Test-CommandExists "claude") {
    Write-OK "Claude Code already installed"
    Add-Result "Claude Code" "OK" "Already installed"
} else {
    if (Test-CommandExists "npm") {
        $ok = Invoke-WithRetry -Name "Claude Code" -Action {
            npm install -g @anthropic-ai/claude-code 2>&1 | Out-Null
            Update-Path
            if (-not (Test-CommandExists "claude")) { throw "claude not in PATH" }
        }
        if ($ok) { Write-OK "Claude Code installed"; Add-Result "Claude Code" "INSTALLED" "npm global" }
        else { Add-Result "Claude Code" "FAIL" "npm install failed" }
    } else {
        Write-Fail "npm not available - install Node.js first"
        Add-Result "Claude Code" "FAIL" "npm not available"
    }
}

# Claude launcher
try {
    $claudeDir = "$env:USERPROFILE\.claude"
    if (-not (Test-Path $claudeDir)) { New-Item -ItemType Directory -Path $claudeDir -Force | Out-Null }
    Set-Content -Path "$claudeDir\claude-skip-perms.cmd" -Value '@echo off
claude --dangerously-skip-permissions %*'
    Write-OK "Claude launcher created"
} catch { Write-Warn "Could not create Claude launcher" }

# ==================================================================
# STEP 8: Create local 'opus' user for SSH/SMB
# ==================================================================
$currentStep++
Write-Progress -Activity "9020 Setup" -Status "Step $currentStep/$totalSteps - Local User" -PercentComplete (($currentStep/$totalSteps)*100)
Write-Step "[$currentStep/$totalSteps] Creating local 'opus' user for SSH/SMB..."

$opusUser = Get-LocalUser -Name "opus" -ErrorAction SilentlyContinue
if ($opusUser) {
    Write-OK "Local user 'opus' already exists"
    Add-Result "opus User" "OK" "Already exists"
} else {
    try {
        $secPassword = ConvertTo-SecureString $OpusPassword -AsPlainText -Force
        New-LocalUser -Name "opus" -Password $secPassword -FullName "OPUS AI" -Description "SSH and SMB access for OPUS network" -PasswordNeverExpires -ErrorAction Stop | Out-Null
        Add-LocalGroupMember -Group "Administrators" -Member "opus" -ErrorAction SilentlyContinue
        Write-OK "Created local user 'opus' (password: from -OpusPassword param)"
        Add-Result "opus User" "INSTALLED" "Local admin account"
    } catch {
        Write-Fail "Could not create opus user: $($_.Exception.Message)"
        Add-Result "opus User" "FAIL" "$($_.Exception.Message)"
    }
}

# ==================================================================
# STEP 9: SSH Setup
# ==================================================================
$currentStep++
Write-Progress -Activity "9020 Setup" -Status "Step $currentStep/$totalSteps - SSH" -PercentComplete (($currentStep/$totalSteps)*100)
Write-Step "[$currentStep/$totalSteps] Configuring SSH..."

# OpenSSH Client
try {
    $sshClient = Get-WindowsCapability -Online | Where-Object Name -like 'OpenSSH.Client*'
    if ($sshClient.State -ne 'Installed') {
        Add-WindowsCapability -Online -Name OpenSSH.Client~~~~0.0.1.0 -ErrorAction Stop | Out-Null
        Write-OK "OpenSSH Client installed"
    } else { Write-OK "OpenSSH Client already installed" }
} catch { Write-Warn "OpenSSH Client check failed" }

# OpenSSH Server
try {
    $sshServer = Get-WindowsCapability -Online | Where-Object Name -like 'OpenSSH.Server*'
    if ($sshServer.State -ne 'Installed') {
        Add-WindowsCapability -Online -Name OpenSSH.Server~~~~0.0.1.0 -ErrorAction Stop | Out-Null
        Write-OK "OpenSSH Server installed"
    } else { Write-OK "OpenSSH Server already installed" }
} catch { Write-Warn "OpenSSH Server check failed" }

# Start sshd
try {
    Set-Service -Name sshd -StartupType Automatic -ErrorAction SilentlyContinue
    Start-Service sshd -ErrorAction SilentlyContinue
    Write-OK "sshd started and set to Automatic"
} catch { Write-Warn "Could not configure sshd" }

# Firewall
try {
    $rule = Get-NetFirewallRule -Name 'OpenSSH-Server-In-TCP' -ErrorAction SilentlyContinue
    if (-not $rule) {
        New-NetFirewallRule -Name 'OpenSSH-Server-In-TCP' -DisplayName 'OpenSSH Server (sshd)' -Enabled True -Direction Inbound -Protocol TCP -Action Allow -LocalPort 22 | Out-Null
        Write-OK "SSH firewall rule added"
    } else { Write-OK "SSH firewall rule exists" }
} catch { Write-Warn "Could not create SSH firewall rule" }

# Admin authorized_keys for opus user
# (Windows admin users use C:\ProgramData\ssh\administrators_authorized_keys)
$adminKeysDir = "C:\ProgramData\ssh"
$adminKeysFile = "$adminKeysDir\administrators_authorized_keys"
if (-not (Test-Path $adminKeysDir)) {
    New-Item -ItemType Directory -Path $adminKeysDir -Force | Out-Null
}
if (-not (Test-Path $adminKeysFile)) {
    New-Item -ItemType File -Path $adminKeysFile -Force | Out-Null
    Write-OK "Created $adminKeysFile (paste SABRETOOTH pubkey here)"
    Write-Info "IMPORTANT: After setup, paste SABRETOOTH's id_ed25519.pub into:"
    Write-Info "  $adminKeysFile"
    Write-Info "Then set permissions: icacls $adminKeysFile /inheritance:r /grant SYSTEM:F /grant Administrators:F"
} else {
    Write-OK "administrators_authorized_keys exists"
}

# SSH config
$sshDir = "$env:USERPROFILE\.ssh"
$sshConfig = "$sshDir\config"
if (-not (Test-Path $sshDir)) { New-Item -ItemType Directory -Path $sshDir -Force | Out-Null }
if (-not (Test-Path $sshConfig)) {
    $configContent = @"
# OPUS Node SSH Config - 9020 - Auto-generated $(Get-Date -Format 'yyyy-MM-dd')

Host sabretooth
    HostName 192.168.0.8
    User joshl
    IdentityFile ~/.ssh/id_ed25519
    StrictHostKeyChecking no

Host t5500
    HostName 192.168.0.15
    User aicol
    IdentityFile ~/.ssh/id_ed25519
    StrictHostKeyChecking no
"@
    Set-Content -Path $sshConfig -Value $configContent
    Write-OK "SSH config created (sabretooth + t5500)"
} else { Write-OK "SSH config exists" }

Add-Result "SSH" "OK" "sshd + firewall + admin_keys"

# ==================================================================
# STEP 10: D:\ Storage SSD Setup
# ==================================================================
$currentStep++
Write-Progress -Activity "9020 Setup" -Status "Step $currentStep/$totalSteps - Storage SSD" -PercentComplete (($currentStep/$totalSteps)*100)
Write-Step "[$currentStep/$totalSteps] Setting up D:\ storage SSD (480GB)..."

if (Test-Path "D:\") {
    # Create storage directories
    $storageDirs = @(
        "D:\DATE APP STORAGE LOCAL",
        "D:\DATE APP STORAGE LOCAL\profiles",
        "D:\DATE APP STORAGE LOCAL\media",
        "D:\DATE APP STORAGE LOCAL\backups"
    )
    foreach ($d in $storageDirs) {
        if (-not (Test-Path $d)) {
            New-Item -ItemType Directory -Path $d -Force | Out-Null
            Write-OK "Created: $d"
        } else { Write-OK "Exists: $d" }
    }
    Add-Result "Storage SSD" "OK" "D:\ directories ready"
} else {
    Write-Warn "D:\ drive not detected - 480GB SSD may not be mounted"
    Write-Info "Check Disk Management to assign D: drive letter to SSD"
    Add-Result "Storage SSD" "WARN" "D:\ not found"
}

# ==================================================================
# STEP 11: Network Share (SMB)
# ==================================================================
$currentStep++
Write-Progress -Activity "9020 Setup" -Status "Step $currentStep/$totalSteps - Network Share" -PercentComplete (($currentStep/$totalSteps)*100)
Write-Step "[$currentStep/$totalSteps] Creating network share..."

if (Test-Path "D:\DATE APP STORAGE LOCAL") {
    $existingShare = Get-SmbShare -Name "DATE APP STORAGE LOCAL" -ErrorAction SilentlyContinue
    if ($existingShare) {
        Write-OK "Share 'DATE APP STORAGE LOCAL' already exists"
    } else {
        try {
            New-SmbShare -Name "DATE APP STORAGE LOCAL" -Path "D:\DATE APP STORAGE LOCAL" -FullAccess "Everyone" -ErrorAction Stop | Out-Null
            Write-OK "Created share: \\192.168.0.5\DATE APP STORAGE LOCAL"
        } catch {
            Write-Warn "Could not create share: $($_.Exception.Message)"
        }
    }
    Write-Info "Map from SABRETOOTH: net use Z: '\\192.168.0.5\DATE APP STORAGE LOCAL' /user:opus $OpusPassword /persistent:yes"
    Add-Result "Network Share" "OK" "SMB share configured"
} else {
    Write-Warn "D:\DATE APP STORAGE LOCAL not found - create storage dirs first"
    Add-Result "Network Share" "SKIPPED" "Storage dir missing"
}

# ==================================================================
# STEP 12: Directory Structure
# ==================================================================
$currentStep++
Write-Progress -Activity "9020 Setup" -Status "Step $currentStep/$totalSteps - Directories" -PercentComplete (($currentStep/$totalSteps)*100)
Write-Step "[$currentStep/$totalSteps] Creating OPUS directory structure..."

$dirs = @(
    "C:\OPUSONLY",
    "C:\OPUSONLY\memory",
    "C:\OPUSONLY\config",
    "C:\OPUSONLY\.vault",
    "C:\OPUSONLY\marketing-automation",
    "C:\OPUSONLY\toolbox"
)

foreach ($d in $dirs) {
    if (-not (Test-Path $d)) {
        New-Item -ItemType Directory -Path $d -Force | Out-Null
        Write-OK "Created: $d"
    } else { Write-OK "Exists: $d" }
}
Add-Result "Directories" "OK" "$($dirs.Count) checked/created"

# ==================================================================
# STEP 13: Restore from USB
# ==================================================================
$currentStep++
Write-Progress -Activity "9020 Setup" -Status "Step $currentStep/$totalSteps - USB Restore" -PercentComplete (($currentStep/$totalSteps)*100)
Write-Step "[$currentStep/$totalSteps] Restoring files from USB..."

$usbRecovery = $null
foreach ($letter in @('F','G','E')) {
    $testPath = "${letter}:\OPUS-RECOVERY"
    if (Test-Path $testPath) { $usbRecovery = $testPath; break }
}

if ($usbRecovery) {
    Write-OK "USB recovery found at $usbRecovery"

    if (Test-Path "$usbRecovery\vault") {
        Copy-Item "$usbRecovery\vault\*" "C:\OPUSONLY\.vault\" -Force -Recurse
        Write-OK "Vault restored"
    }
    if (Test-Path "$usbRecovery\memory") {
        Copy-Item "$usbRecovery\memory\*" "C:\OPUSONLY\memory\" -Force
        Write-OK "Memory files restored"
    }
    if (Test-Path "$usbRecovery\config") {
        Copy-Item "$usbRecovery\config\*" "C:\OPUSONLY\config\" -Force
        Write-OK "Config files restored"
    }
    if (Test-Path "$usbRecovery\marketing-setup-repo") {
        Copy-Item "$usbRecovery\marketing-setup-repo" "C:\OPUSONLY\marketing-setup-repo" -Recurse -Force
        Write-OK "Marketing setup repo restored"
    }
    Add-Result "USB Restore" "OK" "Files restored from $usbRecovery"
} else {
    Write-Warn "USB recovery not found (checked F/G/E)"
    Add-Result "USB Restore" "SKIPPED" "USB not found"
}

# ==================================================================
# STEP 14: Marketing Dependencies
# ==================================================================
$currentStep++
Write-Progress -Activity "9020 Setup" -Status "Step $currentStep/$totalSteps - Marketing Deps" -PercentComplete (($currentStep/$totalSteps)*100)
Write-Step "[$currentStep/$totalSteps] Installing marketing automation dependencies..."

$maDir = "C:\OPUSONLY\marketing-setup-repo\marketing-automation"
if (Test-Path "$maDir\requirements.txt") {
    if (Test-CommandExists "pip") {
        try {
            pip install -r "$maDir\requirements.txt" 2>&1 | Out-Null
            Write-OK "Marketing deps installed"
            Add-Result "Marketing Deps" "OK" "pip install complete"
        } catch {
            Write-Warn "pip install failed"
            Add-Result "Marketing Deps" "WARN" "pip failed"
        }
    } else {
        Write-Warn "pip not found"
        Add-Result "Marketing Deps" "FAIL" "pip missing"
    }
} else {
    Write-Info "Marketing automation not restored yet"
    Add-Result "Marketing Deps" "SKIPPED" "Source not found"
}

# ==================================================================
# STEP 15: Chrome Remote Desktop
# ==================================================================
$currentStep++
Write-Progress -Activity "9020 Setup" -Status "Step $currentStep/$totalSteps - Remote Desktop" -PercentComplete (($currentStep/$totalSteps)*100)
Write-Step "[$currentStep/$totalSteps] Chrome Remote Desktop reminder..."

Write-Info "9020 backup access: Chrome Remote Desktop"
Write-Info "  Account: joshlcoleman@gmail.com"
Write-Info "  PIN: 1004"
Write-Info "  Install from: https://remotedesktop.google.com/access"
Write-Info "  (manual install - winget does not have CRD)"
Add-Result "Chrome RDP" "INFO" "Manual install reminder"

# ==================================================================
# STEP 16: Environment Variables
# ==================================================================
$currentStep++
Write-Progress -Activity "9020 Setup" -Status "Step $currentStep/$totalSteps - Environment" -PercentComplete (($currentStep/$totalSteps)*100)
Write-Step "[$currentStep/$totalSteps] Setting environment variables..."

[Environment]::SetEnvironmentVariable("OPUS_NODE", "9020", "Machine")
[Environment]::SetEnvironmentVariable("OPUS_ROLE", "marketing-storage", "Machine")
[Environment]::SetEnvironmentVariable("OPUS_IP", "192.168.0.5", "Machine")
[Environment]::SetEnvironmentVariable("CLOUD_RUN_URL", "https://dateapp-backend-io5tscl75a-ue.a.run.app", "Machine")
[Environment]::SetEnvironmentVariable("OPUS_VAULT", "C:\OPUSONLY\.vault", "Machine")
[Environment]::SetEnvironmentVariable("OPUS_STORAGE", "D:\DATE APP STORAGE LOCAL", "Machine")
Write-OK "Set OPUS_NODE=9020, OPUS_ROLE=marketing-storage"
Write-OK "Set CLOUD_RUN_URL, OPUS_VAULT, OPUS_STORAGE"
Add-Result "Environment" "OK" "6 machine env vars set"

# ==================================================================
# STEP 17: Cloud Verification
# ==================================================================
$currentStep++
Write-Progress -Activity "9020 Setup" -Status "Step $currentStep/$totalSteps - Cloud Check" -PercentComplete (($currentStep/$totalSteps)*100)
Write-Step "[$currentStep/$totalSteps] Verifying Cloud Run backend..."

try {
    $response = Invoke-WebRequest -Uri "https://dateapp-backend-io5tscl75a-ue.a.run.app/docs" -UseBasicParsing -TimeoutSec 15
    if ($response.StatusCode -eq 200) {
        Write-OK "Cloud Run backend is LIVE (HTTP 200)"
        Add-Result "Cloud Run" "OK" "HTTP 200"
    }
} catch {
    Write-Warn "Cloud Run not responding"
    Add-Result "Cloud Run" "WARN" "Not responding"
}

Write-Progress -Activity "9020 Setup" -Completed

# ==================================================================
# SUMMARY
# ==================================================================
Write-Host ""
Write-Host "================================================================" -ForegroundColor Green
Write-Host "            9020 SETUP SUMMARY"                                   -ForegroundColor Green
Write-Host "================================================================" -ForegroundColor Green
Write-Host ""
Write-Host ("{0,-22} {1,-12} {2}" -f "Component", "Status", "Detail") -ForegroundColor White
Write-Host ("{0,-22} {1,-12} {2}" -f "---------", "------", "------") -ForegroundColor Gray

foreach ($r in $script:Results) {
    $color = switch ($r.Status) {
        "OK"        { "Green" }
        "INSTALLED" { "Cyan" }
        "WARN"      { "Yellow" }
        "SKIPPED"   { "Yellow" }
        "INFO"      { "Gray" }
        "FAIL"      { "Red" }
        default     { "White" }
    }
    Write-Host ("{0,-22} " -f $r.Name) -NoNewline
    Write-Host ("{0,-12} " -f $r.Status) -ForegroundColor $color -NoNewline
    Write-Host $r.Detail
}

$failCount = ($script:Results | Where-Object Status -eq "FAIL").Count
Write-Host ""
if ($failCount -eq 0) { Write-Host "All components ready!" -ForegroundColor Green }
else { Write-Host "$failCount component(s) FAILED - review above" -ForegroundColor Red }

Write-Host ""
Write-Host "NEXT STEPS:" -ForegroundColor Cyan
Write-Host "  1. Paste SABRETOOTH's id_ed25519.pub into:" -ForegroundColor White
Write-Host "     C:\ProgramData\ssh\administrators_authorized_keys" -ForegroundColor Gray
Write-Host "     Then run: icacls C:\ProgramData\ssh\administrators_authorized_keys /inheritance:r /grant SYSTEM:(F) /grant Administrators:(F)" -ForegroundColor Gray
Write-Host "  2. Install Chrome Remote Desktop from https://remotedesktop.google.com/access" -ForegroundColor White
Write-Host "     (account: joshlcoleman@gmail.com, PIN: 1004)" -ForegroundColor Gray
Write-Host "  3. Run: gh auth login" -ForegroundColor White
Write-Host "  4. Run: claude --dangerously-skip-permissions" -ForegroundColor White
Write-Host "  5. Map share from SABRETOOTH:" -ForegroundColor White
Write-Host "     net use Z: '\\192.168.0.5\DATE APP STORAGE LOCAL' /user:opus $OpusPassword /persistent:yes" -ForegroundColor Gray
Write-Host "  6. Verify D:\ SSD is mounted (check Disk Management if not)" -ForegroundColor White
Write-Host ""
Write-Host "SSH FROM SABRETOOTH: ssh opus@192.168.0.5" -ForegroundColor Yellow
Write-Host ""
Write-Host "=== OPUS 4.6 - 9020 Setup Complete $(Get-Date -Format 'yyyy-MM-dd HH:mm') ===" -ForegroundColor Green
