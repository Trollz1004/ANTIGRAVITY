# ═══════════════════════════════════════════════════════════════════════════════
# ENIGMA — Start Ollama (Local LLM)
# Location: E:\OPUSONLY\scripts\Start-Ollama.ps1
# Author: ENIGMA
# Runs Ollama in serve mode with auto-restart on failure
# ═══════════════════════════════════════════════════════════════════════════════

param(
    [switch]$Background,
    [switch]$InstallAsService
)

$logDir = "E:\OPUSONLY\logs"
$logFile = Join-Path $logDir "ollama-$(Get-Date -Format 'yyyyMMdd').log"

function Write-Log {
    param([string]$Message)
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $entry = "[$timestamp] $Message"
    Write-Host $entry
    Add-Content -Path $logFile -Value $entry -ErrorAction SilentlyContinue
}

# Create log directory
if (-not (Test-Path $logDir)) {
    New-Item -ItemType Directory -Path $logDir -Force | Out-Null
}

Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host " ENIGMA — Ollama Starter" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan

# Check if Ollama is installed
$ollamaPath = Get-Command ollama -ErrorAction SilentlyContinue
if (-not $ollamaPath) {
    Write-Host "❌ Ollama not found in PATH." -ForegroundColor Red
    Write-Host ""
    Write-Host "Install Ollama from: https://ollama.com/download" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Or run this command in PowerShell (Admin):" -ForegroundColor Yellow
    Write-Host "  winget install Ollama.Ollama" -ForegroundColor Gray
    exit 1
}

Write-Log "Ollama found at: $($ollamaPath.Source)"

# Check if already running
$ollamaProcess = Get-Process -Name "ollama*" -ErrorAction SilentlyContinue
if ($ollamaProcess) {
    Write-Host "⚠️  Ollama is already running (PID: $($ollamaProcess.Id))" -ForegroundColor Yellow
    
    # Test the connection
    try {
        $response = Invoke-RestMethod -Uri "http://localhost:11434/api/tags" -TimeoutSec 5
        Write-Host "✅ Ollama is responding on port 11434" -ForegroundColor Green
        exit 0
    }
    catch {
        Write-Host "   But it's not responding. Killing and restarting..." -ForegroundColor Yellow
        Stop-Process -Name "ollama*" -Force -ErrorAction SilentlyContinue
        Start-Sleep -Seconds 2
    }
}

# Install as Windows service using NSSM
if ($InstallAsService) {
    Write-Host "🔧 Installing Ollama as Windows service..." -ForegroundColor Cyan
    
    $nssm = Get-Command nssm -ErrorAction SilentlyContinue
    if (-not $nssm) {
        Write-Host "❌ NSSM not found. Install with: choco install nssm" -ForegroundColor Red
        exit 1
    }
    
    # Remove existing service
    nssm stop OllamaServe 2>$null
    nssm remove OllamaServe confirm 2>$null
    
    # Install new service
    nssm install OllamaServe $ollamaPath.Source
    nssm set OllamaServe AppParameters "serve"
    nssm set OllamaServe DisplayName "Ollama AI Server"
    nssm set OllamaServe Description "Local LLM server for AI features"
    nssm set OllamaServe Start SERVICE_AUTO_START
    nssm set OllamaServe AppStdout "$logDir\ollama-service.log"
    nssm set OllamaServe AppStderr "$logDir\ollama-service-error.log"
    nssm set OllamaServe AppRotateFiles 1
    nssm set OllamaServe AppExit Default Restart
    nssm set OllamaServe AppRestartDelay 5000
    
    Start-Service OllamaServe
    Write-Host "✅ Ollama installed as Windows service: OllamaServe" -ForegroundColor Green
    Write-Host "   Auto-start enabled. Use: Get-Service OllamaServe" -ForegroundColor Gray
    exit 0
}

# Start Ollama serve
if ($Background) {
    Write-Host "🚀 Starting Ollama in background..." -ForegroundColor Green
    $process = Start-Process -FilePath "ollama" -ArgumentList "serve" -PassThru -WindowStyle Hidden
    Write-Log "Started Ollama serve (PID: $($process.Id))"
    
    # Wait and verify
    Start-Sleep -Seconds 5
    try {
        $response = Invoke-RestMethod -Uri "http://localhost:11434/api/tags" -TimeoutSec 10
        Write-Host "✅ Ollama is running on http://localhost:11434" -ForegroundColor Green
        Write-Host "   PID: $($process.Id)" -ForegroundColor Gray
        Write-Log "Ollama verified running"
    }
    catch {
        Write-Host "⚠️  Ollama started but may need more time to initialize" -ForegroundColor Yellow
    }
}
else {
    Write-Host "🚀 Starting Ollama serve (foreground)..." -ForegroundColor Green
    Write-Host "   Press Ctrl+C to stop" -ForegroundColor Gray
    Write-Log "Starting Ollama serve in foreground"
    
    # Run with auto-restart loop
    while ($true) {
        $startTime = Get-Date
        & ollama serve 2>&1 | Tee-Object -FilePath $logFile -Append
        
        $runtime = (Get-Date) - $startTime
        if ($runtime.TotalSeconds -lt 10) {
            Write-Host "⚠️  Ollama crashed quickly. Waiting 30 seconds before restart..." -ForegroundColor Yellow
            Start-Sleep -Seconds 30
        }
        else {
            Write-Host "⚠️  Ollama stopped. Restarting in 5 seconds..." -ForegroundColor Yellow
            Start-Sleep -Seconds 5
        }
    }
}
