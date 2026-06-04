# ============================================================
# GROK BOOTSTRAP FOR T5500 - FULL AGENTIC ENVIRONMENT
# Run this as Administrator on T5500
# Purpose: Turn T5500 into a proper node for date app work + Grok/Hermes orchestration
# Self-healing, error resistant, detailed logging
# ============================================================

param(
    [switch]$SkipDocker,
    [switch]$SkipRepoClone
)

$ErrorActionPreference = "Continue"
$LogPath = "C:\antigravity\logs\bootstrap-grok-t5500-$(Get-Date -Format 'yyyyMMdd-HHmmss').log"
$RepoPath = "C:\ANTIGRAVITY"

# Ensure log directory exists
New-Item -ItemType Directory -Path "C:\antigravity\logs" -Force | Out-Null

function Write-Log {
    param([string]$Message, [string]$Level = "INFO")
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $line = "[$timestamp] [$Level] $Message"
    Add-Content -Path $LogPath -Value $line
    Write-Host $line
}

function Test-Admin {
    $currentUser = [Security.Principal.WindowsIdentity]::GetCurrent()
    $principal = New-Object Security.Principal.WindowsPrincipal($currentUser)
    return $principal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
}

Write-Log "=== GROK T5500 BOOTSTRAP STARTED ===" "START"
Write-Log "Running as: $([System.Security.Principal.WindowsIdentity]::GetCurrent().Name)"

if (-not (Test-Admin)) {
    Write-Log "ERROR: This script must be run as Administrator. Exiting." "ERROR"
    exit 1
}

# ============================================================
# 1. Install Chocolatey (if missing)
# ============================================================
if (-not (Get-Command choco -ErrorAction SilentlyContinue)) {
    Write-Log "Installing Chocolatey..."
    try {
        Set-ExecutionPolicy Bypass -Scope Process -Force
        [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072
        Invoke-Expression ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))
        Write-Log "Chocolatey installed successfully."
    } catch {
        Write-Log "Failed to install Chocolatey: $_" "ERROR"
    }
} else {
    Write-Log "Chocolatey already installed."
}

# Refresh environment
$env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")

# ============================================================
# 2. Core Tools Installation
# ============================================================
$packages = @(
    "git",
    "python",
    "nodejs-lts",
    "curl",
    "7zip",
    "vscode"   # Optional but useful
)

foreach ($pkg in $packages) {
    Write-Log "Checking/Installing $pkg..."
    try {
        choco install $pkg -y --no-progress 2>&1 | Out-Null
        Write-Log "$pkg installed or already present."
    } catch {
        Write-Log "Warning during $pkg install: $_" "WARN"
    }
}

# ============================================================
# 3. Git Configuration (basic)
# ============================================================
try {
    git config --global user.name "Joshua Coleman (T5500)"
    git config --global user.email "joshlcoleman@gmail.com"
    git config --global core.autocrlf false
    Write-Log "Git configured."
} catch {
    Write-Log "Git config warning: $_" "WARN"
}

# ============================================================
# 4. Repository Handling (1-repo doctrine)
# ============================================================
if (-not $SkipRepoClone) {
    if (Test-Path $RepoPath) {
        Write-Log "Repo already exists at $RepoPath. Pulling latest..."
        try {
            Push-Location $RepoPath
            git fetch origin
            git checkout main
            git pull --ff-only
            Write-Log "Repo updated successfully."
            Pop-Location
        } catch {
            Write-Log "Repo pull failed: $_" "ERROR"
            Pop-Location -ErrorAction SilentlyContinue
        }
    } else {
        Write-Log "Cloning ANTIGRAVITY repo to $RepoPath..."
        try {
            git clone https://github.com/Trollz1004/ANTIGRAVITY.git $RepoPath
            Write-Log "Repo cloned successfully."
        } catch {
            Write-Log "Clone failed: $_" "ERROR"
        }
    }
}

# ============================================================
# 5. Date App Backend Environment (FastAPI)
# ============================================================
$backendPath = Join-Path $RepoPath "backend\fastapi-app"
if (Test-Path $backendPath) {
    Write-Log "Setting up date app Python environment..."
    try {
        Push-Location $backendPath
        if (-not (Test-Path ".venv")) {
            python -m venv .venv
        }
        & ".\.venv\Scripts\Activate.ps1"
        pip install --upgrade pip
        if (Test-Path "requirements.txt") {
            pip install -r requirements.txt
        }
        Write-Log "Python environment for date app backend ready."
        Pop-Location
    } catch {
        Write-Log "Date app backend setup warning: $_" "WARN"
        Pop-Location -ErrorAction SilentlyContinue
    }
}

# ============================================================
# 6. Docker Check (T5500 already has services)
# ============================================================
if (-not $SkipDocker) {
    if (Get-Command docker -ErrorAction SilentlyContinue) {
        Write-Log "Docker is available."
        try {
            docker ps --format "table {{.Names}}\t{{.Status}}" | Out-String | ForEach-Object { Write-Log $_ }
        } catch {
            Write-Log "Docker is installed but daemon may not be running." "WARN"
        }
    } else {
        Write-Log "Docker not found in PATH. Install Docker Desktop manually if needed for local date app testing." "WARN"
    }
}

# ============================================================
# 7. Hermes Preparation (if relevant on this node)
# ============================================================
$hermesPath = "C:\antigravity\hermes-config.json"
if (Test-Path $hermesPath) {
    Write-Log "Hermes config found at repo root. Copying reference to user profile..."
    try {
        Copy-Item $hermesPath "$env:USERPROFILE\hermes-config-reference.json" -Force
        Write-Log "Hermes reference config copied."
    } catch {
        Write-Log "Could not copy Hermes config: $_" "WARN"
    }
}

# ============================================================
# 8. Final Summary + Self-Healing Notes
# ============================================================
Write-Log "=== BOOTSTRAP COMPLETE ===" "SUCCESS"
Write-Log "Log file saved to: $LogPath"
Write-Log ""
Write-Log "NEXT MANUAL STEPS (you only do these once):"
Write-Log "1. Add your actual API keys to the correct .env files (never commit them)."
Write-Log "2. For Hermes on this node: Configure ~/.hermes/.env in WSL if using WSL Hermes."
Write-Log "3. Test date app backend: cd $RepoPath\backend\fastapi-app ; .\.venv\Scripts\Activate.ps1 ; uvicorn app.main:app --reload"
Write-Log ""
Write-Log "Run this script again anytime to heal/update the environment."

# Keep terminal open
Write-Host "`nPress any key to exit..." -ForegroundColor Yellow
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")