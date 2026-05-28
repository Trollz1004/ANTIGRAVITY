# YouAndINotAI Support Bot Setup Script
# Run from D:\support-claw\ with: powershell -ExecutionPolicy Bypass -File setup.ps1

$ErrorActionPreference = "Stop"
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $ScriptDir

Write-Host "╔════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║  YouAndINotAI Support Bot Setup                           ║" -ForegroundColor Cyan
Write-Host "║  Location: D:\support-claw\                              ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan

# Step 1: Check Python
Write-Host "`n[1/5] Checking Python 3.9+..." -ForegroundColor Yellow
python --version 2>$null | Select-String "3\.[9]|3\.1[0-9]" | Out-Null
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Python 3.9+ required" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Python OK" -ForegroundColor Green

# Step 2: Create directories
Write-Host "`n[2/5] Creating directories..." -ForegroundColor Yellow
@("logs", "state", "data") | ForEach-Object {
    if (-not (Test-Path $_)) {
        New-Item -ItemType Directory -Path $_ -Force | Out-Null
        Write-Host "   ✓ $_" -ForegroundColor Gray
    }
}

# Step 3: Install dependencies
Write-Host "`n[3/5] Installing dependencies..." -ForegroundColor Yellow
pip install -q -r requirements.txt
Write-Host "✅ Dependencies installed" -ForegroundColor Green

# Step 4: Create .env if missing
Write-Host "`n[4/5] Checking configuration..." -ForegroundColor Yellow
if (-not (Test-Path ".env")) {
    Write-Host "   ⚠️  .env template exists (verify settings)" -ForegroundColor Yellow
} else {
    Write-Host "   ✓ .env exists" -ForegroundColor Green
}

# Step 5: Test Ollama connection
Write-Host "`n[5/5] Testing Ollama connection to Sabretooth (192.168.0.8:11434)..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://192.168.0.8:11434/api/tags" -TimeoutSec 5 -ErrorAction Stop
    if ($response.StatusCode -eq 200) {
        Write-Host "✅ Ollama reachable on Sabretooth" -ForegroundColor Green
    }
} catch {
    Write-Host "⚠️  Ollama not responding (will fail at runtime if not available)" -ForegroundColor Yellow
    Write-Host "    Make sure Ollama is running on Sabretooth" -ForegroundColor Gray
}

# Summary
Write-Host "`n╔════════════════════════════════════════════════════════════╗" -ForegroundColor Green
Write-Host "║                   ✅ Setup Complete!                        ║" -ForegroundColor Green
Write-Host "╚════════════════════════════════════════════════════════════╝" -ForegroundColor Green

Write-Host "`n🚀 Start the bot:" -ForegroundColor Cyan
Write-Host "   python bot.py" -ForegroundColor White

Write-Host "`n📍 API Endpoints:" -ForegroundColor Cyan
Write-Host "   POST http://127.0.0.1:8765/api/support/ask" -ForegroundColor White
Write-Host "   GET  http://127.0.0.1:8765/api/support/status" -ForegroundColor White
Write-Host "   GET  http://127.0.0.1:8765/health" -ForegroundColor White

Write-Host "`n💾 Database:" -ForegroundColor Cyan
Write-Host "   SQLite: state/support.db" -ForegroundColor White
Write-Host "   Logs:   logs/support.log" -ForegroundColor White

Write-Host "`n📖 FAQ:" -ForegroundColor Cyan
Write-Host "   Edit data/faq.json to add/modify answers" -ForegroundColor White

Write-Host "`n⚡ Gemini Integration:" -ForegroundColor Cyan
Write-Host "   Set GEMINI_API_KEY in .env for fallback" -ForegroundColor White
Write-Host "   See GEMINI_CLI.md for Sabretooth setup" -ForegroundColor White

Write-Host ""
