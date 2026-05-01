# scripts/bootstrap-agent-stack.ps1
# Install the ANTIGRAVITY agent CLI stack on a Windows node.
# Idempotent — safe to re-run. Mirrors Sabretooth's npm globals + standalone CLIs.
#
# Usage (local):  pwsh -File C:\Antigravity\scripts\bootstrap-agent-stack.ps1
# Usage (remote): ssh joshl@<node-ip> "powershell -File C:\Antigravity\scripts\bootstrap-agent-stack.ps1"

$ErrorActionPreference = 'Continue'
$ProgressPreference    = 'SilentlyContinue'

function Step($msg) { Write-Host "`n=== $msg ===" -ForegroundColor Cyan }
function Has($cmd)  { [bool](Get-Command $cmd -ErrorAction SilentlyContinue) }

# ---------- 1. Prereqs ----------
Step "Prereqs (must already be installed)"
$missing = @()
foreach ($exe in 'node','npm','python','ollama') {
    if (Has $exe) {
        $ver = (& $exe --version 2>&1 | Select-Object -First 1)
        Write-Host "  $exe : $ver"
    } else {
        Write-Host "  $exe : MISSING" -ForegroundColor Red
        $missing += $exe
    }
}
if ($missing.Count -gt 0) {
    Write-Host "`nInstall the missing prereqs first:" -ForegroundColor Yellow
    if ('node' -in $missing -or 'npm' -in $missing) { Write-Host "  Node 20+: winget install OpenJS.NodeJS.LTS" }
    if ('python' -in $missing) { Write-Host "  Python: winget install Python.Python.3.12" }
    if ('ollama' -in $missing) { Write-Host "  Ollama: winget install Ollama.Ollama" }
    throw "Prereqs missing — abort."
}

# ---------- 2. Claude Code (standalone installer to ~/.local/bin) ----------
Step "Claude Code"
if (Has 'claude') {
    Write-Host "  claude already installed: $((claude --version) -join ' ')"
} else {
    Write-Host "  installing Claude Code standalone..."
    irm https://claude.ai/install.ps1 | iex
    if (-not (Has 'claude')) {
        # PATH may need refresh; check the standard install location
        $local = "$env:USERPROFILE\.local\bin\claude.exe"
        if (Test-Path $local) {
            Write-Host "  installed at $local — add %USERPROFILE%\.local\bin to PATH (may need new shell)"
        } else {
            Write-Host "  install may have failed; check manually" -ForegroundColor Yellow
        }
    }
}

# ---------- 3. OpenCode (winget) ----------
Step "OpenCode"
if (Has 'opencode') {
    Write-Host "  opencode already installed: $((opencode --version) -join ' ')"
} else {
    Write-Host "  installing OpenCode via winget..."
    winget install --id SST.opencode --silent --accept-package-agreements --accept-source-agreements 2>&1 | Out-String | Write-Host
}

# ---------- 4. npm globals (mirror Sabretooth) ----------
Step "npm globals"
$wantGlobals = @(
    '@chameleon-nexus/agents-cli',
    '@mariozechner/pi-coding-agent',
    '@ollama/pi-web-search',
    '@paperclipai/adapter-claude-local',
    '@paperclipai/adapter-codex-local',
    '@paperclipai/adapter-openclaw-gateway',
    '@paperclipai/adapter-opencode-local',
    '@paperclipai/adapter-pi-local',
    'agent-browser',
    'hermes-paperclip-adapter',
    'node-gyp',
    'openclaw',
    'paperclipai',
    'pnpm',
    'wrangler'
)
$installedJson = npm list -g --depth=0 --json 2>$null | Out-String
$installed = @()
try {
    $parsed = $installedJson | ConvertFrom-Json
    if ($parsed.dependencies) {
        $installed = $parsed.dependencies.PSObject.Properties.Name
    }
} catch { Write-Host "  (could not parse npm list output, will install all)" }

$toInstall = $wantGlobals | Where-Object { $_ -notin $installed }
if ($toInstall.Count -eq 0) {
    Write-Host "  all $($wantGlobals.Count) globals already installed"
} else {
    Write-Host "  installing $($toInstall.Count) missing: $($toInstall -join ', ')"
    npm install -g @($toInstall) 2>&1 | Select-String -Pattern '(added|changed|removed|warn|err|^npm)' | ForEach-Object { Write-Host "  $_" }
}

# ---------- 5. Codex (OpenAI's open-source coding agent) ----------
Step "Codex"
if (Has 'codex') {
    Write-Host "  codex already installed: $((codex --version) -join ' ')"
} else {
    Write-Host "  installing OpenAI Codex CLI..."
    npm install -g @openai/codex 2>&1 | Select-String -Pattern '(added|warn|err|^npm)' | ForEach-Object { Write-Host "  $_" }
    if (-not (Has 'codex')) {
        Write-Host "  codex install may have failed — check npm output" -ForegroundColor Yellow
    }
}

# ---------- 6. Verification ----------
Step "Verification"
$results = @()
foreach ($cmd in 'node','npm','python','ollama','claude','opencode','pi','codex','paperclipai','wrangler','openclaw','pnpm') {
    $loc = (Get-Command $cmd -ErrorAction SilentlyContinue).Source
    if ($loc) {
        $ver = ((& $cmd --version 2>$null) -join ' ').Trim()
        $results += [PSCustomObject]@{ cmd=$cmd; status='OK'; version=$ver }
    } else {
        $results += [PSCustomObject]@{ cmd=$cmd; status='MISSING'; version='' }
    }
}
$results | Format-Table -AutoSize

$missing = ($results | Where-Object { $_.status -eq 'MISSING' }).cmd
if ($missing) {
    Write-Host "`nStill missing: $($missing -join ', ')" -ForegroundColor Yellow
    Write-Host "Common fixes: open a new shell to refresh PATH, or restart Windows for installer changes." -ForegroundColor Yellow
} else {
    Write-Host "`nAll components installed." -ForegroundColor Green
}

Write-Host "`nNotes:"
Write-Host "  - Droid (Factory) and Cline are not auto-installed (not on Sabretooth either). Install manually if needed."
Write-Host "  - After install: 'ollama launch' shows the menu; pick any agent to drive it through ollama's local model."
