# Start-McpHttpServer.ps1
# Starts the antigravity-sentry MCP server in HTTP mode for claude.ai remote connector
# Runs on port 3100 — expose via cloudflared tunnel for remote access
# Usage: pwsh -File scripts\Start-McpHttpServer.ps1 [-Port 3100] [-AuthToken "yourtoken"]

param(
    [int]$Port = 3100,
    [string]$AuthToken = $env:MCP_AUTH_TOKEN
)

$repoRoot = Split-Path -Parent $PSScriptRoot
$mcpDir   = Join-Path $repoRoot "mcp-server"
$distJs   = Join-Path $mcpDir "dist\index.js"

# Build if dist is missing or source is newer
$srcTs = Join-Path $mcpDir "src\index.ts"
if (-not (Test-Path $distJs) -or (Get-Item $srcTs).LastWriteTime -gt (Get-Item $distJs).LastWriteTime) {
    Write-Host "Building mcp-server..."
    Push-Location $mcpDir
    npm run build
    Pop-Location
}

$env:TRANSPORT       = "http"
$env:MCP_HTTP_PORT   = "$Port"
if ($AuthToken) { $env:MCP_AUTH_TOKEN = $AuthToken }

Write-Host "Starting antigravity-sentry MCP server on http://127.0.0.1:$Port"
Write-Host "Expose with: cloudflared tunnel --url http://127.0.0.1:$Port"

node $distJs
