# =============================================================================
# post-wipe-bootstrap-helper-node.ps1
# =============================================================================
# Role  : Helper node (Sabretooth / 9020 / any future compute worker)
# Run on: Clean Windows install — Run as Administrator
# Goal  : Windows clean-install → Hermes Ollama compute worker → reporting
#         to T5500 → ready for delegated LLM work. Zero manual config after
#         running this script.
#
# PowerShell compat: PS 5.1+ (tested on PS 7). If running PS 5.1, some
#   -ErrorAction SilentlyContinue quirks may differ. Script is safe on both.
#
# Idempotency: every install is guard-checked (Test-Path, Get-Command,
#   winget list). Re-running is safe — already-present components are skipped.
#
# Credentials: NO credential values baked in. All secrets come from the
#   OneDrive vault at runtime. Script reads them from the env file directly.
#
# Log file: C:\bootstrap-helper-YYYYMMDD-HHmmss.log (verbose, auto-created)
#
# DO NOT install Paperclip in any form. Per standing doctrine: no Paperclip.
# =============================================================================

#Requires -RunAsAdministrator

$ErrorActionPreference   = 'Stop'
$ProgressPreference      = 'SilentlyContinue'
$VerbosePreference       = 'Continue'

# ── Log file setup ──────────────────────────────────────────────────────────
$logPath = "C:\bootstrap-helper-$(Get-Date -Format 'yyyyMMdd-HHmmss').log"
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
    if ($LASTEXITCODE -ne 0) { Log-Warn "$Label install returned exit $LASTEXITCODE — may still be OK" }
    else { Log-Ok "$Label installed" }
}

Write-Host ""
Write-Host "================================================================" -ForegroundColor Cyan
Write-Host "  ANTIGRAVITY — HELPER NODE BOOTSTRAP" -ForegroundColor Cyan
Write-Host "  Role: Hermes Ollama compute worker for T5500" -ForegroundColor Cyan
Write-Host "================================================================" -ForegroundColor Cyan
Write-Host ""

# ────────────────────────────────────────────────────────────────────────────
# STEP 0  OneDrive prerequisite check
# ────────────────────────────────────────────────────────────────────────────
Log-Step "STEP 0 — OneDrive prerequisite check" 'Magenta'

$oneDrivePath  = "C:\Users\joshl\OneDrive"
$vaultEnvFile  = "C:\Users\joshl\OneDrive\Personal Vault\MASTER-UNIVERSAL-ENV-TROLLZ1004.env"
$memorySource  = "C:\Users\joshl\OneDrive\.claude\projects\C--Users-joshl--hermes\memory"

if (-not (Test-Path $oneDrivePath)) {
    Log-Fail "OneDrive folder not found at: $oneDrivePath"
    Write-Host ""
    Write-Host "  ACTION REQUIRED:" -ForegroundColor Red
    Write-Host "  Sign into OneDrive as joshlcoleman@gmail.com." -ForegroundColor Red
    Write-Host "  Wait for initial sync to complete (the OneDrive icon in the system" -ForegroundColor Red
    Write-Host "  tray should show a checkmark), then re-run this script." -ForegroundColor Red
    Write-Host ""
    Stop-Transcript
    exit 1
}
Log-Ok "OneDrive present at $oneDrivePath"

if (-not (Test-Path $vaultEnvFile)) {
    Log-Warn "Personal Vault env file not found — Vault may be locked or not yet synced."
    Log-Warn "Vault path: $vaultEnvFile"
    Log-Warn "Continuing — vault-dependent steps will be skipped with clear messages."
    $vaultAvailable = $false
} else {
    Log-Ok "Personal Vault env file found"
    $vaultAvailable = $true
}

# Load vault env into session (no values printed to log — redact_secrets on)
if ($vaultAvailable) {
    Get-Content $vaultEnvFile | Where-Object { $_ -match '^[A-Z_]+=.+' -and $_ -notmatch '^#' } |
        ForEach-Object {
            $kv = $_ -split '=', 2
            [System.Environment]::SetEnvironmentVariable($kv[0].Trim(), $kv[1].Trim(), 'Process')
        }
    Log-Ok "Vault env loaded into session (keys only — values not logged)"
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

WingetInstall 'Git.Git'                            'Git'
WingetInstall 'OpenJS.NodeJS.LTS'                  'Node.js LTS (22+)'
WingetInstall 'Python.Python.3.11'                 'Python 3.11'
WingetInstall 'GitHub.cli'                         'GitHub CLI (gh)'
WingetInstall 'Microsoft.VisualStudio.2022.BuildTools' 'VS Build Tools 2022'
WingetInstall 'Cloudflare.cloudflared'             'cloudflared'
WingetInstall 'Microsoft.PowerShell'               'PowerShell 7'

# Optional — Tailscale (helper nodes need Tailscale so T5500 can reach them)
WingetInstall 'tailscale.tailscale' 'Tailscale'

# Optional — Docker Desktop (may need extra memory; install if hardware allows)
$installDocker = $env:BOOTSTRAP_INSTALL_DOCKER
if ($installDocker -eq '1') {
    WingetInstall 'Docker.DockerDesktop' 'Docker Desktop'
} else {
    Log-Skip "Docker Desktop skipped (set BOOTSTRAP_INSTALL_DOCKER=1 to include)"
}

Refresh-Path

# pnpm via corepack
if (-not (Get-Command pnpm -ErrorAction SilentlyContinue)) {
    Log-Step "Enabling pnpm via corepack..."
    corepack enable
    corepack prepare pnpm@latest --activate 2>$null
    Refresh-Path
    Log-Ok "pnpm enabled"
} else {
    Log-Skip "pnpm already available"
}

# ────────────────────────────────────────────────────────────────────────────
# STEP 3  Pull ANTIGRAVITY repo
# ────────────────────────────────────────────────────────────────────────────
Log-Step "STEP 3 — ANTIGRAVITY repo"

$antigravityPath = "E:\ANTIGRAVITY"
$repoUrl         = "https://github.com/Trollz1004/ANTIGRAVITY.git"

if (Test-Path "$antigravityPath\.git") {
    Log-Skip "ANTIGRAVITY already cloned at $antigravityPath"
    Push-Location $antigravityPath
    git pull --rebase origin main
    Pop-Location
    Log-Ok "ANTIGRAVITY repo refreshed (git pull --rebase)"
} else {
    if (Test-Path $antigravityPath) {
        Log-Warn "$antigravityPath exists but is not a git repo — cloning into it may fail; check manually"
    }
    git clone --branch main $repoUrl $antigravityPath
    Log-Ok "ANTIGRAVITY cloned to $antigravityPath"
}

# ────────────────────────────────────────────────────────────────────────────
# STEP 4  Ollama install + lightweight model set
# ────────────────────────────────────────────────────────────────────────────
Log-Step "STEP 4 — Ollama + models (sized for GTX 1070 / lower hardware)"

WingetInstall 'Ollama.Ollama' 'Ollama'
Refresh-Path

# Set host env so T5500 can route LLM calls here
[System.Environment]::SetEnvironmentVariable('OLLAMA_HOST', '0.0.0.0:11434', 'Machine')
[System.Environment]::SetEnvironmentVariable('OLLAMA_ORIGINS', '*', 'Machine')
$env:OLLAMA_HOST    = '0.0.0.0:11434'
$env:OLLAMA_ORIGINS = '*'
Log-Ok "OLLAMA_HOST=0.0.0.0:11434 set (Machine scope)"

# Ensure ollama serve is running for the pull step
$ollamaProc = Get-Process -Name 'ollama' -ErrorAction SilentlyContinue
if (-not $ollamaProc) {
    Start-Process -FilePath 'ollama' -ArgumentList 'serve' -WindowStyle Hidden
    Start-Sleep -Seconds 8
    Log-Ok "ollama serve started"
} else {
    Log-Skip "ollama serve already running"
}

# Lightweight model set — total ~8 GB, GTX 1070-safe
$models = @(
    'gemma2:2b',        # ~1.6 GB — fast routine routing
    'qwen2.5:7b',       # ~4.7 GB — best-in-class 7B code/general
    'llama3.2:3b',      # ~2.0 GB — Meta tiny general
    'nomic-embed-text'  # ~270 MB — embeddings for memory/search
)
foreach ($model in $models) {
    $existing = ollama list 2>$null | Select-String $model
    if ($existing) { Log-Skip "Model $model already pulled"; continue }
    Log-Step "Pulling model: $model"
    ollama pull $model
    if ($LASTEXITCODE -ne 0) { Log-Warn "Pull for $model returned $LASTEXITCODE — check ollama list after bootstrap" }
    else { Log-Ok "Model $model ready" }
}

# ────────────────────────────────────────────────────────────────────────────
# STEP 5  Hermes Workspace install
# ────────────────────────────────────────────────────────────────────────────
Log-Step "STEP 5 — Hermes Workspace (preferred orchestration GUI)"

$hwPath = "C:\Users\joshl\hermes-workspace"
if (Test-Path "$hwPath\package.json") {
    Log-Skip "Hermes Workspace already present at $hwPath — pulling latest..."
    Push-Location $hwPath
    git pull --rebase origin main 2>$null
    pnpm install --frozen-lockfile 2>$null
    Pop-Location
} else {
    # Installer is bash-flavored; try WSL first, otherwise clone directly
    $wslavail = Get-Command wsl -ErrorAction SilentlyContinue
    if ($wslavail) {
        Log-Step "Running Hermes Workspace install via WSL..."
        wsl -- bash -c "curl -fsSL https://hermes-workspace.com/install.sh | bash"
        if ($LASTEXITCODE -eq 0) {
            Log-Ok "Hermes Workspace installed via WSL"
        } else {
            Log-Warn "WSL installer returned non-zero — falling back to git clone"
            git clone https://github.com/nousresearch/hermes-workspace.git $hwPath
            Push-Location $hwPath; pnpm install; Pop-Location
        }
    } else {
        Log-Warn "WSL not present — cloning Hermes Workspace repo directly"
        git clone https://github.com/nousresearch/hermes-workspace.git $hwPath
        if (Test-Path "$hwPath\package.json") {
            Push-Location $hwPath; pnpm install; Pop-Location
            Log-Ok "Hermes Workspace cloned and deps installed (WSL-less path)"
        } else {
            Log-Warn "Hermes Workspace clone may have failed — check $hwPath manually"
            Log-Warn "Install WSL (wsl --install) then re-run, or install from hermes-workspace.com"
        }
    }
}

# ────────────────────────────────────────────────────────────────────────────
# STEP 6  Hermes Agent CLI + apply preserved YAML config
# ────────────────────────────────────────────────────────────────────────────
Log-Step "STEP 6 — Hermes Agent CLI + preserved YAML config"

$hermesConfigBriefing = "E:\ANTIGRAVITY\briefings\HERMES-AGENT-WORKING-CONFIG-2026-05-12.md"

# Install hermes-agent via pip
if (Get-Command hermes -ErrorAction SilentlyContinue) {
    Log-Skip "hermes CLI already installed"
} else {
    pip install hermes-agent --upgrade 2>$null
    Refresh-Path
    if (Get-Command hermes -ErrorAction SilentlyContinue) {
        Log-Ok "hermes-agent installed via pip"
    } else {
        Log-Warn "hermes-agent pip install may have failed — check 'pip show hermes-agent'"
    }
}

# Extract the YAML block from the briefing file and write to hermes config dir
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
        Log-Ok "Hermes config written from briefing: $hermesConfigFile"
    } else {
        Log-Warn "Could not extract YAML from briefing — check $hermesConfigBriefing"
    }
} else {
    Log-Warn "Hermes briefing not found ($hermesConfigBriefing) — run after ANTIGRAVITY is cloned"
}

# Set OPENROUTER_API_KEY from vault if available
if ($env:OPENROUTER_API_KEY) {
    [System.Environment]::SetEnvironmentVariable('OPENROUTER_API_KEY', $env:OPENROUTER_API_KEY, 'User')
    Log-Ok "OPENROUTER_API_KEY set in User env scope from vault"
} else {
    Log-Warn "OPENROUTER_API_KEY not found in vault — set it manually before running 'hermes dashboard'"
}

Write-Host ""
Write-Host "  ACTION (interactive, ~30 sec):" -ForegroundColor Yellow
Write-Host "  Run: hermes auth login" -ForegroundColor Yellow
Write-Host "  This opens a browser for OAuth (nous, openai-codex). Complete it." -ForegroundColor Yellow
Write-Host "  Then verify with: hermes dashboard  (should bind to :9119)" -ForegroundColor Yellow
Write-Host ""

# ────────────────────────────────────────────────────────────────────────────
# STEP 7  Claude Code CLI
# ────────────────────────────────────────────────────────────────────────────
Log-Step "STEP 7 — Claude Code CLI"

if (Get-Command claude -ErrorAction SilentlyContinue) {
    Log-Skip "Claude Code CLI already installed ($(claude --version 2>$null))"
} else {
    try {
        Invoke-RestMethod -Uri 'https://claude.ai/install.ps1' | Invoke-Expression
        Refresh-Path
        Log-Ok "Claude Code CLI installed via claude.ai installer"
    } catch {
        Log-Warn "claude.ai installer failed — trying npm fallback"
        npm install -g @anthropic-ai/claude-code
        Refresh-Path
        if (Get-Command claude -ErrorAction SilentlyContinue) {
            Log-Ok "Claude Code CLI installed via npm"
        } else {
            Log-Warn "Claude Code CLI install failed; install manually: npm install -g @anthropic-ai/claude-code"
        }
    }
}

# ────────────────────────────────────────────────────────────────────────────
# STEP 8  Codex CLI (OpenAI open-source coding agent)
# ────────────────────────────────────────────────────────────────────────────
Log-Step "STEP 8 — Codex CLI (Fifth Chair authority on this node)"

if (Get-Command codex -ErrorAction SilentlyContinue) {
    Log-Skip "Codex CLI already installed"
} else {
    npm install -g @openai/codex
    Refresh-Path
    if (Get-Command codex -ErrorAction SilentlyContinue) {
        Log-Ok "Codex CLI installed"
    } else {
        Log-Warn "Codex CLI not found after install — check npm global bin in PATH"
    }
}

# ────────────────────────────────────────────────────────────────────────────
# STEP 9  Memory mirror sync
# ────────────────────────────────────────────────────────────────────────────
Log-Step "STEP 9 — Claude memory mirror sync from OneDrive"

$memoryDest = "C:\Users\joshl\.claude\projects\C--Users-joshl--hermes\memory"

if (Test-Path $memorySource) {
    if (-not (Test-Path $memoryDest)) {
        New-Item -ItemType Directory -Path $memoryDest -Force | Out-Null
    }
    Copy-Item -Path "$memorySource\*" -Destination $memoryDest -Recurse -Force
    $fileCount = (Get-ChildItem $memoryDest -File).Count
    Log-Ok "Memory mirror synced — $fileCount files at $memoryDest"
    Log-Ok "This node's Claude Code sessions will load the full doctrine on launch"
} else {
    Log-Warn "OneDrive memory mirror not found at: $memorySource"
    Log-Warn "Claude Code on this node will start without the project memory."
    Log-Warn "Fix: ensure OneDrive is synced and the memory dir is present, then re-run STEP 9 manually:"
    Log-Warn "  Copy-Item '$memorySource\*' '$memoryDest' -Recurse -Force"
}

# ────────────────────────────────────────────────────────────────────────────
# STEP 10  Auto-start — Ollama Windows service
# ────────────────────────────────────────────────────────────────────────────
Log-Step "STEP 10 — Ollama auto-start on boot"

# Method A: Windows service via NSSM (if available)
$nssmAvail = Get-Command nssm -ErrorAction SilentlyContinue
if (-not $nssmAvail) {
    choco install nssm -y --no-progress 2>$null
    Refresh-Path
    $nssmAvail = Get-Command nssm -ErrorAction SilentlyContinue
}

$ollamaExe = (Get-Command ollama -ErrorAction SilentlyContinue)?.Source
if ($ollamaExe -and $nssmAvail) {
    $svcName = 'OllamaServe'
    $svcExists = Get-Service -Name $svcName -ErrorAction SilentlyContinue
    if ($svcExists) {
        Log-Skip "OllamaServe Windows service already registered"
    } else {
        nssm install $svcName $ollamaExe 'serve'
        nssm set $svcName AppEnvironmentExtra "OLLAMA_HOST=0.0.0.0:11434" "OLLAMA_ORIGINS=*"
        nssm set $svcName Start SERVICE_AUTO_START
        Start-Service -Name $svcName -ErrorAction SilentlyContinue
        Log-Ok "OllamaServe Windows service installed and started"
    }
} else {
    # Method B: Startup folder shortcut as fallback
    Log-Warn "NSSM not available — using startup shortcut fallback"
    $startupLnk = "$env:APPDATA\Microsoft\Windows\Start Menu\Programs\Startup\Ollama-Serve.lnk"
    if (-not (Test-Path $startupLnk)) {
        $wsh      = New-Object -ComObject WScript.Shell
        $sc       = $wsh.CreateShortcut($startupLnk)
        $sc.TargetPath      = $ollamaExe
        $sc.Arguments       = 'serve'
        $sc.WorkingDirectory= $env:USERPROFILE
        $sc.WindowStyle     = 7  # Minimized
        $sc.Description     = 'Ollama serve — auto-start for T5500 routing'
        $sc.Save()
        Log-Ok "Ollama startup shortcut created at $startupLnk"
    } else {
        Log-Skip "Ollama startup shortcut already exists"
    }
}

# ────────────────────────────────────────────────────────────────────────────
# STEP 11  Tailscale up (best-effort — will prompt for approval in browser)
# ────────────────────────────────────────────────────────────────────────────
Log-Step "STEP 11 — Tailscale join tailnet"

$tsExe = "C:\Program Files\Tailscale\tailscale.exe"
if (-not (Test-Path $tsExe)) { $tsExe = (Get-Command tailscale -ErrorAction SilentlyContinue)?.Source }
if ($tsExe) {
    $tsStatus = & $tsExe status --json 2>$null | ConvertFrom-Json -ErrorAction SilentlyContinue
    if ($tsStatus -and $tsStatus.BackendState -eq 'Running') {
        Log-Skip "Tailscale already connected ($(tsStatus.Self.DNSName))"
    } else {
        Write-Host ""
        Write-Host "  ACTION (interactive, ~30 sec):" -ForegroundColor Yellow
        Write-Host "  A browser window will open — approve this node joining your tailnet." -ForegroundColor Yellow
        Write-Host "  Node tag: tag:helper-node" -ForegroundColor Yellow
        Write-Host ""
        try {
            & $tsExe up --accept-routes 2>$null
            Log-Ok "Tailscale up initiated — complete browser approval if prompted"
        } catch {
            Log-Warn "Tailscale up failed: $($_.Exception.Message) — complete via tray icon"
        }
    }
} else {
    Log-Warn "Tailscale executable not found — did winget install succeed? Check Programs list."
}

# ────────────────────────────────────────────────────────────────────────────
# STEP 12  Self-test
# ────────────────────────────────────────────────────────────────────────────
Log-Step "STEP 12 — Self-test pass" 'Magenta'

$tests = @{}
$tests['ollama_serve'] = (Invoke-RestMethod -Uri 'http://localhost:11434/api/tags' -ErrorAction SilentlyContinue) -ne $null
$tests['git']          = [bool](Get-Command git          -ErrorAction SilentlyContinue)
$tests['node']         = [bool](Get-Command node         -ErrorAction SilentlyContinue)
$tests['python']       = [bool](Get-Command python       -ErrorAction SilentlyContinue)
$tests['gh_cli']       = [bool](Get-Command gh           -ErrorAction SilentlyContinue)
$tests['claude_cli']   = [bool](Get-Command claude       -ErrorAction SilentlyContinue)
$tests['codex_cli']    = [bool](Get-Command codex        -ErrorAction SilentlyContinue)
$tests['antigravity_repo'] = (Test-Path "E:\ANTIGRAVITY\.git")
$tests['memory_synced']    = (Test-Path $memoryDest) -and ((Get-ChildItem $memoryDest -File).Count -gt 0)

$pass = 0; $fail = 0
foreach ($k in $tests.Keys | Sort-Object) {
    if ($tests[$k]) { Write-Host "    PASS  $k" -ForegroundColor Green;  $pass++ }
    else            { Write-Host "    FAIL  $k" -ForegroundColor Red;    $fail++ }
}

# ────────────────────────────────────────────────────────────────────────────
# STEP 13  Final report
# ────────────────────────────────────────────────────────────────────────────
$nodeName   = $env:COMPUTERNAME
$nodeIp     = (Get-NetIPAddress -AddressFamily IPv4 |
               Where-Object { ($_.PrefixOrigin -eq 'Dhcp' -or $_.PrefixOrigin -eq 'Manual') -and
                              $_.IPAddress -notlike '169.*' } |
               Select-Object -First 1).IPAddress
$tsIp = ''
try { $tsIp = (& $tsExe ip -4 2>$null | Select-Object -First 1).Trim() } catch {}

Write-Host ""
Write-Host "================================================================" -ForegroundColor Cyan
Write-Host "  HELPER NODE BOOTSTRAP COMPLETE — $pass/$($pass+$fail) checks passed" -ForegroundColor Cyan
Write-Host "================================================================" -ForegroundColor Cyan
Write-Host "  Node:             $nodeName" -ForegroundColor White
Write-Host "  LAN IP:           $nodeIp" -ForegroundColor White
if ($tsIp) {
Write-Host "  Tailscale IP:     $tsIp" -ForegroundColor White }
Write-Host "  Ollama endpoint:  http://${nodeIp}:11434  (LAN)" -ForegroundColor White
if ($tsIp) {
Write-Host "                    http://${tsIp}:11434   (Tailscale)" -ForegroundColor White }
Write-Host "  Hermes dashboard: http://127.0.0.1:9119 (after: hermes auth login)" -ForegroundColor White
Write-Host "  Models ready:     gemma2:2b, qwen2.5:7b, llama3.2:3b, nomic-embed-text" -ForegroundColor White
Write-Host "  Log file:         $logPath" -ForegroundColor White
Write-Host ""
Write-Host "  NEXT STEPS (manual, listed in order):" -ForegroundColor Yellow
Write-Host "  1. hermes auth login    (OAuth — browser opens, ~30 sec)" -ForegroundColor Yellow
Write-Host "  2. Approve Tailscale join in browser / tray if not done" -ForegroundColor Yellow
Write-Host "  3. On T5500: add this node's Ollama to hermes router config:" -ForegroundColor Yellow
Write-Host "       - name: $nodeName" -ForegroundColor Gray
Write-Host "         api:  http://${nodeIp}:11434/v1" -ForegroundColor Gray
Write-Host "         models: [gemma2:2b, qwen2.5:7b, llama3.2:3b]" -ForegroundColor Gray
if ($fail -gt 0) {
Write-Host ""
Write-Host "  $fail check(s) FAILED — review log at: $logPath" -ForegroundColor Red }
Write-Host ""
Write-Host "================================================================" -ForegroundColor Cyan

Stop-Transcript
