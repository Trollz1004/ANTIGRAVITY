# ═══════════════════════════════════════════════════════════════════════════════
# ENIGMA — Stop DateApp Windows Services
# Location: E:\ANTIGRAVITY\scripts\deploy\T5500-Windows\Stop-DateAppServices.ps1
# Author: ENIGMA
# ═══════════════════════════════════════════════════════════════════════════════

#Requires -RunAsAdministrator

Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host " ENIGMA — Stopping DateApp Services" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan

$services = @(
    "DateAppBackend",
    "DateAppMarketing",
    "DateAppAI"
)

foreach ($svc in $services) {
    $service = Get-Service -Name $svc -ErrorAction SilentlyContinue
    if ($service) {
        if ($service.Status -eq "Running") {
            Write-Host "⏹️  Stopping $svc..." -ForegroundColor Yellow
            Stop-Service -Name $svc -Force
            Write-Host "   ✅ Stopped" -ForegroundColor Green
        }
        else {
            Write-Host "⏸️  $svc is not running" -ForegroundColor Gray
        }
    }
    else {
        Write-Host "❓ $svc not found" -ForegroundColor Gray
    }
}

# Stop Docker containers if they exist
Write-Host "`nStopping Docker containers..." -ForegroundColor Cyan
$docker = Get-Command docker -ErrorAction SilentlyContinue
if ($docker) {
    docker stop dateapp-postgres dateapp-redis dateapp-ollama 2>$null
    Write-Host "   ✅ Docker containers stopped" -ForegroundColor Green
}

Write-Host "`n✅ All DateApp services stopped." -ForegroundColor Green
