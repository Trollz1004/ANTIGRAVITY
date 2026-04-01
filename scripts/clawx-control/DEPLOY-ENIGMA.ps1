# DEPLOY-DATEAPP.ps1
# 1-Click deployment for the Enigma Agent (Gronk AI)

$repoRoot = "C:\ANTIGRAVITY"
$enigmaDir = "$repoRoot\CodeX\enigma"

Write-Host "🚀 Launching Enigma Agent (Gronk AI)..." -ForegroundColor Cyan

if (-not (Test-Path $enigmaDir)) {
    Write-Error "Enigma directory not found at $enigmaDir"
    exit
}

Set-Location $enigmaDir

Write-Host "🐳 Building and starting Docker containers..." -ForegroundColor Yellow
docker-compose up --build -d

Write-Host "✅ Deployment successful!" -ForegroundColor Green
Write-Host "Agent API running at http://localhost:8011/api/status" -ForegroundColor Cyan
Write-Host ""
pause
