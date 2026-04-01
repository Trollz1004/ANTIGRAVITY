# ═══════════════════════════════════════════════════════════════════════════════
# DATE-APP — Windows Service Installation Script
# Installs DateApp backend as Windows services using NSSM
# Location: E:\ANTIGRAVITY\scripts\deploy\T5500-Windows\Install-DateAppServices.ps1
# Author: Joshua Coleman (Trollz1004)
# ═══════════════════════════════════════════════════════════════════════════════

#Requires -RunAsAdministrator

param(
    [string]$DateAppRoot = "C:\DateApp",
    [string]$LogDir = "E:\ANTIGRAVITY\logs"
)

Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host " DATE-APP — DateApp Windows Service Installation" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan

# ─────────────────────────────────────────────────────────────────
# FUNCTIONS
# ─────────────────────────────────────────────────────────────────

function Test-NssmInstalled {
    $nssm = Get-Command nssm -ErrorAction SilentlyContinue
    return $null -ne $nssm
}

function Install-Nssm {
    Write-Host "📦 Installing NSSM via Chocolatey..." -ForegroundColor Yellow
    
    # Check if Chocolatey is installed
    if (-not (Get-Command choco -ErrorAction SilentlyContinue)) {
        Write-Host "   Installing Chocolatey first..." -ForegroundColor Yellow
        Set-ExecutionPolicy Bypass -Scope Process -Force
        [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072
        Invoke-Expression ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))
    }
    
    choco install nssm -y
    
    # Refresh PATH
    $env:Path = [System.Environment]::GetEnvironmentVariable("Path", "Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path", "User")
}

function Install-NodeService {
    param(
        [string]$ServiceName,
        [string]$DisplayName,
        [string]$Description,
        [string]$WorkingDir,
        [string]$Script,
        [int]$Port,
        [hashtable]$EnvVars
    )
    
    Write-Host "`n🔧 Installing service: $ServiceName" -ForegroundColor Green
    
    # Check if service exists
    $existing = Get-Service -Name $ServiceName -ErrorAction SilentlyContinue
    if ($existing) {
        Write-Host "   Service exists. Stopping and removing..." -ForegroundColor Yellow
        nssm stop $ServiceName 2>$null
        nssm remove $ServiceName confirm 2>$null
        Start-Sleep -Seconds 2
    }
    
    # Find node.exe
    $nodePath = (Get-Command node -ErrorAction SilentlyContinue).Source
    if (-not $nodePath) {
        Write-Host "   ❌ Node.js not found in PATH!" -ForegroundColor Red
        return $false
    }
    
    # Install service
    nssm install $ServiceName $nodePath
    nssm set $ServiceName AppParameters $Script
    nssm set $ServiceName AppDirectory $WorkingDir
    nssm set $ServiceName DisplayName $DisplayName
    nssm set $ServiceName Description $Description
    nssm set $ServiceName Start SERVICE_AUTO_START
    nssm set $ServiceName ObjectName LocalSystem
    
    # Logging
    $logFile = Join-Path $LogDir "$ServiceName.log"
    $errFile = Join-Path $LogDir "$ServiceName-error.log"
    nssm set $ServiceName AppStdout $logFile
    nssm set $ServiceName AppStderr $errFile
    nssm set $ServiceName AppRotateFiles 1
    nssm set $ServiceName AppRotateBytes 10485760  # 10MB
    
    # Restart on failure
    nssm set $ServiceName AppExit Default Restart
    nssm set $ServiceName AppRestartDelay 10000  # 10 seconds
    
    # Environment variables
    $envString = ""
    foreach ($key in $EnvVars.Keys) {
        $envString += "$key=$($EnvVars[$key])`n"
    }
    if ($envString) {
        nssm set $ServiceName AppEnvironmentExtra $envString.TrimEnd()
    }
    
    Write-Host "   ✅ Service installed: $ServiceName" -ForegroundColor Green
    return $true
}

# ─────────────────────────────────────────────────────────────────
# MAIN
# ─────────────────────────────────────────────────────────────────

# Check NSSM
if (-not (Test-NssmInstalled)) {
    Install-Nssm
    if (-not (Test-NssmInstalled)) {
        Write-Host "❌ Failed to install NSSM. Please install manually." -ForegroundColor Red
        exit 1
    }
}

# Create log directory
if (-not (Test-Path $LogDir)) {
    New-Item -ItemType Directory -Path $LogDir -Force | Out-Null
}

# ─────────────────────────────────────────────────────────────────
# INSTALL SERVICES
# ─────────────────────────────────────────────────────────────────

# 1. DateApp Backend
$backendEnv = @{
    "NODE_ENV" = "production"
    "PORT" = "3000"
    "DATABASE_URL" = "postgresql://dateapp:CHANGEME@localhost:5432/dateapp"
    "REDIS_URL" = "redis://:CHANGEME@localhost:6379"
    "JWT_SECRET" = "CHANGEME_JWT_SECRET_64_CHARS"
    "API_KEY" = "CHANGEME_API_KEY"
}

Install-NodeService `
    -ServiceName "DateAppBackend" `
    -DisplayName "DateApp Backend API" `
    -Description "YouAndINotAI Dating Platform Backend (Express.js)" `
    -WorkingDir "$DateAppRoot\backend" `
    -Script "server.js" `
    -Port 3000 `
    -EnvVars $backendEnv

# 2. AI Services (if using Node wrapper instead of Python)
# Note: For Python FastAPI, use a different approach below
Write-Host "`n📝 Note: AI Services (Python FastAPI) should be run separately or via Docker" -ForegroundColor Yellow

# 3. Marketing Engine
$marketingEnv = @{
    "NODE_ENV" = "production"
    "PORT" = "4000"
    "DATABASE_URL" = "postgresql://dateapp:CHANGEME@localhost:5432/dateapp"
    "REDIS_URL" = "redis://:CHANGEME@localhost:6379"
    "SMTP_HOST" = ""
    "SMTP_PORT" = "587"
}

# Marketing engine service (if it exists)
$marketingPath = "$DateAppRoot\marketing-engine"
if (Test-Path "$marketingPath\server.js") {
    Install-NodeService `
        -ServiceName "DateAppMarketing" `
        -DisplayName "DateApp Marketing Engine" `
        -Description "YouAndINotAI Marketing & Lead Generation Engine" `
        -WorkingDir $marketingPath `
        -Script "server.js" `
        -Port 4000 `
        -EnvVars $marketingEnv
} else {
    Write-Host "`n⚠️  Marketing engine not found at $marketingPath" -ForegroundColor Yellow
    Write-Host "   Create the marketing-engine project first." -ForegroundColor Yellow
}

# ─────────────────────────────────────────────────────────────────
# POSTGRESQL & REDIS (via Docker Desktop or native install)
# ─────────────────────────────────────────────────────────────────
Write-Host "`n" -NoNewline
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host " DATABASE & CACHE SETUP" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan

# Check Docker
$docker = Get-Command docker -ErrorAction SilentlyContinue
if ($docker) {
    Write-Host "`n📦 Docker found. Creating database containers..." -ForegroundColor Green
    
    # PostgreSQL
    docker run -d `
        --name dateapp-postgres `
        --restart always `
        -e POSTGRES_USER=dateapp `
        -e POSTGRES_PASSWORD=CHANGEME `
        -e POSTGRES_DB=dateapp `
        -p 5432:5432 `
        -v dateapp_postgres:/var/lib/postgresql/data `
        postgres:16-alpine 2>$null
    
    # Redis
    docker run -d `
        --name dateapp-redis `
        --restart always `
        -p 6379:6379 `
        redis:7-alpine redis-server --requirepass CHANGEME 2>$null
    
    Write-Host "   ✅ Database containers created (or already exist)" -ForegroundColor Green
} else {
    Write-Host "`n⚠️  Docker not found. Install PostgreSQL and Redis manually:" -ForegroundColor Yellow
    Write-Host "   - PostgreSQL: https://www.postgresql.org/download/windows/" -ForegroundColor Gray
    Write-Host "   - Redis: Use Memurai (Windows Redis) or Docker Desktop" -ForegroundColor Gray
}

# ─────────────────────────────────────────────────────────────────
# START SERVICES
# ─────────────────────────────────────────────────────────────────
Write-Host "`n" -NoNewline
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host " STARTING SERVICES" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan

$services = @("DateAppBackend", "DateAppMarketing")
foreach ($svc in $services) {
    $s = Get-Service -Name $svc -ErrorAction SilentlyContinue
    if ($s) {
        Start-Service -Name $svc -ErrorAction SilentlyContinue
        Write-Host "   ▶️  Started: $svc" -ForegroundColor Green
    }
}

# ─────────────────────────────────────────────────────────────────
# FINAL STATUS
# ─────────────────────────────────────────────────────────────────
Write-Host "`n" -NoNewline
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host " ✅ INSTALLATION COMPLETE" -ForegroundColor Green
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""
Write-Host " Services installed:" -ForegroundColor White
Get-Service -Name "DateApp*" | Format-Table Name, Status, StartType -AutoSize
Write-Host ""
Write-Host " ⚠️  IMPORTANT: Update environment variables in each service!" -ForegroundColor Yellow
Write-Host "    Use: nssm edit DateAppBackend" -ForegroundColor Yellow
Write-Host ""
Write-Host " Logs: $LogDir" -ForegroundColor White
Write-Host ""
