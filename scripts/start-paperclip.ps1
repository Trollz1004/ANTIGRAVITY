# Start Paperclip HQ using external Docker postgres
# Bypasses broken embedded postgres migration issue
# Database: paperclip_hq on Docker postgres (port 5432)

$env:DATABASE_URL = "postgresql://paperclip:paperclip@localhost:5432/paperclip_hq"

Write-Host "Starting Paperclip HQ on localhost:3100..." -ForegroundColor Cyan
Write-Host "Database: $env:DATABASE_URL" -ForegroundColor Gray

paperclipai run
