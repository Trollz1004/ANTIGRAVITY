# Start-OpusStack.ps1 - Launches MCP server, tunnel, and Claude Code
# Run from any pwsh 7.5 terminal on 9020

$ErrorActionPreference = 'SilentlyContinue'
Write-Host "`n=== OPUS STACK STARTUP ===" -ForegroundColor Cyan

# Kill stale processes
Get-Process -Name node,cloudflared -ErrorAction SilentlyContinue | Stop-Process -Force
Start-Sleep -Seconds 1

# Start MCP server
Write-Host "[1/3] Starting MCP server..." -ForegroundColor Yellow
$mcp = Start-Process -FilePath node -ArgumentList 'C:\OPUS\mcp-server\server.js' -PassThru -NoNewWindow -RedirectStandardError 'C:\OPUS\mcp-server\mcp-error.log'
Start-Sleep -Seconds 2

# Health check
try {
    $health = Invoke-RestMethod -Uri 'http://localhost:3100/health' -TimeoutSec 3
    Write-Host "  MCP OK (PID $($mcp.Id))" -ForegroundColor Green
} catch {
    Write-Host "  MCP FAILED - check C:\OPUS\mcp-server\mcp-error.log" -ForegroundColor Red
    exit 1
}

# Start tunnel
Write-Host "[2/3] Starting Cloudflare tunnel..." -ForegroundColor Yellow
$tunnelLog = 'C:\OPUS\mcp-server\tunnel.log'
$tunnel = Start-Process -FilePath 'C:\OPUS\mcp-server\cloudflared.exe' `
    -ArgumentList 'tunnel','--url','http://localhost:3100' `
    -PassThru -RedirectStandardError $tunnelLog

# Wait for tunnel URL
$tunnelUrl = $null
for ($i = 0; $i -lt 15; $i++) {
    Start-Sleep -Seconds 1
    $match = Select-String -Path $tunnelLog -Pattern 'https://[^\s]+\.trycloudflare\.com' | Select-Object -First 1
    if ($match) {
        $tunnelUrl = ($match.Matches[0].Value)
        break
    }
}

if ($tunnelUrl) {
    Write-Host "  Tunnel OK (PID $($tunnel.Id))" -ForegroundColor Green
    Write-Host "  URL: $tunnelUrl" -ForegroundColor Cyan
    # Save URL
    $tunnelUrl | Out-File -FilePath 'C:\OPUS\mcp-server\CURRENT_TUNNEL_URL.txt' -Force
    # Update Claude Code MCP config
    claude mcp remove -s user opus-memory 2>$null
    claude mcp add -s user -t sse opus-memory "$tunnelUrl/sse" 2>$null
    Write-Host "  Claude Code MCP updated" -ForegroundColor Green
} else {
    Write-Host "  Tunnel URL not found after 15s - check $tunnelLog" -ForegroundColor Red
}

# Launch info
Write-Host "`n=== READY ===" -ForegroundColor Green
Write-Host "MCP Server:  http://localhost:3100/health"
Write-Host "Tunnel:      $tunnelUrl"
Write-Host "Claude.ai:   Update connector URL to: $tunnelUrl/sse"
Write-Host ""
Write-Host "Launch Claude Code:" -ForegroundColor Yellow
Write-Host "  cd C:\OPUS && claude --permission-mode bypassPermissions" -ForegroundColor White
Write-Host "  cd C:\OPUS && claude -p 'your prompt here'" -ForegroundColor White
Write-Host ""
