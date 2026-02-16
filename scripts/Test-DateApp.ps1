# ═══════════════════════════════════════════════════════════════════════════════
# ENIGMA — Test DateApp Health
# Location: E:\OPUSONLY\scripts\Test-DateApp.ps1
# Author: ENIGMA
# Tests all DateApp service health endpoints
# ═══════════════════════════════════════════════════════════════════════════════

param(
    [string]$BackendHost = "localhost",
    [int]$BackendPort = 3000,
    [string]$FrontendHost = "localhost",
    [int]$FrontendPort = 8080,
    [string]$AIHost = "localhost",
    [int]$AIPort = 3002
)

$logDir = "E:\OPUSONLY\logs"
$logFile = Join-Path $logDir "health-dating-$(Get-Date -Format 'yyyyMMdd').log"

function Write-Log {
    param([string]$Message, [string]$Level = "INFO")
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $entry = "[$timestamp] [$Level] $Message"
    Add-Content -Path $logFile -Value $entry -ErrorAction SilentlyContinue
    return $entry
}

function Test-ServiceHealth {
    param(
        [string]$Name,
        [string]$Url,
        [int]$TimeoutSec = 10
    )
    
    try {
        $startTime = Get-Date
        $response = Invoke-WebRequest -Uri $Url -TimeoutSec $TimeoutSec -UseBasicParsing
        $elapsed = ((Get-Date) - $startTime).TotalMilliseconds
        
        if ($response.StatusCode -eq 200) {
            $content = $response.Content | ConvertFrom-Json -ErrorAction SilentlyContinue
            $status = if ($content.status) { $content.status } else { "OK" }
            
            return @{
                Name         = $Name
                Status       = "HEALTHY"
                StatusCode   = $response.StatusCode
                ResponseTime = [math]::Round($elapsed, 0)
                Details      = $status
            }
        }
        else {
            return @{
                Name         = $Name
                Status       = "UNHEALTHY"
                StatusCode   = $response.StatusCode
                ResponseTime = [math]::Round($elapsed, 0)
                Details      = "Unexpected status code"
            }
        }
    }
    catch {
        return @{
            Name         = $Name
            Status       = "DOWN"
            StatusCode   = 0
            ResponseTime = 0
            Details      = $_.Exception.Message
        }
    }
}

# Create log directory
if (-not (Test-Path $logDir)) {
    New-Item -ItemType Directory -Path $logDir -Force | Out-Null
}

Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host " ENIGMA — DateApp Health Check" -ForegroundColor Cyan
Write-Host " $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')" -ForegroundColor Gray
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan

Write-Log "Starting health check" "INFO"

# ─────────────────────────────────────────────────────────────────
# Define Services to Check
# ─────────────────────────────────────────────────────────────────
$services = @(
    @{ Name = "Backend API"; Url = "http://${BackendHost}:${BackendPort}/health" },
    @{ Name = "Frontend"; Url = "http://${FrontendHost}:${FrontendPort}/" },
    @{ Name = "AI Services"; Url = "http://${AIHost}:${AIPort}/health" },
    @{ Name = "Ollama"; Url = "http://localhost:11434/api/tags" }
)

$results = @()
$allHealthy = $true

# ─────────────────────────────────────────────────────────────────
# Check Each Service
# ─────────────────────────────────────────────────────────────────
foreach ($svc in $services) {
    Write-Host "`n Checking $($svc.Name)..." -ForegroundColor White -NoNewline
    
    $result = Test-ServiceHealth -Name $svc.Name -Url $svc.Url
    $results += $result
    
    if ($result.Status -eq "HEALTHY") {
        Write-Host " ✅ $($result.Status)" -ForegroundColor Green
        Write-Host "    Response: $($result.ResponseTime)ms | $($result.Details)" -ForegroundColor Gray
        Write-Log "$($svc.Name): HEALTHY ($($result.ResponseTime)ms)" "INFO"
    }
    elseif ($result.Status -eq "UNHEALTHY") {
        Write-Host " ⚠️  $($result.Status)" -ForegroundColor Yellow
        Write-Host "    Status: $($result.StatusCode) | $($result.Details)" -ForegroundColor Yellow
        Write-Log "$($svc.Name): UNHEALTHY - $($result.Details)" "WARN"
        $allHealthy = $false
    }
    else {
        Write-Host " ❌ $($result.Status)" -ForegroundColor Red
        Write-Host "    Error: $($result.Details)" -ForegroundColor Red
        Write-Log "$($svc.Name): DOWN - $($result.Details)" "ERROR"
        $allHealthy = $false
    }
}

# ─────────────────────────────────────────────────────────────────
# Check Database (if Docker)
# ─────────────────────────────────────────────────────────────────
Write-Host "`n Checking PostgreSQL..." -ForegroundColor White -NoNewline
$docker = Get-Command docker -ErrorAction SilentlyContinue
if ($docker) {
    $pgStatus = docker exec dateapp-postgres pg_isready 2>$null
    if ($LASTEXITCODE -eq 0) {
        Write-Host " ✅ HEALTHY" -ForegroundColor Green
        Write-Log "PostgreSQL: HEALTHY" "INFO"
    }
    else {
        Write-Host " ❌ DOWN or not in Docker" -ForegroundColor Red
        Write-Log "PostgreSQL: DOWN" "ERROR"
        $allHealthy = $false
    }
}
else {
    Write-Host " ⏭️  Skipped (no Docker)" -ForegroundColor Gray
}

Write-Host "`n Checking Redis..." -ForegroundColor White -NoNewline
if ($docker) {
    $redisStatus = docker exec dateapp-redis redis-cli ping 2>$null
    if ($redisStatus -eq "PONG") {
        Write-Host " ✅ HEALTHY" -ForegroundColor Green
        Write-Log "Redis: HEALTHY" "INFO"
    }
    else {
        Write-Host " ❌ DOWN or not in Docker" -ForegroundColor Red
        Write-Log "Redis: DOWN" "ERROR"
        $allHealthy = $false
    }
}
else {
    Write-Host " ⏭️  Skipped (no Docker)" -ForegroundColor Gray
}

# ─────────────────────────────────────────────────────────────────
# Summary
# ─────────────────────────────────────────────────────────────────
Write-Host "`n═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
if ($allHealthy) {
    Write-Host " ✅ ALL SERVICES HEALTHY" -ForegroundColor Green
    Write-Log "Overall: ALL HEALTHY" "INFO"
}
else {
    Write-Host " ⚠️  SOME SERVICES UNHEALTHY" -ForegroundColor Yellow
    Write-Log "Overall: SOME UNHEALTHY" "WARN"
}
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host " Log: $logFile" -ForegroundColor Gray

# Return results for automation
return @{
    Timestamp  = Get-Date -Format "o"
    AllHealthy = $allHealthy
    Services   = $results
}
