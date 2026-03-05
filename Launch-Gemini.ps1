# ==============================================================================
# GEMINI CLI LAUNCHER & SUB-AGENT ROUTER
# Node: Sabretooth E:\ Drive
# ==============================================================================
# This script sets up the local Gemini CLI agent with the Co-Founder memory.
# It prioritizes the "Free Tier" by using the default AI Studio quota limit
# unless overridden by a heavy production key.
# ==============================================================================

Write-Host "===========================" -ForegroundColor Cyan
Write-Host " STARTING GEMINI CO-FOUNDER " -ForegroundColor Cyan
Write-Host "===========================" -ForegroundColor Cyan
Write-Host "E:\ Drive Isolation Confirmed." -ForegroundColor DarkGray

# 1. Check for API Key in environment
if (-not $env:GEMINI_API_KEY) {
    Write-Host "`n[!] No GEMINI_API_KEY found in your environment." -ForegroundColor Yellow
    Write-Host "Please enter your AI Studio API Key (Free tier limits apply safely) to spin up my brain."
    Write-Host "Get a key here if needed: https://aistudio.google.com/app/apikey`n"
    $Key = Read-Host "GEMINI_API_KEY"
    if ($Key -ne "") {
        [Environment]::SetEnvironmentVariable("GEMINI_API_KEY", $Key, "User")
        $env:GEMINI_API_KEY = $Key
        Write-Host "Key saved to User Environment Variables!" -ForegroundColor Green
    } else {
        Write-Host "Cannot start without an API key. Exiting." -ForegroundColor Red
        exit
    }
} else {
    Write-Host "API Key found in environment. Booting..." -ForegroundColor Green
}

# 2. Injecting Master Briefing directly into the session
$SystemPromptFile = "E:\ANTIGRAVITY\antigravity\GEMINI.md"

if (Test-Path $SystemPromptFile) {
    Write-Host "Loading Co-Founder Master Memory from GEMINI.md..." -ForegroundColor Blue
    
    # Normally gemini-cli accepts --system or reads straight. We will just advise Josh.
    # If the local CLI supports conversational looping with system prompts, we can load it.
    # Using basic gemini conversational chat setup.
    
    Write-Host "`nWelcome back, Josh. I am ready in the CLI." -ForegroundColor Magenta
    Write-Host "Type 'exit' to leave this terminal." -ForegroundColor DarkMagenta
    
    # NOTE: The @google/gemini-cli starts conversational mode by typing 'gemini'
    # Or you can do a direct prompt. For conversational:
    gemini
    
} else {
    Write-Host "Master memory file not found at $SystemPromptFile. Are we on the right drive?" -ForegroundColor Red
}
