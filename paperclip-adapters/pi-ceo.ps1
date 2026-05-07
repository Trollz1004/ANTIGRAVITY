$root = "C:\ANTIGRAVITY"
Set-Location -LiteralPath $root

$PI_PATH = "C:\Users\joshl\AppData\Roaming\npm\pi.ps1"

# Primary: glm-5.1:cloud
Write-Host "[pi-ceo] Trying primary model: glm-5.1:cloud"
& $PI_PATH --provider ollama --model glm-5.1:cloud @args
if ($LASTEXITCODE -eq 0) { exit 0 }

# Fallback 1: qwen3-coder:480b-cloud
Write-Host "[pi-ceo] Primary failed, trying fallback: qwen3-coder:480b-cloud"
& $PI_PATH --provider ollama --model qwen3-coder:480b-cloud @args
if ($LASTEXITCODE -eq 0) { exit 0 }

# Fallback 2: gemma4
Write-Host "[pi-ceo] Fallback 1 failed, trying: gemma4"
& $PI_PATH --provider ollama --model gemma4 @args
if ($LASTEXITCODE -eq 0) { exit 0 }

# Final fallback: default pi
Write-Host "[pi-ceo] All cloud models failed, falling back to default pi"
& $PI_PATH @args
