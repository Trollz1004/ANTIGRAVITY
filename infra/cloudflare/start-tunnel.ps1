# Start Cloudflare Tunnel for remote access to Paperclip HQ
# Run on SABRETOOTH to expose localhost:3100 as paperclip-hq.youandinotai.com
# Access from Chromebook, phone, or any browser — anywhere.
#
# PREREQUISITES:
#   1. cloudflared installed: winget install Cloudflare.cloudflared
#   2. Tunnel created (already done — ID: c7bc9665-3923-4977-acd7-2033838cd56e)
#   3. DNS CNAME configured in Cloudflare dashboard (see below)
#   4. Paperclip HQ running on localhost:3100

$TunnelId = "c7bc9665-3923-4977-acd7-2033838cd56e"
$ConfigPath = "C:\ANTIGRAVITY\infra\cloudflare\paperclip-hq.yml"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  ANTIGRAVITY Cloudflare Tunnel" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if cloudflared exists
if (-not (Get-Command cloudflared -ErrorAction SilentlyContinue)) {
    Write-Host "cloudflared not found. Installing..." -ForegroundColor Yellow
    winget install Cloudflare.cloudflared
    Write-Host "Restart this script after install." -ForegroundColor Yellow
    exit 1
}

# Check if Paperclip is running
try {
    $response = Invoke-WebRequest -Uri "http://127.0.0.1:3100" -TimeoutSec 3 -ErrorAction Stop
    Write-Host "[OK] Paperclip HQ is running on :3100" -ForegroundColor Green
} catch {
    Write-Host "[WARN] Paperclip HQ not detected on :3100" -ForegroundColor Yellow
    Write-Host "       Start it first: .\scripts\start-paperclip.ps1" -ForegroundColor Yellow
    Write-Host "       Continuing anyway (tunnel will retry)..." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Tunnel routes:" -ForegroundColor Gray
Write-Host "  paperclip-hq.youandinotai.com -> localhost:3100 (Paperclip HQ)" -ForegroundColor White
Write-Host ""
Write-Host "Access from ANY device:" -ForegroundColor Green
Write-Host "  https://paperclip-hq.youandinotai.com" -ForegroundColor White
Write-Host ""
Write-Host "Starting tunnel..." -ForegroundColor Cyan

cloudflared tunnel --config $ConfigPath run $TunnelId
