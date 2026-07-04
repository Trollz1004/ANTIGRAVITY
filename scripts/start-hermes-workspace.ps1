# Start Hermes Workspace — Web UI Dashboard on :9119
# Knowledge + Memory management (Obsidian-like) for all agents
# Location: C:\Users\joshl\hermes-workspace

$HERMES_WS = 'C:\Users\joshl\hermes-workspace'

if (-not (Test-Path $HERMES_WS)) {
    Write-Host "ERROR: Hermes Workspace not found at $HERMES_WS" -ForegroundColor Red
    exit 1
}

Write-Host "=== Starting Hermes Workspace Dashboard :9119 ===" -ForegroundColor Cyan

Push-Location $HERMES_WS

# Check if node_modules exists
if (-not (Test-Path 'node_modules')) {
    Write-Host "Installing dependencies..."
    pnpm install 2>&1
}

# Start in dev mode (includes dashboard on :9119)
Write-Host "Starting Hermes dashboard on http://127.0.0.1:9119"
Start-Process -NoNewWindow -FilePath 'pnpm' -ArgumentList 'dev' -RedirectStandardOutput "C:\antigravity\logs\hermes-workspace.log" -RedirectStandardError "C:\antigravity\logs\hermes-workspace-err.log"

Pop-Location

Write-Host "Hermes Workspace running at http://127.0.0.1:9119"
Write-Host "Knowledge base + Memory + Agent management UI"
