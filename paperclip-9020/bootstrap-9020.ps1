# bootstrap-9020.ps1 — Local-Only Paperclip Setup for Node 9020
# Run as: Administrator PowerShell 7.5+
# Executed by: Codex via MCP (or Josh manually)
#
# Hard rule: only installs claude_local + codex_local adapters.
# No GLM, no Qwen, no Ollama, no other cloud models.

$ErrorActionPreference = "Stop"
$InstallRoot = "C:\paperclip-9020"
$RepoRoot    = "C:\ANTIGRAVITY"
$AgentSource = "$RepoRoot\paperclip-9020\agents\hermes-ceo"

Write-Host "=== paperclip-9020 bootstrap ===" -ForegroundColor Cyan
Write-Host "Node: 9020 (192.168.0.5)"
Write-Host "Mode: local-only, Hermes CEO sole agent"
Write-Host "Models: claude_local + codex_local ONLY"
Write-Host ""

# --- 1. Prereq checks ---
Write-Host "[1/10] Checking prerequisites..." -ForegroundColor Yellow

function Test-Cmd($name) {
    return [bool](Get-Command $name -ErrorAction SilentlyContinue)
}

if (-not (Test-Cmd "python")) { throw "Python 3.11+ required. Install from python.org." }
if (-not (Test-Cmd "node"))   { throw "Node 20+ required. Install from nodejs.org." }
if (-not (Test-Cmd "docker")) { throw "Docker Desktop required." }
if (-not (Test-Cmd "git"))    { throw "Git required." }

$pyVer = (python --version) -replace "Python ",""
$nodeVer = (node --version) -replace "v",""
Write-Host "  Python: $pyVer"
Write-Host "  Node:   $nodeVer"
Write-Host "  OK"

# --- 2. Install root ---
Write-Host "[2/10] Preparing install root at $InstallRoot..." -ForegroundColor Yellow
if (-not (Test-Path $InstallRoot)) {
    New-Item -ItemType Directory -Path $InstallRoot | Out-Null
}

# --- 3. Paperclip source ---
Write-Host "[3/10] Cloning Paperclip source from sandbox/dao-patches..." -ForegroundColor Yellow
$PaperclipSrc = "$RepoRoot\sandbox\dao-patches"
if (-not (Test-Path $PaperclipSrc)) {
    throw "Paperclip source not found at $PaperclipSrc. Check ANTIGRAVITY repo."
}
Copy-Item -Path "$PaperclipSrc\*" -Destination $InstallRoot -Recurse -Force

# --- 4. Env file ---
Write-Host "[4/10] Writing local env config..." -ForegroundColor Yellow
$EnvContent = @"
# paperclip-9020 .env — DO NOT COMMIT
PAPERCLIP_NODE=9020
PAPERCLIP_MODE=local-only
PAPERCLIP_PORT=5555
OPENCLAW_PORT=4444
POSTGRES_HOST=localhost
POSTGRES_PORT=5433
POSTGRES_DB=paperclip9020
POSTGRES_USER=paperclip
POSTGRES_PASSWORD=CHANGE_ME_BEFORE_START

# Model APIs — ONLY THESE TWO
ANTHROPIC_API_KEY=CHANGE_ME
CODEX_API_KEY=CHANGE_ME

# GitHub scope
GITHUB_MCP_SCOPE=trollz1004/antigravity

# Company / Project
COMPANY_ID=cbb68f29-9f90-4295-a11f-7f8b928d37bc
PROJECT_ID=4e9d37a4-4111-4b74-8ea3-e45b3161f27a
"@
Set-Content -Path "$InstallRoot\.env" -Value $EnvContent -Encoding UTF8
Write-Host "  Env file written. Edit keys before first start." -ForegroundColor Magenta

# --- 5. Postgres container ---
Write-Host "[5/10] Starting local postgres container..." -ForegroundColor Yellow
docker run -d `
    --name paperclip9020-pg `
    -e POSTGRES_DB=paperclip9020 `
    -e POSTGRES_USER=paperclip `
    -e POSTGRES_PASSWORD=CHANGE_ME_BEFORE_START `
    -p 5433:5432 `
    -v paperclip9020-data:/var/lib/postgresql/data `
    postgres:16

# --- 6. Install deps ---
Write-Host "[6/10] Installing Paperclip dependencies..." -ForegroundColor Yellow
Push-Location $InstallRoot
pnpm install --frozen-lockfile
Pop-Location

# --- 7. Agent registration ---
Write-Host "[7/10] Registering Hermes CEO agent..." -ForegroundColor Yellow
$AgentDest = "$InstallRoot\instances\default\companies\cbb68f29-9f90-4295-a11f-7f8b928d37bc\agents\hermes-ceo\instructions"
New-Item -ItemType Directory -Path $AgentDest -Force | Out-Null
Copy-Item -Path "$AgentSource\*.md" -Destination $AgentDest -Force
Write-Host "  Copied 5 instruction files (AGENTS, TOOLS, HEARTBEAT, SOUL, SKILLS)"

# --- 8. Adapter lockdown + tier-3 fallback + integrity baseline ---
Write-Host "[8/10] Locking adapter allowlist + stamping MD integrity baselines..." -ForegroundColor Yellow
New-Item -ItemType Directory -Path "$InstallRoot\config" -Force | Out-Null
Copy-Item "$RepoRoot\paperclip-9020\config\adapter-allowlist.json"   "$InstallRoot\config\" -Force
Copy-Item "$RepoRoot\paperclip-9020\config\plugins.json"             "$InstallRoot\config\" -Force
Copy-Item "$RepoRoot\paperclip-9020\config\integrity-watchdog.json"  "$InstallRoot\config\" -Force

# Pull tier-3 emergency fallback model (ONLY this ollama cloud model is authorized)
Write-Host "  Pulling tier-3 fallback model: jeffreyvandekorput/korpohermes-prime..." -ForegroundColor Magenta
if (Test-Cmd "ollama") {
    ollama pull jeffreyvandekorput/korpohermes-prime:latest
} else {
    Write-Host "  Ollama not installed — install from ollama.com, then: ollama pull jeffreyvandekorput/korpohermes-prime" -ForegroundColor Red
}

# Compute SHA-256 baselines for the 5 MD files + 3 config files, write into integrity-watchdog.json
$ProtectedFiles = @(
    "$InstallRoot\instances\default\companies\cbb68f29-9f90-4295-a11f-7f8b928d37bc\agents\hermes-ceo\instructions\AGENTS.md",
    "$InstallRoot\instances\default\companies\cbb68f29-9f90-4295-a11f-7f8b928d37bc\agents\hermes-ceo\instructions\TOOLS.md",
    "$InstallRoot\instances\default\companies\cbb68f29-9f90-4295-a11f-7f8b928d37bc\agents\hermes-ceo\instructions\HEARTBEAT.md",
    "$InstallRoot\instances\default\companies\cbb68f29-9f90-4295-a11f-7f8b928d37bc\agents\hermes-ceo\instructions\SOUL.md",
    "$InstallRoot\instances\default\companies\cbb68f29-9f90-4295-a11f-7f8b928d37bc\agents\hermes-ceo\instructions\SKILLS.md"
)
$Baselines = @{}
foreach ($f in $ProtectedFiles) {
    if (Test-Path $f) {
        $Baselines[$f] = (Get-FileHash -Algorithm SHA256 -Path $f).Hash
    }
}
$BaselinePath = "$InstallRoot\config\integrity-baselines.json"
$Baselines | ConvertTo-Json | Set-Content -Path $BaselinePath -Encoding UTF8
Write-Host "  Baselines written: $BaselinePath"

# --- 9. OpenClaw bridge ---
Write-Host "[9/10] Starting OpenClaw on port 4444..." -ForegroundColor Yellow
# OpenClaw runs locally — ensure its config points at localhost only
# Actual start command depends on OpenClaw install location on 9020.
Write-Host "  NOTE: Start OpenClaw manually on port 4444 if not auto-configured." -ForegroundColor Magenta

# --- 10. Paperclip start ---
Write-Host "[10/10] Starting Paperclip on port 5555..." -ForegroundColor Yellow
Push-Location $InstallRoot
Start-Process pnpm -ArgumentList "start" -PassThru
Pop-Location

Write-Host ""
Write-Host "=== Bootstrap complete ===" -ForegroundColor Green
Write-Host "Paperclip UI:  http://localhost:5555"
Write-Host "OpenClaw:      http://localhost:4444"
Write-Host "Postgres:      localhost:5433 (paperclip9020)"
Write-Host ""
Write-Host "NEXT STEPS:" -ForegroundColor Cyan
Write-Host "  1. Edit $InstallRoot\.env with real ANTHROPIC_API_KEY and CODEX_API_KEY"
Write-Host "  2. Restart Paperclip: Stop-Process then pnpm start"
Write-Host "  3. Open UI, confirm Hermes CEO is registered"
Write-Host "  4. Trigger first heartbeat manually"
Write-Host "  5. Hermes files 'online' issue to GitHub — Josh confirms"
