# ONE-TIME: Create DNS CNAME for the Cloudflare Tunnel
# Run this once to point paperclip-hq.youandinotai.com at the tunnel.
# After this, start-tunnel.ps1 handles everything.

$TunnelId = "c7bc9665-3923-4977-acd7-2033838cd56e"

Write-Host "Creating DNS route for paperclip-hq.youandinotai.com..." -ForegroundColor Cyan

cloudflared tunnel route dns $TunnelId paperclip-hq.youandinotai.com

if ($LASTEXITCODE -eq 0) {
    Write-Host "[DONE] DNS CNAME created." -ForegroundColor Green
    Write-Host "       paperclip-hq.youandinotai.com -> $TunnelId.cfargotunnel.com" -ForegroundColor Gray
    Write-Host ""
    Write-Host "Now run: .\infra\cloudflare\start-tunnel.ps1" -ForegroundColor Cyan
} else {
    Write-Host "[INFO] DNS route may already exist (that's fine)." -ForegroundColor Yellow
    Write-Host "       If this failed, add CNAME manually in Cloudflare dashboard:" -ForegroundColor Yellow
    Write-Host "       Name: paperclip-hq  |  Target: $TunnelId.cfargotunnel.com  |  Proxied: ON" -ForegroundColor White
}
