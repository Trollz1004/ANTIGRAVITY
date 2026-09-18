# ============================================================
# GROK BOOTSTRAP FOR 9020 NODE - FULL AGENTIC ENVIRONMENT (v3)
# Hardware: i7 + 32GB + 1050 Ti | Role: Support + Marketing
# Run as Administrator on 9020. Save as .ps1 and execute the file.
# ============================================================

param([switch]$SkipDocker, [switch]$SkipRepoClone)

$ErrorActionPreference = "Continue"
$LogPath = "E:\ANTIGRAVITY\logs\bootstrap-grok-9020-$(Get-Date -Format 'yyyyMMdd-HHmmss').log"
$RepoPath = "E:\ANTIGRAVITY"

New-Item -ItemType Directory -Path "E:\ANTIGRAVITY\logs" -Force | Out-Null

function Write-Log {
    param([string]$Message, [string]$Level = "INFO")
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $line = "[$timestamp] [$Level] $Message"
    Add-Content -Path $LogPath -Value $line
    Write-Host $line
}

# Force execution policy early and hard (fixes the Activate.ps1 + profile issues)
try {
    Set-ExecutionPolicy Bypass -Scope LocalMachine -Force -ErrorAction SilentlyContinue
    Set-ExecutionPolicy Bypass -Scope Process -Force -ErrorAction SilentlyContinue
} catch {}

function Test-Admin {
    $currentUser = [Security.Principal.WindowsIdentity]::GetCurrent()
    $principal = New-Object Security.Principal.WindowsPrincipal($currentUser)
    return $principal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
}

Write-Log "=== GROK 9020 BOOTSTRAP STARTED (v3) ===" "START"
Write-Log "Node Role: Support + Marketing sandbox (i7 + 32GB + 1050 Ti)"

if (-not (Test-Admin)) {
    Write-Log "ERROR: Run this .ps1 file as Administrator (not by pasting)." "ERROR"
    exit 1
}

# 1. Chocolatey
if (-not (Get-Command choco -ErrorAction SilentlyContinue)) {
    Write-Log "Installing Chocolatey..."
    try {
        [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072
        Invoke-Expression ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))
        Write-Log "Chocolatey installed."
    } catch {
        Write-Log "Chocolatey warning: $($_.Exception.Message)" "WARN"
    }
} else {
    Write-Log "Chocolatey already present."
}

$env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")

# 2. Core tools
$packages = @("git", "python", "nodejs-lts", "curl", "7zip", "vscode")
foreach ($pkg in $packages) {
    Write-Log "Installing/Verifying $pkg..."
    try {
        choco install $pkg -y --no-progress 2>&1 | Out-Null
        Write-Log "$pkg ready."
    } catch {
        Write-Log "Warning on $pkg : $($_.Exception.Message)" "WARN"
    }
}

# 3. Git
try {
    git config --global user.name "Joshua Coleman (9020)"
    git config --global user.email "joshlcoleman@gmail.com"
    git config --global core.autocrlf false
} catch {
    Write-Log "Git config warning: $($_.Exception.Message)" "WARN"
}

# 4. Repo + aggressive recovery
if (-not $SkipRepoClone) {
    $lock = "$RepoPath\.git\index.lock"
    if (Test-Path $lock) {
        Write-Log "Removing stale git lock..."
        Remove-Item $lock -Force -ErrorAction SilentlyContinue
    }

    if (Test-Path $RepoPath) {
        Write-Log "Repo exists. Pulling latest with recovery..."
        try {
            Push-Location $RepoPath
            git gc --auto 2>$null
            git fetch origin --prune 2>$null
            git checkout main 2>$null
            git pull --ff-only 2>&1 | ForEach-Object { Write-Log $_ }
            Write-Log "Repo updated."
            Pop-Location
        } catch {
            Write-Log "Pull warning (continuing): $($_.Exception.Message)" "WARN"
            Pop-Location -ErrorAction SilentlyContinue
        }
    } else {
        Write-Log "Cloning ANTIGRAVITY..."
        git clone https://github.com/Trollz1004/ANTIGRAVITY.git $RepoPath
    }
}

# 5. Date app Python env (very tolerant)
$backendPath = Join-Path $RepoPath "backend\fastapi-app"
if (Test-Path $backendPath) {
    Write-Log "Preparing date app Python environment..."
    try {
        Push-Location $backendPath
        if (-not (Test-Path ".venv")) { python -m venv .venv }
        & ".\.venv\Scripts\Activate.ps1" 2>$null
        pip install --upgrade pip --quiet 2>$null
        if (Test-Path "requirements.txt") {
            pip install -r requirements.txt --ignore-installed 2>&1 | Out-Null
        }
        Write-Log "Date app backend Python env ready."
        Pop-Location
    } catch {
        Write-Log "Python env warning: $($_.Exception.Message)" "WARN"
        Pop-Location -ErrorAction SilentlyContinue
    }
}

# 6. Docker
if (-not $SkipDocker) {
    if (Get-Command docker -ErrorAction SilentlyContinue) {
        Write-Log "Docker present."
        try {
            $info = docker info 2>&1
            if ($info -match "Server") {
                Write-Log "Docker daemon reachable."
            } else {
                Write-Log "Docker Desktop not running." "WARN"
            }
        } catch {
            Write-Log "Docker check warning: $($_.Exception.Message)" "WARN"
        }
    } else {
        Write-Log "Docker not found in PATH." "WARN"
    }
}

# 7. Hermes reference
if (Test-Path "E:\ANTIGRAVITY\hermes-config.json") {
    try {
        Copy-Item "E:\ANTIGRAVITY\hermes-config.json" "$env:USERPROFILE\hermes-config-reference.json" -Force
        Write-Log "Hermes reference copied."
    } catch {
        Write-Log "Hermes reference warning: $($_.Exception.Message)" "WARN"
    }
}

Write-Log "=== 9020 BOOTSTRAP COMPLETE ===" "SUCCESS"
Write-Log "Log: $LogPath"
Write-Log ""
Write-Log "NEXT STEPS (manual):"
Write-Log "1. Put real keys in the proper .env files."
Write-Log "2. For Hermes: set up ~/.hermes/.env in WSL if needed."
Write-Log "3. Test backend: cd $RepoPath\backend\fastapi-app ; .\.venv\Scripts\Activate.ps1 ; uvicorn app.main:app --reload"
Write-Log "Re-run this script anytime."

Write-Host "`nPress any key to exit..." -ForegroundColor Yellow
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")