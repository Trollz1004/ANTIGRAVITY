# scripts/bootstrap-agent-stack.ps1
# Install + update the ANTIGRAVITY agent CLI stack on a Windows node from
# OFFICIAL sources (no 3rd-party wrappers). Idempotent - safe to re-run.
# After a clean run, every agent in `ollama launch` shows as installed.
#
# Modes:
#   (no flag)  Full - agent CLIs + cloud models + heavy local + custom models
#              (default for Sabretooth and other workstation-class nodes)
#   -Light     Skip heavy local pulls and custom models - keep agent CLIs +
#              cloud models + the small nomic-embed-text. For service-loaded
#              nodes like T5500 that run Docker / brain-mcp / DBs.
#
# Usage (local):     powershell -ExecutionPolicy Bypass -File c:\antigravity\scripts\bootstrap-agent-stack.ps1
# Usage (T5500):     powershell -ExecutionPolicy Bypass -File c:\antigravity\scripts\bootstrap-agent-stack.ps1 -Light
# Usage (remote):    ssh joshl@<node> "powershell -ExecutionPolicy Bypass -File c:\antigravity\scripts\bootstrap-agent-stack.ps1 [-Light]"

param(
    [switch]$Light
)

$ErrorActionPreference = 'Continue'
$ProgressPreference    = 'SilentlyContinue'

function Step($msg) { Write-Host "`n=== $msg ===" -ForegroundColor Cyan }
function Has($cmd)  { [bool](Get-Command $cmd -ErrorAction SilentlyContinue) }
function Ver($cmd)  { try { ((& $cmd --version 2>$null) -join ' ').Trim() } catch { '' } }
# Healthy = on PATH AND --version returns something non-empty.
# Catches half-broken installs where the binary exists but node_modules are missing.
function Healthy($cmd) { (Has $cmd) -and ((Ver $cmd) -ne '') }
# Refresh PATH from machine + user env. Winget installers update env but the running shell does not see it.
function Refresh-Path {
    $env:PATH = [System.Environment]::GetEnvironmentVariable('PATH','Machine') + ';' + [System.Environment]::GetEnvironmentVariable('PATH','User')
}

# ---------- 1. Prereqs ----------
Step 'Prereqs (node, npm, python, ollama, winget)'
$missing = @()
foreach ($exe in 'node','npm','python','ollama','winget') {
    if (Has $exe) {
        Write-Host ("  {0,-10} {1}" -f $exe, (Ver $exe))
    } else {
        Write-Host ("  {0,-10} MISSING" -f $exe) -ForegroundColor Red
        $missing += $exe
    }
}
if ($missing) {
    Write-Host "`nInstall missing prereqs first:" -ForegroundColor Yellow
    if ('node' -in $missing -or 'npm' -in $missing) { Write-Host '  Node 20+: winget install OpenJS.NodeJS.LTS' }
    if ('python' -in $missing) { Write-Host '  Python:   winget install Python.Python.3.12' }
    if ('ollama' -in $missing) { Write-Host '  Ollama:   winget install Ollama.Ollama' }
    if ('winget' -in $missing) { Write-Host '  WinGet:   ms-appinstaller (or update Windows)' }
    throw 'Prereqs missing - abort.'
}

# ---------- 2. Claude Code - official Anthropic installer ----------
Step 'Claude Code (Anthropic - claude.ai/install.ps1)'
if (Healthy 'claude') {
    Write-Host ('  installed: {0}' -f (Ver 'claude'))
    Write-Host '  updating...'
    claude update 2>&1 | Select-Object -Last 5 | ForEach-Object { Write-Host "  $_" }
} else {
    if (Has 'claude') {
        Write-Host '  detected broken install (claude on PATH but --version fails). Reinstalling...' -ForegroundColor Yellow
    } else {
        Write-Host '  installing...'
    }
    irm https://claude.ai/install.ps1 | iex
    # Standalone installer drops claude.exe in ~/.local/bin but does NOT modify PATH.
    # Persist that path into user PATH and refresh the running shell so subsequent
    # steps (and future logins) see the new claude immediately.
    $localBin = "$env:USERPROFILE\.local\bin"
    if ((Test-Path "$localBin\claude.exe")) {
        $userPath = [System.Environment]::GetEnvironmentVariable('PATH','User')
        if ($userPath -notlike "*$localBin*") {
            [System.Environment]::SetEnvironmentVariable('PATH', "$localBin;$userPath", 'User')
            Write-Host "  added to user PATH: $localBin"
        }
    }
    # Remove any stale npm-shim claude.bat that would shadow the standalone exe
    npm uninstall -g @anthropic-ai/claude-code 2>$null | Out-Null
    Refresh-Path
}

# ---------- 3. Codex - OpenAI official npm package ----------
Step 'Codex (OpenAI - @openai/codex)'
if (Has 'codex') {
    Write-Host ('  installed: {0}' -f (Ver 'codex'))
    npm update -g @openai/codex 2>&1 | Select-Object -Last 3 | ForEach-Object { Write-Host "  $_" }
} else {
    Write-Host '  installing...'
    npm install -g @openai/codex 2>&1 | Select-Object -Last 5 | ForEach-Object { Write-Host "  $_" }
}

# ---------- 4. OpenCode - SST official, WinGet on Windows ----------
Step 'OpenCode (SST - winget SST.opencode)'
if (Has 'opencode') {
    Write-Host ('  installed: {0}' -f (Ver 'opencode'))
    winget upgrade --id SST.opencode --silent --accept-package-agreements --accept-source-agreements 2>&1 | Select-Object -Last 3 | ForEach-Object { Write-Host "  $_" }
} else {
    Write-Host '  installing...'
    winget install --id SST.opencode --silent --accept-package-agreements --accept-source-agreements 2>&1 | Select-Object -Last 5 | ForEach-Object { Write-Host "  $_" }
    Refresh-Path
    if (Has 'opencode') { Write-Host ('  post-install: {0}' -f (Ver 'opencode')) }
}

# ---------- 5. Droid - Factory official installer ----------
Step 'Droid (Factory - app.factory.ai)'
if (Has 'droid') {
    Write-Host ('  installed: {0}' -f (Ver 'droid'))
    droid update 2>&1 | Select-Object -Last 3 | ForEach-Object { Write-Host "  $_" }
} else {
    # Try multiple official install paths in order of likelihood; Factory has changed URLs.
    $installed = $false
    Write-Host '  trying npm @factory-ai/droid...'
    npm install -g @factory-ai/droid 2>&1 | Select-Object -Last 3 | ForEach-Object { Write-Host "  $_" }
    Refresh-Path
    if (Has 'droid') { $installed = $true }

    if (-not $installed) {
        Write-Host '  npm did not yield a droid binary; trying npm @factory-ai/cli...'
        npm install -g @factory-ai/cli 2>&1 | Select-Object -Last 3 | ForEach-Object { Write-Host "  $_" }
        Refresh-Path
        if (Has 'droid') { $installed = $true }
    }

    if (-not $installed) {
        Write-Host '  npm fallbacks failed. Visit https://docs.factory.ai/cli for the current installer.' -ForegroundColor Yellow
        Write-Host '  Droid will remain uninstalled - skip without aborting.' -ForegroundColor Yellow
    }
}

# ---------- 6. Pi - Mario Zechner's official package (badlogic/pi-mono) ----------
Step 'Pi (Mario Zechner - @mariozechner/pi-coding-agent)'
if (Has 'pi') {
    Write-Host ('  installed: {0}' -f (Ver 'pi'))
    npm update -g '@mariozechner/pi-coding-agent' 2>&1 | Select-Object -Last 3 | ForEach-Object { Write-Host "  $_" }
} else {
    Write-Host '  installing...'
    npm install -g '@mariozechner/pi-coding-agent' 2>&1 | Select-Object -Last 5 | ForEach-Object { Write-Host "  $_" }
}

# ---------- 7. Cline - VS Code extension only (no public npm CLI) ----------
Step 'Cline (cline.bot - VS Code extension)'
if (Has 'cline') {
    Write-Host ('  installed: {0}' -f (Ver 'cline'))
} else {
    Write-Host '  Cline is primarily a VS Code extension - no public npm CLI as of writing.' -ForegroundColor Yellow
    Write-Host '  To install: VS Code -> Extensions -> search "Cline" by saoudrizwan, click Install.'
    Write-Host '  ollama launch will continue to show Cline as "(not installed)" - safe to ignore.'
}

# ---------- 8. Ollama models - local pulls ----------
$mode = if ($Light) { 'LIGHT' } else { 'FULL' }
Step "Ollama models - local pulls (mode: $mode)"
Write-Host ('  ollama: {0}' -f (Ver 'ollama'))
$existing = (ollama list 2>$null | Select-Object -Skip 1 | ForEach-Object { ($_ -split '\s+')[0] })

# Always pull: small embed (RAG/search, ~274 MB).
# korpohermes-prime moved to cloud section - it's a cloud-backed custom model
# (zero local cost); see step 9 below.
$alwaysModels = @('nomic-embed-text:latest')

# Heavy local + custom - skipped on -Light nodes (T5500 runs Docker/brain-mcp)
$heavyModels = @(
    'gemma2:latest',                                 # 5.4 GB
    'gemma3:1b',                                     # 815 MB
    'qwen2.5:7b',                                    # 4.7 GB
    'qwen2.5-coder:7b',                              # 4.7 GB
    'qwen3.5:latest',                                # 6.6 GB
    'joshlcoleman/dateapp:latest',                   # 2.0 GB Joshua's
    'joshlcoleman/dateapp-marketing:latest',         # 2.0 GB
    'joshlcoleman/CFO-Until-No-Kid-In-Need:latest'   # 2.0 GB
)

$toPull = $alwaysModels
if (-not $Light) { $toPull += $heavyModels }
else { Write-Host '  (light mode - skipping heavy local + custom models)' -ForegroundColor Yellow }

foreach ($m in $toPull) {
    if ($m -in $existing) {
        Write-Host "  $m : already present"
    } else {
        Write-Host "  $m : pulling..."
        ollama pull $m 2>&1 | Select-Object -Last 1 | ForEach-Object { Write-Host "    $_" }
    }
}

# ---------- 9. Ollama Cloud models (zero local compute/disk) ----------
Step 'Ollama Cloud models'
$cloudModels = @(
    'jeffreyvandekorput/korpohermes-prime:latest',  # Joshua's preferred default brain (cloud-backed)
    'minimax-m2.7:cloud',                            # confirmed in OpenClaw gateway log
    'glm-4.6:cloud'                                  # per CLAUDE.md GLM token policy
)
Write-Host '  Cloud models require `ollama signin` to be done at least once.'
foreach ($m in $cloudModels) {
    Write-Host "  $m : pulling cloud alias..."
    $out = ollama pull $m 2>&1 | Out-String
    if ($out -match 'unauthorized|signin|sign in') {
        Write-Host "    skipped - run 'ollama signin' on this node first" -ForegroundColor Yellow
        break
    } else {
        Write-Host ('    {0}' -f (($out -split "`n") | Select-Object -Last 1).Trim())
    }
}

# ---------- 10. Build local Modelfile if present (CFO PRIME) - full mode only ----------
Step 'Local Modelfile (./Modelfile -> CFO-PRIME)'
$mf = 'c:\antigravity\Modelfile'
if ($Light) {
    Write-Host '  (light mode - skipped)' -ForegroundColor Yellow
} elseif (Test-Path $mf) {
    if ('cfo-prime:latest' -in $existing) {
        Write-Host '  cfo-prime:latest : already built (use `ollama rm cfo-prime` then re-run to rebuild)'
    } else {
        Write-Host '  building cfo-prime from Modelfile...'
        ollama create cfo-prime -f $mf 2>&1 | Select-Object -Last 3 | ForEach-Object { Write-Host "  $_" }
    }
} else {
    Write-Host '  no Modelfile at c:\antigravity\Modelfile - skipped'
}

# ---------- 11. Final verification ----------
Step 'Verification - what `ollama launch` will see'
$results = @()
foreach ($cmd in 'claude','codex','opencode','droid','pi','cline','ollama','node','npm','python','winget') {
    $loc = (Get-Command $cmd -ErrorAction SilentlyContinue).Source
    if ($loc) {
        $results += [PSCustomObject]@{ Tool=$cmd; Status='OK'; Version=(Ver $cmd); Path=$loc }
    } else {
        $results += [PSCustomObject]@{ Tool=$cmd; Status='MISSING'; Version=''; Path='' }
    }
}
$results | Format-Table Tool,Status,Version -AutoSize

Step 'Ollama models present'
ollama list 2>&1 | Select-Object -First 25

$still = ($results | Where-Object { $_.Status -eq 'MISSING' }).Tool
if ($still) {
    Write-Host "`nStill missing: $($still -join ', ')" -ForegroundColor Yellow
    Write-Host 'Fixes: open a new shell to refresh PATH, or restart Windows for installer-based tools.' -ForegroundColor Yellow
} else {
    Write-Host "`nAll components installed and updated." -ForegroundColor Green
    Write-Host 'Run `ollama launch` to see the agent menu - every entry should now lack the "(not installed)" tag.'
}
