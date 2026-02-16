# ═══════════════════════════════════════════════════════════════════════════════
# ENIGMA BOOTSTRAP — Paste this into PowerShell (Admin) to install & launch GUI
# One-liner version at bottom for quick copy-paste
# ═══════════════════════════════════════════════════════════════════════════════

# Set execution policy for current session
Set-ExecutionPolicy -ExecutionPolicy Bypass -Scope Process -Force

# Define paths
$opusRoot = "E:\OPUSONLY"
$scriptsDir = "$opusRoot\scripts"
$guiScript = "$scriptsDir\OpusGuiLauncher.ps1"

# Ensure directories exist
@(
    "$opusRoot\config",
    "$opusRoot\logs",
    "$opusRoot\memory",
    "$opusRoot\nodes",
    "$scriptsDir",
    "$scriptsDir\deploy\T5500-Linux",
    "$scriptsDir\deploy\T5500-Windows"
) | ForEach-Object {
    if (-not (Test-Path $_)) {
        New-Item -ItemType Directory -Path $_ -Force | Out-Null
        Write-Host "Created: $_" -ForegroundColor Green
    }
}

# Launch GUI if it exists
if (Test-Path $guiScript) {
    Write-Host "Launching OPUS Control Center..." -ForegroundColor Cyan
    & $guiScript
}
else {
    Write-Host "ERROR: OpusGuiLauncher.ps1 not found at: $guiScript" -ForegroundColor Red
    Write-Host "Please ensure the script exists or download it first." -ForegroundColor Yellow
}

# ═══════════════════════════════════════════════════════════════════════════════
# ONE-LINER BOOTSTRAP (copy this single line into PowerShell):
# ═══════════════════════════════════════════════════════════════════════════════
# Set-ExecutionPolicy Bypass -Scope Process -Force; & "E:\OPUSONLY\scripts\OpusGuiLauncher.ps1"
# ═══════════════════════════════════════════════════════════════════════════════
