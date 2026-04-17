# YouAndINotAI Marketing Automation — Windows Launcher
# Run from: E:\DateApp\marketing-automation\
#
# Usage:
#   .\Start-Marketing.ps1              # Start scheduler daemon
#   .\Start-Marketing.ps1 -Seed        # Seed database
#   .\Start-Marketing.ps1 -Memes       # Generate meme images
#   .\Start-Marketing.ps1 -Status      # Show campaign status
#   .\Start-Marketing.ps1 -TestEmail "you@email.com"
#   .\Start-Marketing.ps1 -AddSub "email@test.com" "Josh"
#   .\Start-Marketing.ps1 -Install     # Install Python dependencies

param(
    [switch]$Seed,
    [switch]$Memes,
    [switch]$Status,
    [switch]$Install,
    [string]$TestEmail,
    [string[]]$AddSub
)

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $ScriptDir

Write-Host @"

 ================================================================
  YouAndINotAI Marketing Automation Engine
  Launch: Valentine's Day 2026 (Feb 14)
  No Bots. Real Humans. Real Connections.
 ================================================================

"@ -ForegroundColor Red

# Check Python
$python = Get-Command python -ErrorAction SilentlyContinue
if (-not $python) {
    Write-Host "ERROR: Python not found. Install Python 3.10+ first." -ForegroundColor Red
    exit 1
}

# Install dependencies
if ($Install) {
    Write-Host "Installing Python dependencies..." -ForegroundColor Yellow
    python -m pip install -r requirements.txt
    Write-Host "Done!" -ForegroundColor Green
    exit 0
}

# Route commands
if ($Seed) {
    python main.py --seed
}
elseif ($Memes) {
    python main.py --memes
}
elseif ($Status) {
    python main.py --status
}
elseif ($TestEmail) {
    python main.py --send-test $TestEmail
}
elseif ($AddSub) {
    if ($AddSub.Count -ge 2) {
        python main.py --add-sub $AddSub[0] $AddSub[1]
    } else {
        Write-Host "Usage: -AddSub 'email@test.com' 'FirstName'" -ForegroundColor Yellow
    }
}
else {
    # Default: start the scheduler daemon
    Write-Host "Starting marketing automation scheduler..." -ForegroundColor Green
    Write-Host "Press Ctrl+C to stop." -ForegroundColor Yellow
    Write-Host ""
    python main.py
}
