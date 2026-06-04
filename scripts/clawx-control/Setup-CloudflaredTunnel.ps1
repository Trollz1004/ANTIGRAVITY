# Setup-CloudflaredTunnel.ps1
# Creates a permanent Cloudflare Tunnel exposing OpenClaw (18789) and MCP server (3100)
# Run once as admin: pwsh -ExecutionPolicy Bypass -File scripts\Setup-CloudflaredTunnel.ps1
# Prereq: winget install cloudflare.cloudflared

param(
    [string]$TunnelName = "antigravity",
    [string]$Hostname   = ""   # e.g. mcp.yourantigravity.com — leave blank for trycloudflare (no auth needed)
)

$ErrorActionPreference = "Stop"
$cfDir = "$env:USERPROFILE\.cloudflared"

# --- Install if missing ---
if (-not (Get-Command cloudflared -ErrorAction SilentlyContinue)) {
    Write-Host "Installing cloudflared via winget..."
    winget install --id Cloudflare.cloudflared -e --silent
    $env:PATH += ";$env:ProgramFiles\cloudflared"
}

# --- Quick mode: trycloudflare (no auth, temporary URL, good for testing) ---
if (-not $Hostname) {
    Write-Host "`nStarting TEMPORARY trycloudflare tunnel (URL changes each restart)..."
    Write-Host "For a permanent URL, re-run with -Hostname mcp.yourdomain.com`n"

    Start-Process -FilePath "cloudflared" `
        -ArgumentList "tunnel --url http://127.0.0.1:3100" `
        -WindowStyle Normal
    Start-Sleep 3
    Write-Host "MCP server tunnel started. Check the new window for the https:// URL."
    Write-Host "Add that URL to claude.ai -> Settings -> Integrations -> MCP Servers"
    exit 0
}

# --- Persistent named tunnel (requires cloudflared login first) ---
if (-not (Test-Path "$cfDir\cert.pem")) {
    Write-Host "Authenticating with Cloudflare (browser will open)..."
    cloudflared login
}

# Create tunnel if it doesn't exist
$existing = cloudflared tunnel list --output json 2>$null | ConvertFrom-Json | Where-Object { $_.name -eq $TunnelName }
if (-not $existing) {
    Write-Host "Creating tunnel '$TunnelName'..."
    cloudflared tunnel create $TunnelName
}

$tunnelId = (cloudflared tunnel list --output json 2>$null | ConvertFrom-Json | Where-Object { $_.name -eq $TunnelName }).id

# Write config
$config = @"
tunnel: $tunnelId
credentials-file: $cfDir\$tunnelId.json

ingress:
  # MCP server for claude.ai connector
  - hostname: $Hostname
    service: http://127.0.0.1:3100
  # OpenClaw gateway (optional, add subdomain if needed)
  - service: http_status:404
"@
$configPath = "$cfDir\config.yml"
Set-Content -Path $configPath -Value $config -Encoding UTF8
Write-Host "Config written to $configPath"

# Install as Windows service (runs at boot, no terminal needed)
Write-Host "Installing cloudflared as Windows service..."
cloudflared service install

Write-Host "`nDone! Tunnel '$TunnelName' is running as a service."
Write-Host "MCP URL for claude.ai: https://$Hostname"
Write-Host "Add this in claude.ai -> Settings -> Integrations -> MCP Servers"
