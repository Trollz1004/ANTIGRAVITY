# Start-OpenClaw-Social.ps1
# OpenClaw Social Publishing Bootstrap Script
# Authority: Josh Coleman
# Date: 2026-03-19
# Location: C:\ANTIGRAVITY\scripts\Start-OpenClaw-Social.ps1
#
# Purpose: Initialize OpenClaw for API-first ENIGMA social publishing
# Usage: Run from Sabretooth as primary orchestrator

param(
    [switch]$DryRun = $true,
    [switch]$TestConnections,
    [switch]$SetupOnly
)

$ErrorActionPreference = "Stop"
$ProgressPreference = "Continue"

function Write-Status { param($Message, $Type = "info")
    switch ($Type) {
        "success" { Write-Host "[OK] $Message" -ForegroundColor Green }
        "warning" { Write-Host "[WARN] $Message" -ForegroundColor Yellow }
        "error" { Write-Host "[ERR] $Message" -ForegroundColor Red }
        "info" { Write-Host "[INFO] $Message" -ForegroundColor Cyan }
    }
}

function Test-LocalService {
    param($Url, $Name)
    try {
        $response = Invoke-WebRequest -Uri $Url -Method GET -TimeoutSec 5 -ErrorAction SilentlyContinue
        if ($response.StatusCode -eq 200) {
            Write-Status "$Name is responding at $Url" "success"
            return $true
        }
    } catch {
        Write-Status "$Name not responding at $Url" "warning"
        return $false
    }
    return $false
}

function Test-SSHNode {
    param($Alias, $Name)
    try {
        $result = ssh -o ConnectTimeout=5 $Alias "echo 'connected'" 2>$null
        if ($result -eq "connected") {
            Write-Status "SSH to $Name ($Alias) successful" "success"
            return $true
        }
    } catch {
        Write-Status "SSH to $Name ($Alias) failed" "warning"
        return $false
    }
    return $false
}

# ============================================
# HEADER
# ============================================
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  OpenClaw Social Publishing Bootstrap" -ForegroundColor Cyan
Write-Host "  Date: $(Get-Date -Format 'yyyy-MM-dd HH:mm')" -ForegroundColor Cyan
Write-Host "  Authority: Josh Coleman" -ForegroundColor Cyan
Write-Host "  Control Plane: Sabretooth" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# ============================================
# CHECK PREREQUISITES
# ============================================
Write-Status "Checking prerequisites..." "info"

# Check if running on Sabretooth
$hostname = $env:COMPUTERNAME
if ($hostname -ne "SABRETOOTH" -and $hostname -ne "DESKTOP-2DCAEVN") {
    Write-Status "Warning: Not running on Sabretooth (hostname: $hostname)" "warning"
    Write-Status "This script should be run from Sabretooth as primary orchestrator" "warning"
}

# Check OpenClaw
$openclaw = Get-Command openclaw -ErrorAction SilentlyContinue
if (-not $openclaw) {
    Write-Status "OpenClaw not found in PATH" "error"
    exit 1
}
Write-Status "OpenClaw found: $(openclaw --version 2>&1 | Select-Object -First 1)" "success"

# Check Ollama
$ollama = Get-Command ollama -ErrorAction SilentlyContinue
if (-not $ollama) {
    Write-Status "Ollama not found in PATH" "warning"
} else {
    Write-Status "Ollama found" "success"
}

# Check SSH
$ssh = Get-Command ssh -ErrorAction SilentlyContinue
if (-not $ssh) {
    Write-Status "SSH not found in PATH" "error"
    exit 1
}
Write-Status "SSH found" "success"

# ============================================
# CHECK LOCAL SERVICES
# ============================================
Write-Host ""
Write-Status "Checking Sabretooth local services..." "info"

$openclawOk = Test-LocalService -Url "http://127.0.0.1:18789" -Name "OpenClaw Gateway"
$ollamaOk = Test-LocalService -Url "http://127.0.0.1:11434/api/tags" -Name "Ollama"

# ============================================
# CHECK NODE REACHABILITY
# ============================================
Write-Host ""
Write-Status "Checking node reachability..." "info"

$node9020Ok = Test-SSHNode -Alias "9020" -Name "9020 Marketing Node"
$nodeT5500Ok = Test-SSHNode -Alias "t5500" -Name "T5500 Build Node"

# ============================================
# CHECK CREDENTIALS
# ============================================
Write-Host ""
Write-Status "Checking credential files..." "info"

$envFile = "C:\Users\joshl\.openclaw\social-platforms.env"
$envExample = "C:\Users\joshl\.openclaw\social-platforms.env.example"

if (Test-Path $envFile) {
    $envSize = (Get-Item $envFile).Length
    if ($envSize -gt 100) {
        Write-Status "Credential file exists ($envSize bytes)" "success"
    } else {
        Write-Status "Credential file exists but may be empty" "warning"
    }
} else {
    Write-Status "Credential file not found at $envFile" "warning"
    if (Test-Path $envExample) {
        Write-Status "Template exists at $envExample" "info"
        Write-Status "Copy and populate: Copy-Item $envExample $envFile" "info"
    }
}

# ============================================
# TEST CONNECTIONS MODE
# ============================================
if ($TestConnections) {
    Write-Host ""
    Write-Status "Connection test complete" "info"
    Write-Host ""
    Write-Host "Summary:" -ForegroundColor Cyan
    Write-Host "  OpenClaw Gateway: $(if ($openclawOk) { 'OK' } else { 'Not Running' })"
    Write-Host "  Ollama: $(if ($ollamaOk) { 'OK' } else { 'Not Running' })"
    Write-Host "  9020 Node: $(if ($node9020Ok) { 'Reachable' } else { 'Unreachable' })"
    Write-Host "  T5500 Node: $(if ($nodeT5500Ok) { 'Reachable' } else { 'Unreachable' })"
    Write-Host ""
    exit 0
}

# ============================================
# SETUP MODE
# ============================================
if ($SetupOnly) {
    Write-Host ""
    Write-Status "Setup mode - checking configuration..." "info"

    # Check social engine directory
    $socialEnginePath = "C:\ANTIGRAVITY\scripts\social_engine"
    if (Test-Path $socialEnginePath) {
        $platformCount = (Get-ChildItem "$socialEnginePath\platforms\*_poster.py" -ErrorAction SilentlyContinue).Count
        Write-Status "Social engine found with $platformCount platform modules" "success"
    } else {
        Write-Status "Social engine not found at $socialEnginePath" "error"
    }

    # Check briefings
    $briefing1 = "C:\ANTIGRAVITY\briefings\OPENCLAW-SOCIAL-READINESS-2026-03-19.md"
    $briefing2 = "C:\ANTIGRAVITY\briefings\OPENCLAW-NODE-REACHABILITY-2026-03-19.md"

    if (Test-Path $briefing1) {
        Write-Status "Social readiness briefing exists" "success"
    } else {
        Write-Status "Social readiness briefing missing" "warning"
    }

    if (Test-Path $briefing2) {
        Write-Status "Node reachability briefing exists" "success"
    } else {
        Write-Status "Node reachability briefing missing" "warning"
    }

    Write-Host ""
    Write-Status "Setup check complete" "info"
    exit 0
}

# ============================================
# MAIN EXECUTION
# ============================================
Write-Host ""
Write-Status "OpenClaw Social Publishing Bootstrap Complete" "success"
Write-Host ""
Write-Host "Configuration:" -ForegroundColor Cyan
Write-Host "  Dry Run Mode: $DryRun" -ForegroundColor $(if ($DryRun) { "Green" } else { "Yellow" })
Write-Host "  OpenClaw Gateway: http://127.0.0.1:18789" -ForegroundColor Gray
Write-Host "  Ollama: http://127.0.0.1:11434" -ForegroundColor Gray
Write-Host ""
Write-Host "Available Commands:" -ForegroundColor Cyan
Write-Host "  Test connections: .\Start-OpenClaw-Social.ps1 -TestConnections" -ForegroundColor Gray
Write-Host "  Setup check: .\Start-OpenClaw-Social.ps1 -SetupOnly" -ForegroundColor Gray
Write-Host "  Dry run mode: .\Start-OpenClaw-Social.ps1 -DryRun" -ForegroundColor Gray
Write-Host ""
Write-Host "Next Steps:" -ForegroundColor Cyan
Write-Host "  1. Populate credentials: C:\Users\joshl\.openclaw\social-platforms.env" -ForegroundColor Gray
Write-Host "  2. Test API platforms with dry-run mode" -ForegroundColor Gray
Write-Host "  3. Establish browser sessions: python scripts\daemon-login.py" -ForegroundColor Gray
Write-Host "  4. Enable live posting only after explicit approval" -ForegroundColor Gray
Write-Host ""

# Return status object for programmatic use
@{
    Success = $true
    OpenClaw = $openclawOk
    Ollama = $ollamaOk
    Node9020 = $node9020Ok
    NodeT5500 = $nodeT5500Ok
    DryRun = $DryRun
    Timestamp = Get-Date -Format "o"
}
