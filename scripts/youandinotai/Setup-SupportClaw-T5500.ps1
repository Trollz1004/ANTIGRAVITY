$repoRoot = "C:\ANTIGRAVITY"
$supportRoot = Join-Path $repoRoot "infra\supportclaw"
$stateDir = Join-Path $supportRoot "state"
$workspaceDir = Join-Path $supportRoot "workspace"
$configTemplate = Join-Path $supportRoot "openclaw.json.example"
$configPath = Join-Path $stateDir "openclaw.json"

New-Item -ItemType Directory -Force -Path $stateDir | Out-Null
New-Item -ItemType Directory -Force -Path (Join-Path $workspaceDir "memory") | Out-Null

if (-not (Test-Path $configPath)) {
    Copy-Item $configTemplate $configPath
    Write-Host "Created $configPath from template. Replace the gateway token placeholder before exposing the service."
}

Push-Location $supportRoot
try {
    docker compose up -d --build
    Write-Host "SupportClaw should be reachable at http://localhost:18895"
} finally {
    Pop-Location
}
