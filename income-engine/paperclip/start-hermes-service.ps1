# Hermes 24/7 Startup via Task Scheduler (Run as SYSTEM)
# This script starts pm2 daemon and paperclip-3101 service

Write-Host "[Hermes] Starting pm2 daemon..." -ForegroundColor Cyan

# Ensure pm2 daemon is running
pm2 start C:\income-engine\paperclip-server\server.js --name "paperclip-3101" --watch --merge-logs 2>$null

# Wait for startup
Start-Sleep -Seconds 3

# Verify
$health = curl http://localhost:3101/health -ErrorAction SilentlyContinue
if ($health) {
    Write-Host "[Hermes] Service online: http://localhost:3101/health" -ForegroundColor Green
} else {
    Write-Host "[Hermes] Service failed to start" -ForegroundColor Red
    exit 1
}

# Save pm2 list to log
pm2 list | Out-File -Append C:\income-engine\paperclip-data\hermes.log

Write-Host "[Hermes] 24/7 process manager ready" -ForegroundColor Green
