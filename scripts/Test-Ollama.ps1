# ═══════════════════════════════════════════════════════════════════════════════
# ENIGMA — Test Ollama (Local LLM)
# Location: E:\OPUSONLY\scripts\Test-Ollama.ps1
# Author: ENIGMA
# Tests Ollama connectivity and available models
# ═══════════════════════════════════════════════════════════════════════════════

param(
    [switch]$TestGeneration,
    [string]$Model = "llama3.2",
    [string]$Prompt = "Say hello in exactly 5 words."
)

$logDir = "E:\OPUSONLY\logs"
$logFile = Join-Path $logDir "ollama-test-$(Get-Date -Format 'yyyyMMdd').log"

function Write-Log {
    param([string]$Message)
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $entry = "[$timestamp] $Message"
    Add-Content -Path $logFile -Value $entry -ErrorAction SilentlyContinue
}

Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host " ENIGMA — Ollama Health Check" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan

$baseUrl = "http://localhost:11434"
$allPassed = $true

# ─────────────────────────────────────────────────────────────────
# TEST 1: API Reachability
# ─────────────────────────────────────────────────────────────────
Write-Host "`n[1/4] Testing API connection..." -ForegroundColor White
try {
    $tagsResponse = Invoke-RestMethod -Uri "$baseUrl/api/tags" -TimeoutSec 10
    Write-Host "     ✅ Ollama API is reachable at $baseUrl" -ForegroundColor Green
    Write-Log "API check: PASSED"
}
catch {
    Write-Host "     ❌ Cannot reach Ollama at $baseUrl" -ForegroundColor Red
    Write-Host "        Error: $($_.Exception.Message)" -ForegroundColor Red
    Write-Log "API check: FAILED - $($_.Exception.Message)"
    $allPassed = $false
}

# ─────────────────────────────────────────────────────────────────
# TEST 2: List Models
# ─────────────────────────────────────────────────────────────────
Write-Host "`n[2/4] Checking available models..." -ForegroundColor White
try {
    $tagsResponse = Invoke-RestMethod -Uri "$baseUrl/api/tags" -TimeoutSec 10
    $models = $tagsResponse.models
    
    if ($models -and $models.Count -gt 0) {
        Write-Host "     ✅ Found $($models.Count) model(s):" -ForegroundColor Green
        foreach ($m in $models) {
            $size = if ($m.size) { "{0:N0} MB" -f ($m.size / 1MB) } else { "unknown" }
            Write-Host "        • $($m.name) ($size)" -ForegroundColor Gray
        }
        Write-Log "Models check: PASSED - $($models.Count) models found"
    }
    else {
        Write-Host "     ⚠️  No models installed" -ForegroundColor Yellow
        Write-Host "        Run: ollama pull llama3.2" -ForegroundColor Yellow
        Write-Log "Models check: WARNING - no models"
    }
}
catch {
    Write-Host "     ❌ Failed to list models" -ForegroundColor Red
    Write-Log "Models check: FAILED"
    $allPassed = $false
}

# ─────────────────────────────────────────────────────────────────
# TEST 3: Check Target Model
# ─────────────────────────────────────────────────────────────────
Write-Host "`n[3/4] Checking for target model ($Model)..." -ForegroundColor White
$modelFound = $false
if ($tagsResponse -and $tagsResponse.models) {
    foreach ($m in $tagsResponse.models) {
        if ($m.name -like "$Model*") {
            $modelFound = $true
            Write-Host "     ✅ Model '$Model' is available" -ForegroundColor Green
            Write-Log "Target model check: PASSED"
            break
        }
    }
}

if (-not $modelFound) {
    Write-Host "     ⚠️  Model '$Model' not found" -ForegroundColor Yellow
    Write-Host "        Run: ollama pull $Model" -ForegroundColor Yellow
    Write-Log "Target model check: WARNING - $Model not found"
}

# ─────────────────────────────────────────────────────────────────
# TEST 4: Generation Test (optional)
# ─────────────────────────────────────────────────────────────────
Write-Host "`n[4/4] Testing text generation..." -ForegroundColor White
if ($TestGeneration -and $modelFound) {
    try {
        $body = @{
            model  = $Model
            prompt = $Prompt
            stream = $false
        } | ConvertTo-Json
        
        Write-Host "     Sending prompt to $Model..." -ForegroundColor Gray
        $startTime = Get-Date
        
        $genResponse = Invoke-RestMethod -Uri "$baseUrl/api/generate" -Method Post -Body $body -ContentType "application/json" -TimeoutSec 120
        
        $elapsed = (Get-Date) - $startTime
        
        if ($genResponse.response) {
            Write-Host "     ✅ Generation successful (${elapsed:N1}s)" -ForegroundColor Green
            Write-Host "        Response: $($genResponse.response)" -ForegroundColor Cyan
            Write-Log "Generation test: PASSED in $($elapsed.TotalSeconds)s"
        }
        else {
            Write-Host "     ⚠️  Empty response from model" -ForegroundColor Yellow
            Write-Log "Generation test: WARNING - empty response"
        }
    }
    catch {
        Write-Host "     ❌ Generation failed: $($_.Exception.Message)" -ForegroundColor Red
        Write-Log "Generation test: FAILED - $($_.Exception.Message)"
        $allPassed = $false
    }
}
elseif ($TestGeneration) {
    Write-Host "     ⏭️  Skipped (model not available)" -ForegroundColor Gray
}
else {
    Write-Host "     ⏭️  Skipped (use -TestGeneration to enable)" -ForegroundColor Gray
}

# ─────────────────────────────────────────────────────────────────
# SUMMARY
# ─────────────────────────────────────────────────────────────────
Write-Host "`n═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
if ($allPassed) {
    Write-Host " ✅ ALL CHECKS PASSED — Ollama is healthy" -ForegroundColor Green
    Write-Log "Overall: PASSED"
}
else {
    Write-Host " ⚠️  SOME CHECKS FAILED — See above for details" -ForegroundColor Yellow
    Write-Log "Overall: FAILED"
}
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host " Log: $logFile" -ForegroundColor Gray
