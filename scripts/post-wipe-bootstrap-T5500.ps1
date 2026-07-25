# =============================================================================
# post-wipe-bootstrap-T5500.ps1
# =============================================================================
# Role  : T5500 — primary orchestrator node
# Run on: Clean Windows install on T5500 ONLY — Run as Administrator
# Goal  : Windows clean-install → full Hermes Workspace GUI + mission-mcp +
#         antigravity-cockpit + cloudflared tunnel + heavier Ollama model set.
#         Zero manual config after this script, except:
#           - hermes auth login (OAuth, ~30 sec)
#           - Tailscale join approval (browser, ~30 sec)
#           - OneDrive Personal Vault unlock (biometric / PIN if prompted)
#           - cloudflared tunnel login (browser, once)
#
# Idempotency: every install is guard-checked. Re-running is safe.
# Credentials: NO values baked in — all from OneDrive vault env file.
# Log file: C:\bootstrap-T5500-YYYYMMDD-HHmmss.log
#
# PowerShell compat: PS 5.1+ (tested on PS 7). Prefer running with PS 7.
# DO NOT install Paperclip in any form.
# =============================================================================

#Requires -RunAsAdministrator

$ErrorActionPreference   = 'Stop'
$ProgressPreference      = 'SilentlyContinue'
$VerbosePreference       = 'Continue'

$logPath = "C:\bootstrap-T5500-$(Get-Date -Format 'yyyyMMdd-HHmmss').log"
Start-Transcript -Path $logPath -Append -Force

function Log-Step { param([string]$Msg, [string]$Color = 'Cyan')
    Write-Host "`n>>> $Msg" -ForegroundColor $Color }

function Log-Ok   { param([string]$Msg)
    Write-Host "    [OK] $Msg" -ForegroundColor Green }

function Log-Skip { param([string]$Msg)
    Write-Host "    [SKIP] $Msg" -ForegroundColor DarkGray }

function Log-Warn { param([string]$Msg)
    Write-Host "    [WARN] $Msg" -ForegroundColor Yellow }

function Log-Fail { param([string]$Msg)
    Write-Host "    [FAIL] $Msg" -ForegroundColor Red }

function Refresh-Path {
    $env:Path = [System.Environment]::GetEnvironmentVariable('Path','Machine') + ';' +
                [System.Environment]::GetEnvironmentVariable('Path','User')
}

function WingetInstall { param([string]$Id, [string]$Label)
    $existing = winget list --id $Id --accept-source-agreements 2>$null | Select-String $Id
    if ($existing) { Log-Skip "$Label already installed"; return }
    Log-Step "Installing $Label via winget..."
    winget install --id $Id --silent --accept-source-agreements --accept-package-agreements -e
    if ($LASTEXITCODE -ne 0) { Log-Warn "$Label install returned exit $LASTEXITCODE" }
    else { Log-Ok "$Label installed" }
}

function Ensure-NssmService {
    param([string]$Name, [string]$Exe, [string]$Args, [hashtable]$Env = @{})
    $svcExists = Get-Service -Name $Name -ErrorAction SilentlyContinue
    if ($svcExists) { Log-Skip "Service '$Name' already registered"; return }
    nssm install $Name $Exe $Args
    foreach ($k in $Env.Keys) { nssm set $Name AppEnvironmentExtra "$k=$($Env[$k])" }
    nssm set $Name Start SERVICE_AUTO_START
    Start-Service -Name $Name -ErrorAction SilentlyContinue
    Log-Ok "Service '$Name' installed and started"
}

Write-Host ""
Write-Host "================================================================" -ForegroundColor Cyan
Write-Host "  ANTIGRAVITY — T5500 PRIMARY NODE BOOTSTRAP" -ForegroundColor Cyan
Write-Host "  Role: Orchestrator (Hermes Workspace + mission-mcp + cockpit)" -ForegroundColor Cyan
Write-Host "================================================================" -ForegroundColor Cyan
Write-Host ""

# ────────────────────────────────────────────────────────────────────────────
# STEP 0  OneDrive prerequisite check
# ────────────────────────────────────────────────────────────────────────────
Log-Step "STEP 0 — OneDrive prerequisite check" 'Magenta'

$oneDrivePath  = "C:\Users\joshl\OneDrive"
$vaultPath     = "C:\Users\joshl\OneDrive\Personal Vault"
$vaultEnvFile  = "$vaultPath\MASTER-UNIVERSAL-ENV-TROLLZ1004.env"
$memorySource  = "C:\Users\joshl\OneDrive\.claude\projects\C--Users-joshl--hermes\memory"

if (-not (Test-Path $oneDrivePath)) {
    Log-Fail "OneDrive not found at $oneDrivePath"
    Write-Host ""
    Write-Host "  ACTION REQUIRED:" -ForegroundColor Red
    Write-Host "  Sign into OneDrive as joshlcoleman@gmail.com." -ForegroundColor Red
    Write-Host "  Wait for initial sync, then re-run this script." -ForegroundColor Red
    Write-Host ""
    Stop-Transcript; exit 1
}
Log-Ok "OneDrive present"

if (-not (Test-Path $vaultEnvFile)) {
    Write-Host ""
    Write-Host "  Personal Vault env file not found: $vaultEnvFile" -ForegroundColor Yellow
    Write-Host "  The Personal Vault may be locked. If so:" -ForegroundColor Yellow
    Write-Host "  1. Open File Explorer → OneDrive → Personal Vault" -ForegroundColor Yellow
    Write-Host "  2. Authenticate (fingerprint / PIN / code)" -ForegroundColor Yellow
    Write-Host "  3. Wait for vault contents to sync" -ForegroundColor Yellow
    Write-Host "  Then re-run this script. Continuing with degraded (no-vault) mode..." -ForegroundColor Yellow
    Write-Host ""
    $vaultAvailable = $false
} else {
    $vaultAvailable = $true
    Log-Ok "Personal Vault env file found"
}

if ($vaultAvailable) {
    Get-Content $vaultEnvFile | Where-Object { $_ -match '^[A-Z_]+=.+' -and $_ -notmatch '^#' } |
        ForEach-Object {
            $kv = $_ -split '=', 2
            [System.Environment]::SetEnvironmentVariable($kv[0].Trim(), $kv[1].Trim(), 'Process')
        }
    Log-Ok "Vault env loaded (values not logged)"
}

# ────────────────────────────────────────────────────────────────────────────
# STEP 1  Chocolatey
# ────────────────────────────────────────────────────────────────────────────
Log-Step "STEP 1 — Chocolatey"

if (Get-Command choco -ErrorAction SilentlyContinue) {
    Log-Skip "Chocolatey already installed"
} else {
    Set-ExecutionPolicy Bypass -Scope Process -Force
    [System.Net.ServicePointManager]::SecurityProtocol = 3072
    Invoke-Expression ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))
    Refresh-Path
    Log-Ok "Chocolatey installed"
}

# ────────────────────────────────────────────────────────────────────────────
# STEP 2  Core dev toolchain
# ────────────────────────────────────────────────────────────────────────────
Log-Step "STEP 2 — Core dev toolchain"

WingetInstall 'Git.Git'                                'Git'
WingetInstall 'OpenJS.NodeJS.LTS'                      'Node.js LTS (22+)'
WingetInstall 'Python.Python.3.11'                     'Python 3.11'
WingetInstall 'GitHub.cli'                             'GitHub CLI (gh)'
WingetInstall 'Microsoft.VisualStudio.2022.BuildTools' 'VS Build Tools 2022'
WingetInstall 'Cloudflare.cloudflared'                 'cloudflared'
WingetInstall 'tailscale.tailscale'                    'Tailscale'
WingetInstall 'Docker.DockerDesktop'                   'Docker Desktop'
WingetInstall 'Microsoft.PowerShell'                   'PowerShell 7'

Refresh-Path

if (-not (Get-Command pnpm -ErrorAction SilentlyContinue)) {
    corepack enable
    corepack prepare pnpm@latest --activate 2>$null
    Refresh-Path
    Log-Ok "pnpm enabled"
} else { Log-Skip "pnpm already available" }

# ────────────────────────────────────────────────────────────────────────────
# STEP 3  Pull ANTIGRAVITY repo
# ────────────────────────────────────────────────────────────────────────────
Log-Step "STEP 3 — ANTIGRAVITY repo"

$antigravityPath = "E:\ANTIGRAVITY"
$repoUrl         = "https://github.com/Trollz1004/ANTIGRAVITY.git"

if (Test-Path "$antigravityPath\.git") {
    Log-Skip "ANTIGRAVITY already cloned"
    Push-Location $antigravityPath
    git pull --rebase origin main
    Pop-Location
    Log-Ok "ANTIGRAVITY refreshed"
} else {
    git clone --branch main $repoUrl $antigravityPath
    Log-Ok "ANTIGRAVITY cloned to $antigravityPath"
}

# ────────────────────────────────────────────────────────────────────────────
# STEP 4  Ollama + models (T5500 heavier model set)
# ────────────────────────────────────────────────────────────────────────────
Log-Step "STEP 4 — Ollama + models (T5500 heavier set)"

WingetInstall 'Ollama.Ollama' 'Ollama'
Refresh-Path

[System.Environment]::SetEnvironmentVariable('OLLAMA_HOST',    '0.0.0.0:11434', 'Machine')
[System.Environment]::SetEnvironmentVariable('OLLAMA_ORIGINS', '*',             'Machine')
$env:OLLAMA_HOST    = '0.0.0.0:11434'
$env:OLLAMA_ORIGINS = '*'
Log-Ok "OLLAMA_HOST=0.0.0.0:11434 (Machine scope)"

$ollamaProc = Get-Process -Name 'ollama' -ErrorAction SilentlyContinue
if (-not $ollamaProc) {
    Start-Process -FilePath 'ollama' -ArgumentList 'serve' -WindowStyle Hidden
    Start-Sleep -Seconds 8
    Log-Ok "ollama serve started"
} else { Log-Skip "ollama serve already running" }

# Lightweight base set (same as helper nodes)
$baseModels = @('gemma2:2b', 'qwen2.5:7b', 'llama3.2:3b', 'nomic-embed-text')
# T5500-only heavier models: cloud-routed / larger
$t5500Models = @(
    'deepseek-v3:7b',       # Local approximation — actual cloud deepseek-v3.1:671b routes via OpenRouter
    'qwen2.5:14b',          # Mid-weight for stronger reasoning on primary node
    'mistral:7b'            # Additional general fallback
)

foreach ($model in ($baseModels + $t5500Models)) {
    $existing = ollama list 2>$null | Select-String ([regex]::Escape($model.Split(':')[0]))
    if ($existing) { Log-Skip "Model $model already pulled"; continue }
    Log-Step "Pulling $model..."
    ollama pull $model
    if ($LASTEXITCODE -ne 0) { Log-Warn "Pull returned $LASTEXITCODE for $model — check 'ollama list'" }
    else { Log-Ok "$model ready" }
}

# Note on cloud models (deepseek-v3.1:671b, glm-4.6:cloud, minimax-m2.5:cloud):
# These are routed via OpenRouter — they don't install locally.
# OpenRouter routing is configured in the hermes-agent YAML (OPENROUTER_API_KEY from vault).
Log-Ok "Cloud model routing (deepseek-v3.1:671b, glm-4.6, minimax-m2.5) handled via OpenRouter — no local pull needed"

# ────────────────────────────────────────────────────────────────────────────
# STEP 5  Hermes Workspace — full install with Electron GUI
# ────────────────────────────────────────────────────────────────────────────
Log-Step "STEP 5 — Hermes Workspace (full GUI + Conductor orchestrator)"

$hwPath      = "C:\Users\joshl\hermes-workspace"
$hwAntiPath  = "E:\ANTIGRAVITY\hermes-workspace"

# Prefer the OneDrive-synced or ANTIGRAVITY-resident copy if already present
if (Test-Path "$hwPath\package.json") {
    Log-Skip "Hermes Workspace already at $hwPath — updating..."
    Push-Location $hwPath
    git pull --rebase origin main 2>$null
    pnpm install --frozen-lockfile 2>$null
    Pop-Location
    Log-Ok "Hermes Workspace updated"
} elseif (Test-Path "$hwAntiPath\package.json") {
    Log-Skip "Hermes Workspace found in ANTIGRAVITY — using that copy at $hwAntiPath"
    Push-Location $hwAntiPath
    pnpm install --frozen-lockfile 2>$null
    Pop-Location
    Log-Ok "Hermes Workspace (ANTIGRAVITY copy) deps installed"
} else {
    $wslavail = Get-Command wsl -ErrorAction SilentlyContinue
    if ($wslavail) {
        wsl -- bash -c "curl -fsSL https://hermes-workspace.com/install.sh | bash"
        if ($LASTEXITCODE -eq 0) { Log-Ok "Hermes Workspace installed via WSL" }
        else {
            Log-Warn "WSL installer failed — cloning repo directly"
            git clone https://github.com/nousresearch/hermes-workspace.git $hwPath
            Push-Location $hwPath; pnpm install; Pop-Location
        }
    } else {
        git clone https://github.com/nousresearch/hermes-workspace.git $hwPath
        Push-Location $hwPath; pnpm install; Pop-Location
        Log-Ok "Hermes Workspace cloned (WSL-less)"
    }
}

# Register Hermes Workspace as a Windows service (auto-start on boot)
$hwServiceName = 'HermesWorkspace'
$hwServiceExe  = (Get-Command node -ErrorAction SilentlyContinue)?.Source
$hwStartScript = if (Test-Path "$hwPath\package.json") { "$hwPath" } else { $hwAntiPath }

if ($hwServiceExe -and (Test-Path "$hwStartScript\package.json")) {
    $nssmAvail = Get-Command nssm -ErrorAction SilentlyContinue
    if (-not $nssmAvail) {
        choco install nssm -y --no-progress 2>$null
        Refresh-Path
        $nssmAvail = Get-Command nssm -ErrorAction SilentlyContinue
    }
    if ($nssmAvail) {
        $svc = Get-Service -Name $hwServiceName -ErrorAction SilentlyContinue
        if (-not $svc) {
            $pnpmExe = (Get-Command pnpm -ErrorAction SilentlyContinue)?.Source
            nssm install $hwServiceName $pnpmExe 'dev'
            nssm set $hwServiceName AppDirectory $hwStartScript
            nssm set $hwServiceName Start SERVICE_AUTO_START
            Start-Service -Name $hwServiceName -ErrorAction SilentlyContinue
            Log-Ok "HermesWorkspace service installed — accessible at http://localhost:3000"
        } else { Log-Skip "HermesWorkspace service already registered" }
    } else { Log-Warn "NSSM unavailable — start Hermes Workspace manually: cd $hwStartScript && pnpm dev" }
}

# ────────────────────────────────────────────────────────────────────────────
# STEP 6  Hermes Agent CLI + preserved YAML config
# ────────────────────────────────────────────────────────────────────────────
Log-Step "STEP 6 — Hermes Agent CLI + preserved YAML config"

$hermesConfigBriefing = "E:\ANTIGRAVITY\briefings\HERMES-AGENT-WORKING-CONFIG-2026-05-12.md"

if (Get-Command hermes -ErrorAction SilentlyContinue) {
    Log-Skip "hermes CLI already installed"
} else {
    pip install hermes-agent --upgrade 2>$null
    Refresh-Path
    if (Get-Command hermes -ErrorAction SilentlyContinue) { Log-Ok "hermes-agent installed" }
    else { Log-Warn "hermes-agent install may have failed — check 'pip show hermes-agent'" }
}

$hermesConfigDir  = "$env:LOCALAPPDATA\hermes\hermes-agent"
$hermesConfigFile = "$hermesConfigDir\config.yaml"

if (Test-Path $hermesConfigBriefing) {
    if (-not (Test-Path $hermesConfigDir)) { New-Item -ItemType Directory -Path $hermesConfigDir -Force | Out-Null }

    $inYaml  = $false
    $yamlOut = [System.Text.StringBuilder]::new()
    foreach ($line in Get-Content $hermesConfigBriefing) {
        if ($line -match '```yaml') { $inYaml = $true; continue }
        if ($inYaml -and $line -match '```') { $inYaml = $false; continue }
        if ($inYaml) { [void]$yamlOut.AppendLine($line) }
    }
    if ($yamlOut.Length -gt 0) {
        Set-Content -Path $hermesConfigFile -Value $yamlOut.ToString() -Encoding UTF8
        Log-Ok "Hermes config written: $hermesConfigFile"
    } else {
        Log-Warn "YAML extraction failed — check $hermesConfigBriefing"
    }
} else {
    Log-Warn "Hermes briefing not found — run after ANTIGRAVITY is cloned (STEP 3)"
}

if ($env:OPENROUTER_API_KEY) {
    [System.Environment]::SetEnvironmentVariable('OPENROUTER_API_KEY', $env:OPENROUTER_API_KEY, 'User')
    Log-Ok "OPENROUTER_API_KEY persisted to User env scope"
} else { Log-Warn "OPENROUTER_API_KEY not in vault — set manually before running 'hermes dashboard'" }

Write-Host ""
Write-Host "  ACTION (interactive): hermes auth login" -ForegroundColor Yellow
Write-Host "  Then verify: hermes dashboard  (should bind to :9119)" -ForegroundColor Yellow
Write-Host ""

# ────────────────────────────────────────────────────────────────────────────
# STEP 7  Claude Code CLI
# ────────────────────────────────────────────────────────────────────────────
Log-Step "STEP 7 — Claude Code CLI"

if (Get-Command claude -ErrorAction SilentlyContinue) {
    Log-Skip "Claude Code CLI already installed"
} else {
    try {
        Invoke-RestMethod -Uri 'https://claude.ai/install.ps1' | Invoke-Expression
        Refresh-Path
        Log-Ok "Claude Code CLI installed"
    } catch {
        npm install -g @anthropic-ai/claude-code
        Refresh-Path
        if (Get-Command claude -ErrorAction SilentlyContinue) { Log-Ok "Claude Code CLI installed (npm fallback)" }
        else { Log-Warn "Claude Code CLI install failed — npm install -g @anthropic-ai/claude-code manually" }
    }
}

# ────────────────────────────────────────────────────────────────────────────
# STEP 8  Codex CLI
# ────────────────────────────────────────────────────────────────────────────
Log-Step "STEP 8 — Codex CLI"

if (Get-Command codex -ErrorAction SilentlyContinue) {
    Log-Skip "Codex CLI already installed"
} else {
    npm install -g @openai/codex
    Refresh-Path
    if (Get-Command codex -ErrorAction SilentlyContinue) { Log-Ok "Codex CLI installed" }
    else { Log-Warn "Codex CLI not found after install — check npm global bin in PATH" }
}

# ────────────────────────────────────────────────────────────────────────────
# STEP 9  mission-mcp service
# ────────────────────────────────────────────────────────────────────────────
Log-Step "STEP 9 — mission-mcp install + Windows service"

$mcpPath = "E:\ANTIGRAVITY\services\mission-mcp"
if (Test-Path "$mcpPath\package.json") {
    Push-Location $mcpPath
    if (-not (Test-Path 'node_modules')) {
        pnpm install
        Log-Ok "mission-mcp: dependencies installed"
    } else { Log-Skip "mission-mcp: node_modules already present" }

    if (-not (Test-Path 'dist\server.js')) {
        pnpm build
        Log-Ok "mission-mcp: built"
    } else { Log-Skip "mission-mcp: dist already built" }
    Pop-Location

    $nssmAvail = Get-Command nssm -ErrorAction SilentlyContinue
    if (-not $nssmAvail) {
        choco install nssm -y --no-progress 2>$null
        Refresh-Path
        $nssmAvail = Get-Command nssm -ErrorAction SilentlyContinue
    }
    if ($nssmAvail) {
        $nodeExe = (Get-Command node -ErrorAction SilentlyContinue)?.Source
        Ensure-NssmService -Name 'MissionMcp' -Exe $nodeExe -Args "dist\server.js" -Env @{
            MISSION_MCP_TRANSPORT = 'http'
            MISSION_MCP_PORT      = '3901'
        }
        # Set AppDirectory separately (nssm needs it for relative paths)
        nssm set MissionMcp AppDirectory $mcpPath
        Start-Service MissionMcp -ErrorAction SilentlyContinue
    } else { Log-Warn "NSSM unavailable — start mission-mcp manually:"
              Log-Warn "  cd $mcpPath && set MISSION_MCP_TRANSPORT=http && set MISSION_MCP_PORT=3901 && node dist\server.js" }
} else {
    Log-Warn "mission-mcp not found at $mcpPath — will exist after ANTIGRAVITY clone; re-run STEP 9 after clone"
}

# ────────────────────────────────────────────────────────────────────────────
# STEP 10  antigravity-cockpit build
# ────────────────────────────────────────────────────────────────────────────
Log-Step "STEP 10 — antigravity-cockpit"

$cockpitPath = "E:\ANTIGRAVITY\apps\antigravity-cockpit"
if (Test-Path "$cockpitPath\package.json") {
    Push-Location $cockpitPath
    if (-not (Test-Path 'node_modules')) { pnpm install; Log-Ok "antigravity-cockpit: deps installed" }
    else { Log-Skip "antigravity-cockpit: node_modules present" }
    if (-not (Test-Path '.next') -and -not (Test-Path 'dist')) {
        pnpm build; Log-Ok "antigravity-cockpit: built"
    } else { Log-Skip "antigravity-cockpit: build artifact already present" }
    Pop-Location
} else {
    Log-Warn "antigravity-cockpit not found at $cockpitPath — will exist after ANTIGRAVITY clone"
}

# ────────────────────────────────────────────────────────────────────────────
# STEP 11  Credential restore from OneDrive vault
# ────────────────────────────────────────────────────────────────────────────
Log-Step "STEP 11 — Credential restore from Personal Vault"

if ($vaultAvailable) {
    # All keys are already loaded into the Process env scope (STEP 0).
    # Persist critical ones to Machine/User scope so services see them at reboot.
    $persistKeys = @('OPENROUTER_API_KEY','ANTHROPIC_API_KEY','STRIPE_SECRET_KEY',
                     'SENDGRID_API_KEY','TELEGRAM_BOT_TOKEN','SQUARE_ACCESS_TOKEN',
                     'GEMINI_API_KEY','GROK_API_KEY','STABILITY_API_KEY')
    foreach ($k in $persistKeys) {
        if ([System.Environment]::GetEnvironmentVariable($k,'Process')) {
            [System.Environment]::SetEnvironmentVariable($k,
                [System.Environment]::GetEnvironmentVariable($k,'Process'), 'User')
            Log-Ok "Persisted $k to User env scope"
        } else { Log-Warn "$k not found in vault env file" }
    }
} else {
    Write-Host ""
    Write-Host "  Vault not available — credentials NOT restored." -ForegroundColor Red
    Write-Host "  Instructions to unlock Personal Vault:" -ForegroundColor Yellow
    Write-Host "  1. Open OneDrive in File Explorer" -ForegroundColor Yellow
    Write-Host "  2. Click 'Personal Vault' and authenticate" -ForegroundColor Yellow
    Write-Host "  3. Re-run this script (idempotent — already-complete steps are skipped)" -ForegroundColor Yellow
    Write-Host ""
}

# ────────────────────────────────────────────────────────────────────────────
# STEP 12  cloudflared tunnel (T5500 tunnel, per migration runbook)
# ────────────────────────────────────────────────────────────────────────────
Log-Step "STEP 12 — cloudflared tunnel setup"

$cfExe = (Get-Command cloudflared -ErrorAction SilentlyContinue)?.Source
if (-not $cfExe) {
    Log-Warn "cloudflared not found — was winget install step skipped?"
} else {
    $cfConfigDir  = "$env:USERPROFILE\.cloudflared"
    $cfConfigFile = "$cfConfigDir\config.yml"

    if (Test-Path $cfConfigFile) {
        Log-Skip "cloudflared config.yml already exists at $cfConfigFile"
        Log-Ok "If tunnel UUID differs from ANTIGRAVITY copy, update manually per TUNNEL-MIGRATION-RUNBOOK-2026-05-12.md"
    } else {
        Write-Host ""
        Write-Host "  ACTION REQUIRED (interactive, ~2 min):" -ForegroundColor Yellow
        Write-Host "  Run: cloudflared tunnel login" -ForegroundColor Yellow
        Write-Host "  Then follow the tunnel migration runbook:" -ForegroundColor Yellow
        Write-Host "  E:\ANTIGRAVITY\briefings\TUNNEL-MIGRATION-RUNBOOK-2026-05-12.md" -ForegroundColor Yellow
        Write-Host "  Summary:" -ForegroundColor Yellow
        Write-Host "    cloudflared tunnel create t5500" -ForegroundColor Gray
        Write-Host "    (create config.yml per runbook Phase 2)" -ForegroundColor Gray
        Write-Host "    cloudflared tunnel route dns t5500 mcp.youandinotai.com" -ForegroundColor Gray
        Write-Host "    cloudflared tunnel route dns t5500 hermes.youandinotai.com" -ForegroundColor Gray
        Write-Host "    cloudflared tunnel route dns t5500 dashboard.aidoesitall.website" -ForegroundColor Gray
        Write-Host "    cloudflared service install && Start-Service cloudflared" -ForegroundColor Gray
        Write-Host ""
        Write-Host "  NOTE: CLOUDFLARE_API_TOKEN was dead as of 2026-05-12." -ForegroundColor Red
        Write-Host "  Mint a fresh token at https://dash.cloudflare.com/profile/api-tokens" -ForegroundColor Red
parent of 22d51cba (chore: clean business-only public surfaces)
        Write-Host "  Required perms: Zone:Zone:Read, Zone:DNS:Edit, Account:Cloudflare Tunnel:Edit" -ForegroundColor Red
        Write-Host ""
    }

    # If the cloudflared service is already installed, just ensure it's running
    $cfSvc = Get-Service -Name 'cloudflared' -ErrorAction SilentlyContinue
    if ($cfSvc) {
        if ($cfSvc.Status -ne 'Running') { Start-Service cloudflared }
        Log-Ok "cloudflared service running"
    }
}

# ────────────────────────────────────────────────────────────────────────────
# STEP 13  Memory mirror sync
# ────────────────────────────────────────────────────────────────────────────
Log-Step "STEP 13 — Claude memory mirror sync"

$memoryDest = "C:\Users\joshl\.claude\projects\C--Users-joshl--hermes\memory"
if (Test-Path $memorySource) {
    if (-not (Test-Path $memoryDest)) { New-Item -ItemType Directory -Path $memoryDest -Force | Out-Null }
    Copy-Item -Path "$memorySource\*" -Destination $memoryDest -Recurse -Force
    $fc = (Get-ChildItem $memoryDest -File).Count
    Log-Ok "Memory synced — $fc files → $memoryDest"
} else {
    Log-Warn "OneDrive memory source not found — $memorySource"
    Log-Warn "Claude sessions will start without project memory until sync completes"
}

# ────────────────────────────────────────────────────────────────────────────
# STEP 14  Ollama auto-start (Windows service via NSSM)
# ────────────────────────────────────────────────────────────────────────────
Log-Step "STEP 14 — Ollama Windows service"

$ollamaExe = (Get-Command ollama -ErrorAction SilentlyContinue)?.Source
$nssmAvail  = Get-Command nssm -ErrorAction SilentlyContinue
if (-not $nssmAvail) {
    choco install nssm -y --no-progress 2>$null; Refresh-Path
    $nssmAvail = Get-Command nssm -ErrorAction SilentlyContinue
}
if ($ollamaExe -and $nssmAvail) {
    Ensure-NssmService -Name 'OllamaServe' -Exe $ollamaExe -Args 'serve' -Env @{
        OLLAMA_HOST    = '0.0.0.0:11434'
        OLLAMA_ORIGINS = '*'
    }
} else {
    $lnk = "$env:APPDATA\Microsoft\Windows\Start Menu\Programs\Startup\Ollama-Serve.lnk"
    if (-not (Test-Path $lnk)) {
        $wsh = New-Object -ComObject WScript.Shell; $sc = $wsh.CreateShortcut($lnk)
        $sc.TargetPath = $ollamaExe; $sc.Arguments = 'serve'
        $sc.WindowStyle = 7; $sc.Save()
        Log-Ok "Ollama startup shortcut created (NSSM fallback)"
    } else { Log-Skip "Ollama startup shortcut already exists" }
}

# ────────────────────────────────────────────────────────────────────────────
# STEP 15  Tailscale join
# ────────────────────────────────────────────────────────────────────────────
Log-Step "STEP 15 — Tailscale join tailnet"

$tsExe = "C:\Program Files\Tailscale\tailscale.exe"
if (-not (Test-Path $tsExe)) { $tsExe = (Get-Command tailscale -ErrorAction SilentlyContinue)?.Source }
if ($tsExe) {
    $tsStatus = & $tsExe status --json 2>$null | ConvertFrom-Json -ErrorAction SilentlyContinue
    if ($tsStatus -and $tsStatus.BackendState -eq 'Running') {
        Log-Skip "Tailscale already connected"
    } else {
        Write-Host "  ACTION (interactive): browser window opens for tailnet approval" -ForegroundColor Yellow
        try { & $tsExe up --accept-routes 2>$null; Log-Ok "Tailscale up initiated" }
        catch { Log-Warn "Tailscale up failed: $($_.Exception.Message) — complete via tray icon" }
    }
} else { Log-Warn "Tailscale exe not found" }

# ────────────────────────────────────────────────────────────────────────────
# STEP 16  Self-test pass
# ────────────────────────────────────────────────────────────────────────────
Log-Step "STEP 16 — Self-test pass" 'Magenta'

$tests = @{}
$tests['ollama_http']      = $null -ne (Invoke-RestMethod -Uri 'http://localhost:11434/api/tags' -ErrorAction SilentlyContinue)
$tests['mission_mcp_http'] = $null -ne (Invoke-WebRequest -Uri 'http://localhost:3901/' -SkipHttpErrorCheck -UseBasicParsing -ErrorAction SilentlyContinue)
$tests['git']              = [bool](Get-Command git    -ErrorAction SilentlyContinue)
$tests['node']             = [bool](Get-Command node   -ErrorAction SilentlyContinue)
$tests['pnpm']             = [bool](Get-Command pnpm   -ErrorAction SilentlyContinue)
$tests['python']           = [bool](Get-Command python -ErrorAction SilentlyContinue)
$tests['gh_cli']           = [bool](Get-Command gh     -ErrorAction SilentlyContinue)
$tests['claude_cli']       = [bool](Get-Command claude -ErrorAction SilentlyContinue)
$tests['codex_cli']        = [bool](Get-Command codex  -ErrorAction SilentlyContinue)
$tests['cloudflared']      = [bool](Get-Command cloudflared -ErrorAction SilentlyContinue)
$tests['antigravity_repo'] = (Test-Path "E:\ANTIGRAVITY\.git")
$tests['hermes_workspace'] = (Test-Path "$hwPath\package.json") -or (Test-Path "$hwAntiPath\package.json")
$tests['memory_synced']    = (Test-Path $memoryDest) -and ((Get-ChildItem $memoryDest -File -ErrorAction SilentlyContinue).Count -gt 0)

$pass = 0; $fail = 0
foreach ($k in $tests.Keys | Sort-Object) {
    if ($tests[$k]) { Write-Host "    PASS  $k" -ForegroundColor Green;  $pass++ }
    else            { Write-Host "    FAIL  $k" -ForegroundColor Red;    $fail++ }
}

# ────────────────────────────────────────────────────────────────────────────
# Final report
# ────────────────────────────────────────────────────────────────────────────
$nodeName = $env:COMPUTERNAME
$nodeIp   = (Get-NetIPAddress -AddressFamily IPv4 |
             Where-Object { ($_.PrefixOrigin -eq 'Dhcp' -or $_.PrefixOrigin -eq 'Manual') -and
                            $_.IPAddress -notlike '169.*' } |
             Select-Object -First 1).IPAddress
$tsIp = ''
try { if ($tsExe) { $tsIp = (& $tsExe ip -4 2>$null | Select-Object -First 1).Trim() } } catch {}

Write-Host ""
Write-Host "================================================================" -ForegroundColor Cyan
Write-Host "  T5500 BOOTSTRAP COMPLETE — $pass/$($pass+$fail) checks passed" -ForegroundColor Cyan
Write-Host "================================================================" -ForegroundColor Cyan
Write-Host "  Node:              $nodeName" -ForegroundColor White
Write-Host "  LAN IP:            $nodeIp" -ForegroundColor White
if ($tsIp) { Write-Host "  Tailscale IP:      $tsIp" -ForegroundColor White }
Write-Host "  Ollama endpoint:   http://localhost:11434" -ForegroundColor White
Write-Host "  mission-mcp:       http://localhost:3901" -ForegroundColor White
Write-Host "  Hermes Workspace:  http://localhost:3000 (start: pnpm dev in $hwPath)" -ForegroundColor White
Write-Host "  Hermes dashboard:  http://127.0.0.1:9119 (after: hermes auth login)" -ForegroundColor White
Write-Host "  Log file:          $logPath" -ForegroundColor White
Write-Host ""
Write-Host "  NEXT STEPS (in order):" -ForegroundColor Yellow
Write-Host "  1. hermes auth login                   (OAuth, browser, ~30 sec)" -ForegroundColor Yellow
Write-Host "  2. Approve Tailscale join in browser   (~30 sec)" -ForegroundColor Yellow
Write-Host "  3. cloudflared tunnel login            (browser, ~2 min)" -ForegroundColor Yellow
Write-Host "     Then follow TUNNEL-MIGRATION-RUNBOOK-2026-05-12.md" -ForegroundColor Yellow
Write-Host "  4. Unlock OneDrive Personal Vault if creds were not loaded" -ForegroundColor Yellow
if ($fail -gt 0) {
Write-Host ""
Write-Host "  $fail check(s) FAILED — see: $logPath" -ForegroundColor Red }
Write-Host ""
Write-Host "================================================================" -ForegroundColor Cyan

Stop-Transcript
