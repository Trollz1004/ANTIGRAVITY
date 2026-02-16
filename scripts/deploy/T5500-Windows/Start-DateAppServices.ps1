# ═══════════════════════════════════════════════════════════════════════════════
# ENIGMA — Start DateApp Windows Services
# Location: E:\OPUSONLY\scripts\deploy\T5500-Windows\Start-DateAppServices.ps1
# Author: ENIGMA
# ═══════════════════════════════════════════════════════════════════════════════

param(
    [switch]$IncludeDocker
)

Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host " ENIGMA — Starting DateApp Services" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan

$logDir = "E:\OPUSONLY\logs"
$logFile = Join-Path $logDir "startup-$(Get-Date -Format 'yyyyMMdd-HHmmss').log"

function Write-Log {
    param([string]$Message)
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $entry = "[$timestamp] $Message"
    Write-Host $entry
    Add-Content -Path $logFile -Value $entry -ErrorAction SilentlyContinue
}

# Create log directory
if (-not (Test-Path $logDir)) {
    New-Item -ItemType Directory -Path $logDir -Force | Out-Null
}

# Start Docker containers first (databases)
if ($IncludeDocker -or (Get-Command docker -ErrorAction SilentlyContinue)) {
    Write-Log "Starting Docker containers..."
    
    $containers = @("dateapp-postgres", "dateapp-redis", "dateapp-ollama")
    foreach ($container in $containers) {
        $status = docker inspect --format='{{.State.Running}}' $container 2>$null
        if ($status -eq "false" -or $LASTEXITCODE -ne 0) {
            docker start $container 2>$null
            if ($LASTEXITCODE -eq 0) {
                Write-Log "   ✅ Started: $container"
            }
        }
        else {
            Write-Log "   ▶️  Already running: $container"
        }
    }
    
    # Wait for databases
    Write-Log "Waiting for databases to be ready..."
    Start-Sleep -Seconds 5
}

# Start Windows services
$services = @(
    "DateAppBackend",
    "DateAppMarketing"
)

foreach ($svc in $services) {
    $service = Get-Service -Name $svc -ErrorAction SilentlyContinue
    if ($service) {
        if ($service.Status -ne "Running") {
            Write-Log "Starting $svc..."
            Start-Service -Name $svc -ErrorAction SilentlyContinue
            Start-Sleep -Seconds 2
            
            $service = Get-Service -Name $svc
            if ($service.Status -eq "Running") {
                Write-Log "   ✅ Started: $svc"
            }
            else {
                Write-Log "   ⚠️  Failed to start: $svc (Status: $($service.Status))"
            }
        }
        else {
            Write-Log "   ▶️  Already running: $svc"
        }
    }
    else {
        Write-Log "   ❓ Service not installed: $svc"
    }
}

# Final status
Write-Host "`n" -NoNewline
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host " SERVICE STATUS" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Get-Service -Name "DateApp*" -ErrorAction SilentlyContinue | Format-Table Name, Status, StartType -AutoSize

Write-Log "Startup sequence complete. Log: $logFile"
