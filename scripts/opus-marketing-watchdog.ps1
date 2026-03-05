# ═══════════════════════════════════════════════════════════════
# OPUS Marketing Watchdog — Node 9020
# Auto-starts Claude Code on boot/power recovery/restart
# Registered in Task Scheduler: "OPUS-Marketing-Watchdog"
# Marketing NEVER stops. If 9020 restarts, Opus resumes immediately.
# ═══════════════════════════════════════════════════════════════

$ErrorActionPreference = "Continue"
$logFile = "C:\Antigravity\data\watchdog-log.txt"

function Write-Log {
    param([string]$msg)
    $ts = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    "$ts | $msg" | Out-File -Append -FilePath $logFile
    Write-Host "[$ts] $msg"
}

# Wait for network and Chrome to be ready
Write-Log "WATCHDOG STARTED — 9020 boot detected"
Write-Log "Waiting 60s for system services and network..."
Start-Sleep -Seconds 60

# Verify we're on 9020
$hostname = $env:COMPUTERNAME
Write-Log "Hostname: $hostname"

# Check if Claude Code is already running
$claude = Get-Process -Name "claude" -ErrorAction SilentlyContinue
if ($claude) {
    Write-Log "Claude Code already running (PID: $($claude.Id)). Exiting watchdog."
    exit 0
}

# Pull latest repo state
Write-Log "Pulling latest from origin/main..."
Set-Location C:\Antigravity
git pull origin main 2>&1 | Out-File -Append -FilePath $logFile

# Launch Chrome with the marketing tab group profile
Write-Log "Launching Chrome (marketing profile)..."
$chromePath = "C:\Program Files\Google\Chrome\Application\chrome.exe"
if (Test-Path $chromePath) {
    Start-Process $chromePath -ArgumentList "--restore-last-session"
    Write-Log "Chrome started — waiting 30s for tabs to load..."
    Start-Sleep -Seconds 30
} else {
    Write-Log "WARNING: Chrome not found at $chromePath"
}

# Start Claude Code in ANTIGRAVITY workspace with marketing resume prompt
Write-Log "Starting Claude Code with marketing auto-resume..."
$resumePrompt = @"
Read @C:\Antigravity\CLAUDE.md. Read your memory files. You are OPUS on 9020 — the SOLE marketing production node. 9020 just restarted or recovered from power loss. Resume marketing operations immediately:
1. Reconnect to MCP Chrome browser tabs (tabs_context_mcp)
2. Check C:\Antigravity\data\marketing-log.md for last activity
3. Continue the marketing cycle: post, comment tags, 5-10 follows per platform, check notifications
4. Marketing NEVER stops. Tags go in comments. OPUS only — no sub-agents.
#ForTheKids
"@

Set-Location C:\Antigravity

# Launch in a new PowerShell window so watchdog can exit
$scriptBlock = @"
Set-Location C:\Antigravity
claude --dangerously-skip-permissions -p '$($resumePrompt -replace "'", "''")'
"@

Start-Process pwsh -ArgumentList "-NoExit", "-Command", $scriptBlock
Write-Log "Claude Code launched. Watchdog complete."
