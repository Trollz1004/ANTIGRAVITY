# Manual Cloudflare Tunnel launcher (2026-10-17).
#
# Normal operation: the T5500 keepalive owns cloudflared (stage "tunnel"). It starts it
# at boot/logon and re-creates it if it dies, so you rarely need this file. Use it only to
# bring the connector up by hand.
#
# Live topology (matches C:\Users\joshi\.cloudflared\config.yml):
#   tunnel   : 515b70b2-9730-45af-9691-6e14fd73eff3
#   ingress  : mcp.youandinotai.com -> 127.0.0.1:4747  (the only Paperclip instance)
#   plus the date app (:3200), API (:8000), domains (:9160), dashboard (:9150)
#
# The old values in this file (tunnel c7bc9665-…, config infra\cloudflare\paperclip-hq.yml,
# port 3917) were stale and pointed at a retired instance — do not restore them.

$TunnelId = "515b70b2-9730-45af-9691-6e14fd73eff3"
$ConfigPath = "C:\Users\joshi\.cloudflared\config.yml"
$Cloudflared = "C:\Program Files (x86)\cloudflared\cloudflared.exe"
$Repo = "C:\ANTIGRAVITY"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  ANTIGRAVITY Cloudflare Tunnel" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

if (-not (Test-Path $Cloudflared)) {
    Write-Host "cloudflared not found at $Cloudflared" -ForegroundColor Red
    Write-Host "Install: winget install Cloudflare.cloudflared" -ForegroundColor Yellow
    exit 1
}
if (-not (Test-Path $ConfigPath)) {
    Write-Host "config not found: $ConfigPath" -ForegroundColor Red
    exit 1
}

try {
    $null = Invoke-WebRequest -Uri "http://127.0.0.1:4747/api/health" -UseBasicParsing -TimeoutSec 5
    Write-Host "[OK] Paperclip is running on :4747" -ForegroundColor Green
} catch {
    Write-Host "[WARN] Paperclip not answering on :4747 (tunnel will serve 502 for mcp)" -ForegroundColor Yellow
    Write-Host "       Start it: Start-ScheduledTask -TaskName 'ANTIGRAVITY Paperclip'" -ForegroundColor Yellow
}

$existing = @(Get-CimInstance Win32_Process -Filter "Name='cloudflared.exe'" -ErrorAction SilentlyContinue)
if ($existing.Count -gt 0) {
    Write-Host "[OK] cloudflared already running (PID $($existing[0].ProcessId))" -ForegroundColor Green
    exit 0
}

Write-Host "Starting tunnel $TunnelId ..." -ForegroundColor Cyan
Start-Process -FilePath $Cloudflared `
    -ArgumentList @('tunnel', '--config', $ConfigPath, '--no-autoupdate', '--logfile', (Join-Path $Repo 'logs\cloudflared-t5500.log'), '--loglevel', 'info', 'run') `
    -WindowStyle Hidden
Start-Sleep -Seconds 8
if (@(Get-CimInstance Win32_Process -Filter "Name='cloudflared.exe'" -ErrorAction SilentlyContinue).Count -ge 1) {
    Write-Host "[OK] tunnel connector up" -ForegroundColor Green
} else {
    Write-Host "[FAIL] connector did not start - see logs\cloudflared-t5500.log" -ForegroundColor Red
    exit 1
}
