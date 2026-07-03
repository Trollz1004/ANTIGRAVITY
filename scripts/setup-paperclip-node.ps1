<#
.SYNOPSIS
    Bootstrap Paperclip dual-CEO architecture on any node.
    Run as regular user (NOT admin — Paperclip PG refuses admin SID).

.DESCRIPTION
    Sets up Paperclip instance with dual-CEO (Claude + Hermes), all adapters,
    agent configs, and routines. Works on Sabretooth (:3110) or 9020 (:3120).
    T5500 is gateway-only — no Paperclip.

.PARAMETER Node
    Which node: "sabretooth" or "9020"

.PARAMETER Port
    Paperclip port (default: 3110 for sabretooth, 3120 for 9020)

.PARAMETER RepoRoot
    Repo root path (default: C:\antigravity for sabretooth, D:\dream-online for 9020)

.EXAMPLE
    .\setup-paperclip-node.ps1 -Node sabretooth
    .\setup-paperclip-node.ps1 -Node 9020 -Port 3120 -RepoRoot D:\dream-online
#>

param(
    [Parameter(Mandatory)]
    [ValidateSet("sabretooth", "9020")]
    [string]$Node,

    [int]$Port = 0,

    [string]$RepoRoot = ""
)

$ErrorActionPreference = "Stop"

# --- Defaults per node ---
if ($Port -eq 0) {
    $Port = if ($Node -eq "sabretooth") { 3110 } else { 3120 }
}
if ($RepoRoot -eq "") {
    $RepoRoot = if ($Node -eq "sabretooth") { "C:\antigravity" } else { "D:\dream-online" }
}

$PaperclipUrl = "http://127.0.0.1:$Port"
$LogDir = "$RepoRoot\logs"

Write-Host "=== Paperclip Node Setup: $Node ===" -ForegroundColor Cyan
Write-Host "Port: $Port | Repo: $RepoRoot | URL: $PaperclipUrl"

# --- Step 1: Verify prerequisites ---
Write-Host "`n[1/8] Checking prerequisites..." -ForegroundColor Yellow

$checks = @(
    @{ Name = "Node.js"; Cmd = "node --version" },
    @{ Name = "npm"; Cmd = "npm --version" },
    @{ Name = "npx"; Cmd = "npx --version" },
    @{ Name = "git"; Cmd = "git --version" }
)

foreach ($check in $checks) {
    try {
        $null = Invoke-Expression $check.Cmd 2>$null
        Write-Host "  OK: $($check.Name)" -ForegroundColor Green
    } catch {
        Write-Host "  MISSING: $($check.Name) — install before continuing" -ForegroundColor Red
        exit 1
    }
}

# Check WSL for FCC
$wslCheck = wsl.exe --list --quiet 2>$null
if ($wslCheck -match "Ubuntu") {
    Write-Host "  OK: WSL Ubuntu" -ForegroundColor Green
} else {
    Write-Host "  WARNING: WSL Ubuntu not found — FCC adapter won't work" -ForegroundColor Yellow
    Write-Host "  Run: wsl --install -d Ubuntu" -ForegroundColor Yellow
}

# --- Step 2: Create directories ---
Write-Host "`n[2/8] Creating directories..." -ForegroundColor Yellow
if (-not (Test-Path $LogDir)) { New-Item -ItemType Directory -Path $LogDir -Force | Out-Null }
Write-Host "  Logs: $LogDir"

# --- Step 3: Check if Paperclip is installed ---
Write-Host "`n[3/8] Checking Paperclip installation..." -ForegroundColor Yellow
try {
    $npxResult = npx paperclipai --version 2>$null
    Write-Host "  OK: paperclipai $npxResult" -ForegroundColor Green
} catch {
    Write-Host "  Installing paperclipai..." -ForegroundColor Yellow
    Set-Location $RepoRoot
    npm install -g paperclipai 2>$null
}

# --- Step 4: Check adapter health ---
Write-Host "`n[4/8] Checking adapter health..." -ForegroundColor Yellow

$adapters = @(
    @{ Name = "FCC proxy"; Check = "curl -s http://127.0.0.1:8082/health -o NUL 2>NUL && echo OK || echo DOWN" },
    @{ Name = "Ollama"; Check = "curl -s http://localhost:11434/api/version -o NUL 2>NUL && echo OK || echo DOWN" }
)

if ($Node -eq "sabretooth") {
    $adapters += @{ Name = "Hermes Router (:11435)"; Check = "curl -s http://127.0.0.1:11435/health -o NUL 2>NUL && echo OK || echo DOWN" }
    $adapters += @{ Name = "Hermes Dashboard (:9119)"; Check = "curl -s http://127.0.0.1:9119 -o NUL 2>NUL && echo OK || echo DOWN" }
} else {
    $adapters += @{ Name = "Hermes Router (:11436)"; Check = "curl -s http://127.0.0.1:11436/health -o NUL 2>NUL && echo OK || echo DOWN" }
}

foreach ($adapter in $adapters) {
    $result = cmd /c $adapter.Check 2>$null
    $color = if ($result -match "OK") { "Green" } else { "Red" }
    Write-Host "  $($adapter.Name): $result" -ForegroundColor $color
}

# --- Step 5: Check if Paperclip is running ---
Write-Host "`n[5/8] Checking Paperclip instance..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$PaperclipUrl/api/health" -TimeoutSec 3 -ErrorAction Stop
    Write-Host "  OK: Paperclip running on :$Port" -ForegroundColor Green
} catch {
    Write-Host "  Paperclip not running on :$Port" -ForegroundColor Yellow
    Write-Host "  Start it with: npx paperclipai start --port $Port --host 127.0.0.1" -ForegroundColor Yellow
    Write-Host "  Or use the autostart script: scripts/node-$Node-autostart.bat" -ForegroundColor Yellow
}

# --- Step 6: Display agent configs ---
Write-Host "`n[6/8] Agent configs (from paperclip-tro/)..." -ForegroundColor Yellow

$agentDir = "C:\antigravity\paperclip-tro\agents"
$agents = Get-ChildItem -Path $agentDir -Directory | Where-Object { $_.Name -ne "_template" }

foreach ($agent in $agents) {
    $agentFile = Join-Path $agent.FullName "AGENT.md"
    if (Test-Path $agentFile) {
        $content = Get-Content $agentFile -Raw
        if ($content -match "node:\s*(\S+)") {
            $agentNode = $Matches[1]
            $symbol = if ($agentNode -eq $Node -or $agentNode -eq "9020" -and $Node -eq "9020") { "[+]" } else { "[ ]" }
            Write-Host "  $symbol $($agent.Name) (node: $agentNode)" -ForegroundColor $(if ($symbol -eq "[+]") { "Green" } else { "DarkGray" })
        }
    }
}

# --- Step 7: Display dual-CEO status ---
Write-Host "`n[7/8] Dual-CEO architecture..." -ForegroundColor Yellow
Write-Host "  Claude CEO (ceo): fcc-claude adapter, claude_local" -ForegroundColor Cyan
Write-Host "    Domain: code, compliance, doctrine, payments, merge/push" -ForegroundColor White
Write-Host "    Routines: mission guardian, PR gate, SLA watchdog, doctrine enforcer" -ForegroundColor White
Write-Host "  Hermes CEO (hermes-ceo): hermes adapter, pi_local" -ForegroundColor Cyan
Write-Host "    Domain: growth, support, research, external APIs, leads" -ForegroundColor White
Write-Host "    Routines: pipeline keeper, adapter health, revenue scout, heartbeat audit" -ForegroundColor White

# --- Step 8: Summary ---
Write-Host "`n[8/8] Setup summary..." -ForegroundColor Yellow
Write-Host @"

=== $Node Paperclip Setup Complete ===

Node:         $Node
Paperclip:    $PaperclipUrl
Repo:         $RepoRoot
Agent configs: C:\antigravity\paperclip-tro\agents\
Skills:       C:\antigravity\.agents\skills\ (279 available)
Playbook:     C:\antigravity\paperclip-tro\CEO-PLAYBOOK.md

Next steps:
1. Start Paperclip if not running: npx paperclipai start --port $Port --host 127.0.0.1
2. Get invite token from Joshua (stored in .env as PAPERCLIP_$(($Node).ToUpper())_INVITE)
3. Register CEOs: ceo (fcc-claude) + hermes-ceo (hermes)
4. Hire sub-agents per ROSTER.md
5. Set up routines per CEO-PLAYBOOK.md
6. Verify: both CEOs heartbeat, test issue cycle works

Mission: UNTIL NO KID IN NEED
"@ -ForegroundColor Green
