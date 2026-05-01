# scripts/bootstrap-agent-stack.ps1
# Install + update the ANTIGRAVITY agent CLI stack on a Windows node from
# OFFICIAL sources (no 3rd-party wrappers). Idempotent — safe to re-run.
# After a clean run, every agent in `ollama launch` shows as installed.
#
# Usage (local):  powershell -ExecutionPolicy Bypass -File C:\Antigravity\scripts\bootstrap-agent-stack.ps1
# Usage (remote): ssh joshl@<node> "powershell -ExecutionPolicy Bypass -File C:\Antigravity\scripts\bootstrap-agent-stack.ps1"

$ErrorActionPreference = 'Continue'
$ProgressPreference    = 'SilentlyContinue'

function Step($msg) { Write-Host "`n=== $msg ===" -ForegroundColor Cyan }
function Has($cmd)  { [bool](Get-Command $cmd -ErrorAction SilentlyContinue) }
function Ver($cmd)  { try { ((& $cmd --version 2>$null) -join ' ').Trim() } catch { '' } }

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
    throw 'Prereqs missing — abort.'
}

# ---------- 2. Claude Code — official Anthropic installer ----------
Step 'Claude Code (Anthropic — claude.ai/install.ps1)'
if (Has 'claude') {
    Write-Host ('  installed: {0}' -f (Ver 'claude'))
    Write-Host '  updating...'
    claude update 2>&1 | Select-Object -Last 5 | ForEach-Object { Write-Host "  $_" }
} else {
    Write-Host '  installing...'
    irm https://claude.ai/install.ps1 | iex
}

# ---------- 3. Codex — OpenAI official npm package ----------
Step 'Codex (OpenAI — @openai/codex)'
if (Has 'codex') {
    Write-Host ('  installed: {0}' -f (Ver 'codex'))
    npm update -g @openai/codex 2>&1 | Select-Object -Last 3 | ForEach-Object { Write-Host "  $_" }
} else {
    Write-Host '  installing...'
    npm install -g @openai/codex 2>&1 | Select-Object -Last 5 | ForEach-Object { Write-Host "  $_" }
}

# ---------- 4. OpenCode — SST official, WinGet on Windows ----------
Step 'OpenCode (SST — winget SST.opencode)'
if (Has 'opencode') {
    Write-Host ('  installed: {0}' -f (Ver 'opencode'))
    winget upgrade --id SST.opencode --silent --accept-package-agreements --accept-source-agreements 2>&1 | Select-Object -Last 3 | ForEach-Object { Write-Host "  $_" }
} else {
    Write-Host '  installing...'
    winget install --id SST.opencode --silent --accept-package-agreements --accept-source-agreements 2>&1 | Select-Object -Last 5 | ForEach-Object { Write-Host "  $_" }
}

# ---------- 5. Droid — Factory official installer ----------
Step 'Droid (Factory — app.factory.ai)'
if (Has 'droid') {
    Write-Host ('  installed: {0}' -f (Ver 'droid'))
    droid update 2>&1 | Select-Object -Last 3 | ForEach-Object { Write-Host "  $_" }
} else {
    Write-Host '  installing via Factory PowerShell installer...'
    try {
        irm https://app.factory.ai/cli/install.ps1 | iex
    } catch {
        Write-Host "  Factory PS installer failed: $_" -ForegroundColor Yellow
        Write-Host '  Fallback: try `npm install -g @factory-ai/droid` or visit https://docs.factory.ai/cli'
    }
}

# ---------- 6. Pi — Mario Zechner's official package (badlogic/pi-mono) ----------
Step 'Pi (Mario Zechner — @mariozechner/pi-coding-agent)'
if (Has 'pi') {
    Write-Host ('  installed: {0}' -f (Ver 'pi'))
    npm update -g '@mariozechner/pi-coding-agent' 2>&1 | Select-Object -Last 3 | ForEach-Object { Write-Host "  $_" }
} else {
    Write-Host '  installing...'
    npm install -g '@mariozechner/pi-coding-agent' 2>&1 | Select-Object -Last 5 | ForEach-Object { Write-Host "  $_" }
}

# ---------- 7. Cline — official npm CLI ----------
Step 'Cline (cline.bot — @cline/cli)'
if (Has 'cline') {
    Write-Host ('  installed: {0}' -f (Ver 'cline'))
    npm update -g '@cline/cli' 2>&1 | Select-Object -Last 3 | ForEach-Object { Write-Host "  $_" }
} else {
    Write-Host '  installing...'
    npm install -g '@cline/cli' 2>&1 | Select-Object -Last 5 | ForEach-Object { Write-Host "  $_" }
    if (-not (Has 'cline')) {
        Write-Host '  @cline/cli may not exist as a public package; Cline is primarily a VS Code extension.' -ForegroundColor Yellow
        Write-Host '  Skipping. If Cline CLI is needed, check https://github.com/cline/cline for current install.' -ForegroundColor Yellow
    }
}

# ---------- 8. Ollama itself — keep current ----------
Step 'Ollama (already a prereq — checking version)'
Write-Host ('  ollama: {0}' -f (Ver 'ollama'))
Write-Host '  (Ollama updates are handled by the Ollama installer itself; not auto-updated here.)'

# ---------- 9. Final verification ----------
Step 'Verification — what `ollama launch` will see'
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

$still = ($results | Where-Object { $_.Status -eq 'MISSING' }).Tool
if ($still) {
    Write-Host "`nStill missing: $($still -join ', ')" -ForegroundColor Yellow
    Write-Host 'Fixes: open a new shell to refresh PATH, or restart Windows for installer-based tools.' -ForegroundColor Yellow
} else {
    Write-Host "`nAll components installed and updated." -ForegroundColor Green
    Write-Host 'Run `ollama launch` to see the agent menu — every entry should now lack the "(not installed)" tag.'
}
