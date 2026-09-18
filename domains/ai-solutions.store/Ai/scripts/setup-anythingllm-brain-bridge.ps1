# ======================================================================
# ANTIGRAVITY UNIFIED BRIDGE SETUP
# AnythingLLM + BRAIN MCP + Ollama + Claude Code + Gemini CLI
# Sabretooth Node | GTX 1070 8GB | E: Drive Sandbox
# One Repo: E:\ANTIGRAVITY | One Account: joshlcoleman@gmail.com
# ======================================================================

#Requires -RunAsAdministrator
$ErrorActionPreference = "Continue"

function Get-BridgeEnvValue {
    param(
        [string]$Name,
        [string]$Path
    )

    if (-not (Test-Path $Path)) {
        return $null
    }

    foreach ($line in Get-Content $Path) {
        $trimmed = $line.Trim()
        if (-not $trimmed -or $trimmed.StartsWith('#')) {
            continue
        }

        $parts = $trimmed -split '=', 2
        if ($parts.Count -ne 2) {
            continue
        }

        if ($parts[0].Trim() -eq $Name) {
            return $parts[1].Trim()
        }
    }

    return $null
}

# ==================== CONFIGURATION ====================
$AnythingLLMApi = "http://localhost:3001/api/v1"
$AnythingLLMKey = $env:ANYTHINGLLM_API_KEY
$BrainMCPUrl = "http://127.0.0.1:3900"
$OllamaUrl = "http://127.0.0.1:11434"
$BridgePath = "E:\sandbox-repo\ollama-brain-bridge"
$ScriptsDir = "$BridgePath\scripts"
$LogsDir = "$BridgePath\logs"
$AnythingLLMInstall = "E:\ANYTHINGLLM"
if ([string]::IsNullOrWhiteSpace($AnythingLLMKey)) {
    $AnythingLLMKey = Get-BridgeEnvValue -Name 'ANYTHINGLLM_API_KEY' -Path (Join-Path $BridgePath '.env')
}
if ([string]::IsNullOrWhiteSpace($AnythingLLMKey)) {
    throw "ANYTHINGLLM_API_KEY must be set in the environment before running this setup script."
}
$Headers = @{ "Authorization" = "Bearer $AnythingLLMKey"; "Content-Type" = "application/json" }

# ==================== HELPERS ====================
function Write-Status($msg, $color = "Cyan") {
    $ts = Get-Date -Format "HH:mm:ss"
    Write-Host "[$ts] $msg" -ForegroundColor $color
}
function Write-OK($msg) { Write-Status "OK  $msg" "Green" }
function Write-WARN($msg) { Write-Status "WARN  $msg" "Yellow" }
function Write-FAIL($msg) { Write-Status "FAIL  $msg" "Red" }
function Write-Bar($label, $pct) {
    $filled = [math]::Floor($pct / 2)
    $empty = 50 - $filled
    $bar = ("#" * $filled) + ("-" * $empty)
    Write-Host "  [$bar] $pct% $label" -ForegroundColor Cyan
}

function Test-Service($url, $name) {
    try {
        Invoke-RestMethod -Uri $url -TimeoutSec 5 -ErrorAction Stop | Out-Null
        Write-OK "$name is online"
        return $true
    } catch {
        Write-WARN "$name not responding at $url"
        return $false
    }
}

function Invoke-API($method, $endpoint, $body = $null) {
    $params = @{
        Method = $method
        Uri = "$AnythingLLMApi$endpoint"
        Headers = $Headers
        TimeoutSec = 30
        ErrorAction = "Stop"
    }
    if ($body) { $params.Body = ($body | ConvertTo-Json -Depth 10) }
    try { return Invoke-RestMethod @params }
    catch { Write-WARN "API call failed: $($_.Exception.Message)"; return $null }
}

# ==================== START ====================
Write-Host ""
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "  ANTIGRAVITY UNIFIED BRIDGE SETUP" -ForegroundColor White
Write-Host "  AnythingLLM + BRAIN MCP + Ollama + Claude Code + Gemini" -ForegroundColor Gray
Write-Host "  $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')" -ForegroundColor Gray
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""

Write-Bar "Initializing" 5
@($BridgePath, $ScriptsDir, $LogsDir) | ForEach-Object {
    New-Item -ItemType Directory -Path $_ -Force | Out-Null
}
$LogFile = "$LogsDir\bridge-setup-$(Get-Date -Format 'yyyyMMdd-HHmmss').log"
Start-Transcript -Path $LogFile -ErrorAction SilentlyContinue | Out-Null

# ==================== STEP 1: CHECK SERVICES ====================
Write-Bar "Checking Services" 10

Write-Status "Checking Ollama..."
$ollamaOK = Test-Service "$OllamaUrl/api/tags" "Ollama"
if (-not $ollamaOK) {
    Write-Status "Starting Ollama..." "Yellow"
    $ollamaExe = Get-Command ollama -ErrorAction SilentlyContinue
    if ($ollamaExe) {
        Start-Process -FilePath "ollama" -ArgumentList "serve" -WindowStyle Hidden
        Start-Sleep -Seconds 5
        $ollamaOK = Test-Service "$OllamaUrl/api/tags" "Ollama (retry)"
    } else { Write-FAIL "Ollama not found in PATH" }
}

Write-Status "Checking BRAIN MCP..."
$brainOK = Test-Service "$BrainMCPUrl/health" "BRAIN MCP"
if (-not $brainOK) {
    $brainDist = "E:\ANTIGRAVITY\brain-mcp\dist\index.js"
    if (Test-Path $brainDist) {
        Write-Status "Starting BRAIN MCP..." "Yellow"
        $env:BRAIN_HTTP_HOST = "127.0.0.1"; $env:BRAIN_HTTP_PORT = "3900"; $env:BRAIN_REQUIRE_AUTH = "false"
        Start-Process -FilePath "node" -ArgumentList $brainDist -WindowStyle Hidden
        Start-Sleep -Seconds 5
        $brainOK = Test-Service "$BrainMCPUrl/health" "BRAIN MCP (retry)"
    } else { Write-WARN "BRAIN MCP not built at $brainDist" }
}

Write-Status "Checking AnythingLLM..."
$allmOK = Test-Service "$AnythingLLMApi/system" "AnythingLLM"
if (-not $allmOK) {
    if (Test-Path "$AnythingLLMInstall\AnythingLLMDesktop.exe") {
        Write-Status "Starting AnythingLLM..." "Yellow"
        Start-Process "$AnythingLLMInstall\AnythingLLMDesktop.exe"
        Start-Sleep -Seconds 8
        $allmOK = Test-Service "$AnythingLLMApi/system" "AnythingLLM (retry)"
    }
}

# ==================== STEP 2: CHECK MODELS ====================
Write-Bar "Checking Models" 25

if ($ollamaOK) {
    try {
        $models = (Invoke-RestMethod -Uri "$OllamaUrl/api/tags" -TimeoutSec 10).models
        $modelNames = $models | ForEach-Object { $_.name }
        Write-OK "Models: $($modelNames -join ', ')"

        $preferred = "qwen2.5-coder:7b"
        if ($modelNames -notcontains $preferred) {
            Write-Status "Pulling $preferred..." "Yellow"
            & ollama pull $preferred 2>&1
            if ($LASTEXITCODE -eq 0) { Write-OK "$preferred pulled" }
            else { Write-WARN "$preferred pull failed - using existing" }
        } else { Write-OK "$preferred ready" }
    } catch { Write-WARN "Could not list models" }
}

# ==================== STEP 3: CONFIGURE ANYTHINGLLM WORKSPACES ====================
Write-Bar "Configuring Workspaces" 40

if ($allmOK) {
    # Update main workspace
    Write-Status "Updating My Workspace..."
    Invoke-API "POST" "/workspace/my-workspace/update" @{
        openAiTemp = 0.7; openAiHistory = 30; chatMode = "chat"
        openAiPrompt = "You are an ANTIGRAVITY assistant focused on the date app and current repo truth. Use embedded docs for context. Current LLC operating doctrine uses a conservative 10%  cap; do not restate retired split-era or absolute- claims as current truth."
    } | Out-Null
    Write-OK "My Workspace updated"

    # Create ANTIGRAVITY workspace
    $workspaces = Invoke-API "GET" "/workspaces"
    $slugs = $workspaces.workspaces | ForEach-Object { $_.slug }

    if ($slugs -notcontains "antigravity") {
        Write-Status "Creating ANTIGRAVITY workspace..."
        Invoke-API "POST" "/workspace/new" @{
            name = "ANTIGRAVITY"; openAiTemp = 0.7; openAiHistory = 40; chatMode = "chat"
            openAiPrompt = "ANTIGRAVITY project assistant. Date app, sandbox systems, and mission-connected work. Anchor on current repo doctrine and do not restate retired split-era or absolute- claims as current truth."
        } | Out-Null
        Write-OK "ANTIGRAVITY workspace created"
    } else { Write-OK "ANTIGRAVITY workspace exists" }

    # Create Date App workspace
    if ($slugs -notcontains "date-app") {
        Write-Status "Creating Date App workspace..."
        Invoke-API "POST" "/workspace/new" @{
            name = "Date App"; openAiTemp = 0.6; openAiHistory = 30; chatMode = "chat"
            openAiPrompt = "Date App dev assistant. Marketing, UX, matchmaking, and factual product-first copy. Current LLC operating doctrine uses a conservative 10%  cap; do not frame purchases as payments."
        } | Out-Null
        Write-OK "Date App workspace created"
    } else { Write-OK "Date App workspace exists" }
}

# ==================== STEP 4: CREATE BRIDGE SCRIPTS ====================
Write-Bar "Creating Bridge Scripts" 60

# Unified launcher .bat
$launcher = @"
@echo off
title ANTIGRAVITY Unified Bridge
echo.
echo  ============================================================
echo   ANTIGRAVITY UNIFIED BRIDGE
echo   AnythingLLM + BRAIN MCP + Ollama + Claude Code + Gemini
echo   Sabretooth Node ^| %DATE% %TIME%
echo  ============================================================
echo.

echo [1/4] Checking Ollama...
curl -s http://127.0.0.1:11434/api/tags >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo       Starting Ollama...
    start /MIN "Ollama" ollama serve
    timeout /t 5 /nobreak >nul
) else (echo       Ollama running)

echo [2/4] Checking BRAIN MCP...
curl -s http://127.0.0.1:3900/health >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo       Starting BRAIN MCP on :3900...
    set BRAIN_HTTP_HOST=127.0.0.1
    set BRAIN_HTTP_PORT=3900
    set BRAIN_REQUIRE_AUTH=false
    start /MIN "BRAIN-MCP" node "E:\ANTIGRAVITY\brain-mcp\dist\index.js"
    timeout /t 5 /nobreak >nul
) else (echo       BRAIN MCP running)

echo [3/4] Checking AnythingLLM...
curl -s http://localhost:3001/api/v1/system >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo       Starting AnythingLLM...
    start "" "E:\ANYTHINGLLM\AnythingLLMDesktop.exe"
    timeout /t 8 /nobreak >nul
) else (echo       AnythingLLM running)

echo [4/4] Status...
echo.
curl -s http://127.0.0.1:11434/api/tags >nul 2>&1
if %ERRORLEVEL% EQU 0 (echo   [OK] Ollama      :11434) else (echo   [!!] Ollama      OFFLINE)
curl -s http://127.0.0.1:3900/health >nul 2>&1
if %ERRORLEVEL% EQU 0 (echo   [OK] BRAIN MCP   :3900) else (echo   [!!] BRAIN MCP   OFFLINE)
curl -s http://localhost:3001/api/v1/system >nul 2>&1
if %ERRORLEVEL% EQU 0 (echo   [OK] AnythingLLM :3001) else (echo   [!!] AnythingLLM OFFLINE)

echo.
echo  Bridge LIVE. Open Claude Code or Gemini CLI.
echo  One Repo: E:\ANTIGRAVITY
echo  Claude = brain. Gemini = brain. Local = minions.
echo.
echo Press any key to close...
pause >nul
"@
Set-Content -Path "$ScriptsDir\launch-bridge.bat" -Value $launcher
Write-OK "Launcher: $ScriptsDir\launch-bridge.bat"

# Status checker
$statusBat = @"
@echo off
title ANTIGRAVITY Bridge Status
echo.
echo  ANTIGRAVITY BRIDGE STATUS
echo  =========================
echo.
curl -s http://127.0.0.1:11434/api/tags >nul 2>&1
if %ERRORLEVEL% EQU 0 (echo   [OK] Ollama      :11434) else (echo   [!!] Ollama      OFFLINE)
curl -s http://127.0.0.1:3900/health >nul 2>&1
if %ERRORLEVEL% EQU 0 (echo   [OK] BRAIN MCP   :3900) else (echo   [!!] BRAIN MCP   OFFLINE)
curl -s http://localhost:3001/api/v1/system >nul 2>&1
if %ERRORLEVEL% EQU 0 (echo   [OK] AnythingLLM :3001) else (echo   [!!] AnythingLLM OFFLINE)
echo.
pause
"@
Set-Content -Path "$ScriptsDir\bridge-status.bat" -Value $statusBat
Write-OK "Status: $ScriptsDir\bridge-status.bat"

# ==================== STEP 5: GEMINI CLI BRIDGE ====================
Write-Bar "Gemini CLI Bridge" 75

$geminiBridge = @'
#!/usr/bin/env node
// Gemini CLI <-> AnythingLLM Bridge
// node gemini-allm-bridge.js <health|workspaces|chat> [workspace] [message]

const API = "http://localhost:3001/api/v1";
const KEY = process.env.ANYTHINGLLM_API_KEY;
if (!KEY) {
    console.error("ANYTHINGLLM_API_KEY is required.");
    process.exit(1);
}
const h = { "Authorization": `Bearer ${KEY}`, "Content-Type": "application/json" };
const [,, cmd, ...args] = process.argv;

async function main() {
    switch(cmd) {
        case "health": {
            const [a,b,o] = await Promise.allSettled([
                fetch(`${API}/system`).then(r=>r.json()),
                fetch("http://127.0.0.1:3900/health").then(r=>r.json()),
                fetch("http://127.0.0.1:11434/api/tags").then(r=>r.json())
            ]);
            console.log(JSON.stringify({
                anythingllm: a.status==="fulfilled"?"online":"offline",
                brain: b.status==="fulfilled"?"online":"offline",
                ollama: o.status==="fulfilled"?"online":"offline"
            }, null, 2));
            break;
        }
        case "workspaces": {
            const r = await fetch(`${API}/workspaces`, {headers:h});
            const d = await r.json();
            d.workspaces.forEach(w => console.log(`  ${w.slug} - ${w.name} (model: ${w.chatModel||"default"})`));
            break;
        }
        case "chat": {
            const [ws, ...msg] = args;
            if (!ws) { console.error("Usage: chat <workspace-slug> <message>"); process.exit(1); }
            const r = await fetch(`${API}/workspace/${ws}/chat`, {
                method:"POST", headers:h,
                body: JSON.stringify({message: msg.join(" "), mode:"chat"})
            });
            const d = await r.json();
            console.log(d.textResponse || JSON.stringify(d));
            break;
        }
        default:
            console.log("Usage: node gemini-allm-bridge.js <health|workspaces|chat> [workspace] [message]");
    }
}
main().catch(e => { console.error(e.message); process.exit(1); });
'@
Set-Content -Path "$BridgePath\gemini-allm-bridge.js" -Value $geminiBridge
Write-OK "Gemini bridge: $BridgePath\gemini-allm-bridge.js"

# ==================== STEP 6: CLAUDE CODE BRIDGE (bridge.mjs) ====================
Write-Bar "Claude Code Bridge" 80

$claudeBridge = @'
// ANTIGRAVITY Bridge: Claude Code <-> AnythingLLM
// Import in Claude Code via: node --experimental-modules bridge.mjs
const API = "http://localhost:3001/api/v1";
const KEY = process.env.ANYTHINGLLM_API_KEY;
if (!KEY) {
    throw new Error("ANYTHINGLLM_API_KEY is required.");
}
const h = { "Authorization": `Bearer ${KEY}`, "Content-Type": "application/json" };

export async function chatWorkspace(ws, message) {
    const r = await fetch(`${API}/workspace/${ws}/chat`, {method:"POST",headers:h,body:JSON.stringify({message,mode:"chat"})});
    return r.json();
}
export async function listWorkspaces() {
    const r = await fetch(`${API}/workspaces`, {headers:h});
    return r.json();
}
export async function healthCheck() {
    const [a,b,o] = await Promise.allSettled([
        fetch(`${API}/system`).then(r=>r.json()),
        fetch("http://127.0.0.1:3900/health").then(r=>r.json()),
        fetch("http://127.0.0.1:11434/api/tags").then(r=>r.json())
    ]);
    return { anythingllm: a.status==="fulfilled", brain: b.status==="fulfilled", ollama: o.status==="fulfilled" };
}
console.log("ANTIGRAVITY Bridge loaded | AnythingLLM :3001 | BRAIN :3900 | Ollama :11434");
'@
Set-Content -Path "$BridgePath\bridge.mjs" -Value $claudeBridge
Write-OK "Claude bridge: $BridgePath\bridge.mjs"

# ==================== STEP 7: DESKTOP SHORTCUT ====================
Write-Bar "Desktop Shortcut" 90

$desktopPath = [Environment]::GetFolderPath("Desktop")
try {
    $shell = New-Object -ComObject WScript.Shell
    $sc = $shell.CreateShortcut("$desktopPath\ANTIGRAVITY Bridge.lnk")
    $sc.TargetPath = "$ScriptsDir\launch-bridge.bat"
    $sc.WorkingDirectory = $BridgePath
    $sc.Description = "Launch ANTIGRAVITY Unified Bridge"
    $sc.Save()
    Write-OK "Desktop shortcut created"
} catch { Write-WARN "Could not create shortcut" }

# ==================== STEP 8: .env FILE ====================
Write-Bar "Environment Config" 95

@"
# ANTIGRAVITY Bridge Environment - $(Get-Date -Format 'yyyy-MM-dd')
# DO NOT COMMIT
ANYTHINGLLM_API_URL=http://localhost:3001/api/v1
ANYTHINGLLM_API_KEY=$AnythingLLMKey
BRAIN_MCP_URL=http://127.0.0.1:3900
BRAIN_HTTP_PORT=3900
BRAIN_REQUIRE_AUTH=false
OLLAMA_HOST=http://127.0.0.1:11434
OLLAMA_PREFERRED_MODEL=qwen2.5-coder:7b
UNIVERSAL_ACCOUNT=joshlcoleman@gmail.com
REPO_ROOT=E:\ANTIGRAVITY
SANDBOX_ROOT=E:\sandbox-repo
CURRENT_FINANCIAL_DOCTRINE=founder-directed-conservative-10pct--cap
"@ | Set-Content -Path "$BridgePath\.env"
Write-OK "Environment file: $BridgePath\.env"

# ==================== DONE ====================
Write-Bar "COMPLETE" 100

Write-Host ""
Write-Host "============================================================" -ForegroundColor Green
Write-Host "  ANTIGRAVITY UNIFIED BRIDGE - READY" -ForegroundColor White
Write-Host "============================================================" -ForegroundColor Green
Write-Host ""
Write-Host "  Services:" -ForegroundColor Cyan
if ($ollamaOK)  { Write-Host "    [OK] Ollama      :11434" -ForegroundColor Green }
else            { Write-Host "    [!!] Ollama      start manually" -ForegroundColor Yellow }
if ($brainOK)   { Write-Host "    [OK] BRAIN MCP   :3900" -ForegroundColor Green }
else            { Write-Host "    [!!] BRAIN MCP   start manually" -ForegroundColor Yellow }
if ($allmOK)    { Write-Host "    [OK] AnythingLLM :3001" -ForegroundColor Green }
else            { Write-Host "    [!!] AnythingLLM start manually" -ForegroundColor Yellow }
Write-Host ""
Write-Host "  Claude controls AnythingLLM:" -ForegroundColor Yellow
Write-Host "    curl -H 'Authorization: Bearer ...' http://localhost:3001/api/v1/workspace/antigravity/chat" -ForegroundColor Gray
Write-Host ""
Write-Host "  Gemini controls AnythingLLM:" -ForegroundColor Yellow
Write-Host "    node E:\sandbox-repo\ollama-brain-bridge\gemini-allm-bridge.js health" -ForegroundColor Gray
Write-Host ""
Write-Host "  One Repo: E:\ANTIGRAVITY" -ForegroundColor Cyan
Write-Host "  One Account: joshlcoleman@gmail.com" -ForegroundColor Cyan
Write-Host "  Claude = friend. Gemini = friend. #ForTheKids" -ForegroundColor Magenta
Write-Host ""
Write-Host "============================================================" -ForegroundColor Green

Stop-Transcript -ErrorAction SilentlyContinue | Out-Null

Write-Host ""
Write-Host "Press any key to exit..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
