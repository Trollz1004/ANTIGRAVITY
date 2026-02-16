# ═══════════════════════════════════════════════════════════════════════════════
# ENIGMA — Test Marketing Engine Health
# Location: E:\OPUSONLY\scripts\Test-Marketing.ps1
# Author: ENIGMA
# Tests marketing engine health and capabilities
# ═══════════════════════════════════════════════════════════════════════════════

param(
    [string]$MarketingHost = "localhost",
    [int]$MarketingPort = 4000
)

$logDir = "E:\OPUSONLY\logs"
$logFile = Join-Path $logDir "health-marketing-$(Get-Date -Format 'yyyyMMdd').log"

function Write-Log {
    param([string]$Message, [string]$Level = "INFO")
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $entry = "[$timestamp] [$Level] $Message"
    Add-Content -Path $logFile -Value $entry -ErrorAction SilentlyContinue
    return $entry
}

function Test-Endpoint {
    param(
        [string]$Name,
        [string]$Url,
        [int]$TimeoutSec = 10
    )
    
    try {
        $startTime = Get-Date
        $response = Invoke-WebRequest -Uri $Url -TimeoutSec $TimeoutSec -UseBasicParsing
        $elapsed = ((Get-Date) - $startTime).TotalMilliseconds
        
        return @{
            Name         = $Name
            Status       = if ($response.StatusCode -eq 200) { "OK" } else { "ERROR" }
            StatusCode   = $response.StatusCode
            ResponseTime = [math]::Round($elapsed, 0)
            Content      = $response.Content
        }
    }
    catch {
        return @{
            Name         = $Name
            Status       = "DOWN"
            StatusCode   = 0
            ResponseTime = 0
            Error        = $_.Exception.Message
        }
    }
}

# Create log directory
if (-not (Test-Path $logDir)) {
    New-Item -ItemType Directory -Path $logDir -Force | Out-Null
}

Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host " ENIGMA — Marketing Engine Health Check" -ForegroundColor Cyan
Write-Host " $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')" -ForegroundColor Gray
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan

$baseUrl = "http://${MarketingHost}:${MarketingPort}"
$allHealthy = $true

Write-Log "Starting marketing engine health check against $baseUrl" "INFO"

# ─────────────────────────────────────────────────────────────────
# Test Endpoints
# ─────────────────────────────────────────────────────────────────
$endpoints = @(
    @{ Name = "Health Check"; Path = "/health" },
    @{ Name = "Root"; Path = "/" },
    @{ Name = "Status"; Path = "/status" }
)

foreach ($ep in $endpoints) {
    Write-Host "`n Checking $($ep.Name)..." -ForegroundColor White -NoNewline
    
    $result = Test-Endpoint -Name $ep.Name -Url "$baseUrl$($ep.Path)"
    
    if ($result.Status -eq "OK") {
        Write-Host " ✅ OK ($($result.ResponseTime)ms)" -ForegroundColor Green
        Write-Log "$($ep.Name): OK ($($result.ResponseTime)ms)" "INFO"
    }
    elseif ($result.Status -eq "DOWN") {
        Write-Host " ❌ DOWN" -ForegroundColor Red
        Write-Host "    Error: $($result.Error)" -ForegroundColor Red
        Write-Log "$($ep.Name): DOWN - $($result.Error)" "ERROR"
        $allHealthy = $false
    }
    else {
        Write-Host " ⚠️  $($result.Status) (HTTP $($result.StatusCode))" -ForegroundColor Yellow
        Write-Log "$($ep.Name): $($result.Status)" "WARN"
        $allHealthy = $false
    }
}

# ─────────────────────────────────────────────────────────────────
# Check if Service is Running (Windows)
# ─────────────────────────────────────────────────────────────────
Write-Host "`n Checking Windows service..." -ForegroundColor White -NoNewline
$service = Get-Service -Name "DateAppMarketing" -ErrorAction SilentlyContinue
if ($service) {
    if ($service.Status -eq "Running") {
        Write-Host " ✅ Running" -ForegroundColor Green
        Write-Log "Windows service: Running" "INFO"
    }
    else {
        Write-Host " ⚠️  $($service.Status)" -ForegroundColor Yellow
        Write-Log "Windows service: $($service.Status)" "WARN"
    }
}
else {
    Write-Host " ⏭️  Not installed as Windows service" -ForegroundColor Gray
}

# ─────────────────────────────────────────────────────────────────
# Check Docker Container
# ─────────────────────────────────────────────────────────────────
Write-Host "`n Checking Docker container..." -ForegroundColor White -NoNewline
$docker = Get-Command docker -ErrorAction SilentlyContinue
if ($docker) {
    $containerStatus = docker inspect --format='{{.State.Status}}' dateapp-marketing 2>$null
    if ($containerStatus -eq "running") {
        Write-Host " ✅ Container running" -ForegroundColor Green
        Write-Log "Docker container: running" "INFO"
    }
    elseif ($containerStatus) {
        Write-Host " ⚠️  Container status: $containerStatus" -ForegroundColor Yellow
        Write-Log "Docker container: $containerStatus" "WARN"
    }
    else {
        Write-Host " ⏭️  Container not found" -ForegroundColor Gray
    }
}
else {
    Write-Host " ⏭️  Docker not available" -ForegroundColor Gray
}

# ─────────────────────────────────────────────────────────────────
# Summary
# ─────────────────────────────────────────────────────────────────
Write-Host "`n═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
if ($allHealthy) {
    Write-Host " ✅ MARKETING ENGINE HEALTHY" -ForegroundColor Green
    Write-Log "Overall: HEALTHY" "INFO"
}
else {
    Write-Host " ⚠️  MARKETING ENGINE HAS ISSUES" -ForegroundColor Yellow
    Write-Log "Overall: UNHEALTHY" "WARN"
}
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host " Log: $logFile" -ForegroundColor Gray
