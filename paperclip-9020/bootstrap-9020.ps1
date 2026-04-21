# bootstrap-9020.ps1 — Local-Only Paperclip (Hermes CEO) for Node 9020
# Run as: Administrator PowerShell 7.5+ on 9020 (192.168.0.5)
#
# What this does:
#   1. Validates prereqs (python, node, docker, git, ollama)
#   2. Clones ANTIGRAVITY repo (or pulls latest)
#   3. Sets up Hermes Python venv + installs hermes CLI
#   4. Starts postgres container on port 5433
#   5. Pulls korpohermes-prime tier-3 fallback model
#   6. Copies agent instruction MDs to Paperclip instance dir
#   7. Copies config JSONs (adapter-allowlist, integrity-watchdog, plugins)
#   8. Stamps SHA-256 baselines
#   9. Creates 9020-specific adapter launchers (claude + codex only)
#  10. Writes .env template and starts Paperclip on port 5555

$ErrorActionPreference = "Stop"

$RepoRoot    = "C:\ANTIGRAVITY"
$InstallRoot = "C:\paperclip-9020"
$HermesVenv  = "$InstallRoot\hermes-venv"
$AgentSource = "$RepoRoot\paperclip-9020\agents\hermes-ceo"
$ConfigSource = "$RepoRoot\paperclip-9020\config"
$CompanyID   = "cbb68f29-9f90-4295-a11f-7f8b928d37bc"
$AgentDir    = "$InstallRoot\instances\default\companies\$CompanyID\agents\hermes-ceo\instructions"

Write-Host @"

  ================================================================
     PAPERCLIP-9020 BOOTSTRAP — Hermes CEO (Local-Only)
  ================================================================
  Node:    9020 (192.168.0.5)
  Mode:    local-only, single agent
  Adapters: claude_local + codex_local (tier-3: korpohermes-prime)
  Ports:   Paperclip 5555 | OpenClaw 4444 | Postgres 5433
  ================================================================

"@ -ForegroundColor Cyan

# ============================
# 1. Prereq checks
# ============================
Write-Host "[1/10] Checking prerequisites..." -ForegroundColor Yellow
function Test-Cmd($name) { [bool](Get-Command $name -ErrorAction SilentlyContinue) }

$missing = @()
if (-not (Test-Cmd "python"))  { $missing += "Python 3.11+ (python.org)" }
if (-not (Test-Cmd "node"))    { $missing += "Node 20+ (nodejs.org)" }
if (-not (Test-Cmd "docker"))  { $missing += "Docker Desktop" }
if (-not (Test-Cmd "git"))     { $missing += "Git" }
if (-not (Test-Cmd "pnpm"))    { $missing += "pnpm (npm install -g pnpm)" }
if (-not (Test-Cmd "ollama"))  { $missing += "Ollama (ollama.com)" }

if ($missing.Count -gt 0) {
    Write-Host "  MISSING:" -ForegroundColor Red
    $missing | ForEach-Object { Write-Host "    - $_" -ForegroundColor Red }
    throw "Install missing prereqs and re-run."
}

$pyVer = (python --version) -replace "Python ",""
$nodeVer = (node --version) -replace "v",""
Write-Host "  Python $pyVer | Node $nodeVer | OK" -ForegroundColor Green

# ============================
# 2. Clone or pull ANTIGRAVITY
# ============================
Write-Host "[2/10] Ensuring ANTIGRAVITY repo is current..." -ForegroundColor Yellow
if (-not (Test-Path "$RepoRoot\.git")) {
    Write-Host "  Cloning from GitHub..."
    git clone https://github.com/Trollz1004/ANTIGRAVITY.git $RepoRoot
} else {
    Push-Location $RepoRoot
    git pull origin main --rebase
    Pop-Location
}
Write-Host "  Repo ready at $RepoRoot" -ForegroundColor Green

# ============================
# 3. Install root + Hermes venv
# ============================
Write-Host "[3/10] Setting up Hermes venv at $HermesVenv..." -ForegroundColor Yellow
if (-not (Test-Path $InstallRoot)) {
    New-Item -ItemType Directory -Path $InstallRoot -Force | Out-Null
}
if (-not (Test-Path $HermesVenv)) {
    python -m venv $HermesVenv
}
& "$HermesVenv\Scripts\pip.exe" install --upgrade pip
& "$HermesVenv\Scripts\pip.exe" install hermes-agent 2>$null
if ($LASTEXITCODE -ne 0) {
    Write-Host "  hermes-agent pip package not found — install from local source if available." -ForegroundColor Magenta
    Write-Host "  If Hermes was installed manually on Sabretooth, copy the venv or wheel." -ForegroundColor Magenta
}

# ============================
# 4. .env template
# ============================
Write-Host "[4/10] Writing .env template..." -ForegroundColor Yellow
$envPath = "$InstallRoot\.env"
if (-not (Test-Path $envPath)) {
    @"
# paperclip-9020 .env — DO NOT COMMIT
# Fill these in BEFORE first start.

# === Node identity ===
PAPERCLIP_NODE=9020
PAPERCLIP_MODE=local-only
PAPERCLIP_PORT=5555
OPENCLAW_PORT=4444

# === Postgres (local container) ===
POSTGRES_HOST=localhost
POSTGRES_PORT=5433
POSTGRES_DB=paperclip9020
POSTGRES_USER=paperclip
POSTGRES_PASSWORD=$(New-Guid)

# === Model APIs (ONLY THESE TWO + tier-3 fallback) ===
ANTHROPIC_API_KEY=sk-ant-PASTE_YOUR_KEY_HERE
CODEX_API_KEY=PASTE_YOUR_KEY_HERE

# === Tier-3 fallback (Ollama korpohermes-prime — local, no API key needed) ===
HERMES_OLLAMA_MODEL=jeffreyvandekorput/korpohermes-prime:latest
HERMES_OLLAMA_ENDPOINT=http://localhost:11434

# === GitHub ===
GITHUB_MCP_SCOPE=trollz1004/antigravity

# === IDs ===
COMPANY_ID=cbb68f29-9f90-4295-a11f-7f8b928d37bc
PROJECT_ID=4e9d37a4-4111-4b74-8ea3-e45b3161f27a
"@ | Set-Content -Path $envPath -Encoding UTF8
    Write-Host "  .env written at $envPath" -ForegroundColor Magenta
    Write-Host "  >>> EDIT THIS FILE WITH REAL KEYS BEFORE STEP 10 <<<" -ForegroundColor Red
} else {
    Write-Host "  .env already exists, not overwriting." -ForegroundColor Green
}

# ============================
# 5. Postgres container
# ============================
Write-Host "[5/10] Starting postgres container (port 5433)..." -ForegroundColor Yellow
$pgRunning = docker ps --filter "name=paperclip9020-pg" --format "{{.Names}}" 2>$null
if ($pgRunning -eq "paperclip9020-pg") {
    Write-Host "  Already running." -ForegroundColor Green
} else {
    # Read password from .env
    $pgPass = (Get-Content $envPath | Select-String "POSTGRES_PASSWORD=(.+)").Matches.Groups[1].Value
    docker run -d `
        --name paperclip9020-pg `
        --restart unless-stopped `
        -e POSTGRES_DB=paperclip9020 `
        -e POSTGRES_USER=paperclip `
        -e "POSTGRES_PASSWORD=$pgPass" `
        -p 5433:5432 `
        -v paperclip9020-data:/var/lib/postgresql/data `
        postgres:16
    Write-Host "  Postgres started on port 5433." -ForegroundColor Green
}

# ============================
# 6. Pull tier-3 fallback model
# ============================
Write-Host "[6/10] Pulling tier-3 fallback: korpohermes-prime..." -ForegroundColor Yellow
ollama pull jeffreyvandekorput/korpohermes-prime:latest
Write-Host "  Model ready." -ForegroundColor Green

# ============================
# 7. Agent registration (copy MDs)
# ============================
Write-Host "[7/10] Registering Hermes CEO agent..." -ForegroundColor Yellow
New-Item -ItemType Directory -Path $AgentDir -Force | Out-Null
Copy-Item -Path "$AgentSource\*.md" -Destination $AgentDir -Force
$mdCount = (Get-ChildItem "$AgentDir\*.md").Count
Write-Host "  Copied $mdCount instruction files to $AgentDir" -ForegroundColor Green

# ============================
# 8. Config + integrity baselines
# ============================
Write-Host "[8/10] Installing config + stamping integrity baselines..." -ForegroundColor Yellow
$configDest = "$InstallRoot\config"
New-Item -ItemType Directory -Path $configDest -Force | Out-Null
Copy-Item "$ConfigSource\adapter-allowlist.json"  "$configDest\" -Force
Copy-Item "$ConfigSource\plugins.json"            "$configDest\" -Force
Copy-Item "$ConfigSource\integrity-watchdog.json" "$configDest\" -Force

$ProtectedFiles = Get-ChildItem "$AgentDir\*.md"
$Baselines = @{}
foreach ($f in $ProtectedFiles) {
    $Baselines[$f.Name] = (Get-FileHash -Algorithm SHA256 -Path $f.FullName).Hash
}
$Baselines | ConvertTo-Json | Set-Content -Path "$configDest\integrity-baselines.json" -Encoding UTF8
Write-Host "  SHA-256 baselines:" -ForegroundColor Green
$Baselines.GetEnumerator() | ForEach-Object { Write-Host "    $($_.Key): $($_.Value.Substring(0,16))..." }

# ============================
# 9. Adapter launchers (9020-specific)
# ============================
Write-Host "[9/10] Creating 9020 adapter launchers..." -ForegroundColor Yellow
$adapterDir = "$InstallRoot\adapters"
New-Item -ItemType Directory -Path $adapterDir -Force | Out-Null

# claude_local — calls Claude CLI from C:\ANTIGRAVITY context
@'
$root = "C:\ANTIGRAVITY"
Set-Location -LiteralPath $root
& "C:\Users\joshl\AppData\Roaming\npm\claude.ps1" @args
if ($LASTEXITCODE -ne $null) { exit $LASTEXITCODE }
'@ | Set-Content "$adapterDir\claude_local.ps1" -Encoding UTF8

# codex_local — calls Codex CLI from C:\ANTIGRAVITY context
@'
$root = "C:\ANTIGRAVITY"
Set-Location -LiteralPath $root
& "C:\Users\joshl\AppData\Roaming\npm\codex.ps1" @args
if ($LASTEXITCODE -ne $null) { exit $LASTEXITCODE }
'@ | Set-Content "$adapterDir\codex_local.ps1" -Encoding UTF8

# hermes_ollama_cloud (tier-3 ONLY) — korpohermes-prime via Ollama
@'
$root = "C:\ANTIGRAVITY"
Set-Location -LiteralPath $root
$env:OLLAMA_HOST = "http://localhost:11434"
ollama run jeffreyvandekorput/korpohermes-prime @args
'@ | Set-Content "$adapterDir\hermes_ollama_cloud.ps1" -Encoding UTF8

Write-Host "  3 adapter launchers written (claude_local, codex_local, hermes_ollama_cloud)" -ForegroundColor Green

# ============================
# 10. Health check + start
# ============================
Write-Host "[10/10] Running health check..." -ForegroundColor Yellow

$health = @{
    postgres  = [bool](docker ps --filter "name=paperclip9020-pg" --format "{{.Names}}" 2>$null)
    ollama    = [bool](ollama list 2>$null | Select-String "korpohermes-prime")
    agentMDs  = (Get-ChildItem "$AgentDir\*.md" -ErrorAction SilentlyContinue).Count -eq 5
    configs   = (Get-ChildItem "$configDest\*.json" -ErrorAction SilentlyContinue).Count -ge 3
    envFile   = Test-Path $envPath
    adapters  = (Get-ChildItem "$adapterDir\*.ps1" -ErrorAction SilentlyContinue).Count -eq 3
}

$allGreen = $true
$health.GetEnumerator() | ForEach-Object {
    $status = if ($_.Value) { "OK" } else { "FAIL"; $script:allGreen = $false }
    $color = if ($_.Value) { "Green" } else { "Red" }
    Write-Host "  $($_.Key): $status" -ForegroundColor $color
}

Write-Host ""
if ($allGreen) {
    Write-Host @"
  ================================================================
     BOOTSTRAP COMPLETE — ALL GREEN
  ================================================================

  Paperclip install:   $InstallRoot
  Agent instructions:  $AgentDir
  Config:              $configDest
  Adapters:            $adapterDir
  Postgres:            localhost:5433

  BEFORE FIRST START:
    1. Edit $envPath with real ANTHROPIC_API_KEY and CODEX_API_KEY
    2. Start Ollama: ollama serve (if not running)
    3. Start Paperclip: cd $InstallRoot && hermes start --port 5555
    4. Verify: http://localhost:5555 shows Hermes CEO
    5. Trigger first heartbeat manually
    6. Hermes files 'online' issue to GitHub — Josh confirms

  To verify later:
    .\bootstrap-9020.ps1 -HealthCheckOnly

"@ -ForegroundColor Green
} else {
    Write-Host "  Some checks failed. Fix the red items and re-run." -ForegroundColor Red
}
