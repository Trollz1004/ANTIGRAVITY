# ═══════════════════════════════════════════════════════════════
# 9020 GPU Node Bootstrap — Run as Admin in PowerShell 7.5
# Paste this into WhatsApp → open on 9020 → save as .ps1 → run
# ═══════════════════════════════════════════════════════════════

Write-Host ""
Write-Host "  9020 GPU Node Bootstrap" -ForegroundColor Cyan
Write-Host "  Setting up OpenClaw inference server" -ForegroundColor DarkCyan
Write-Host ""

# ── Step 1: Check admin ──────────────────────────────────────
$isAdmin = ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
if (-not $isAdmin) {
    Write-Host "  ERROR: Run this as Administrator!" -ForegroundColor Red
    exit 1
}
Write-Host "  [OK] Running as admin" -ForegroundColor Green

# ── Step 2: Install winget packages ──────────────────────────
Write-Host ""
Write-Host "  Installing core packages via winget..." -ForegroundColor Yellow

$packages = @(
    "OpenJS.NodeJS.LTS",           # Node.js 20 LTS
    "Docker.DockerDesktop",         # Docker Desktop
    "Git.Git",                      # Git
    "Ollama.Ollama"                 # Ollama (local LLM)
)

foreach ($pkg in $packages) {
    Write-Host "  Installing $pkg..." -ForegroundColor DarkCyan
    winget install --id $pkg --accept-source-agreements --accept-package-agreements -e 2>$null
}

# ── Step 3: NVIDIA Driver ────────────────────────────────────
Write-Host ""
Write-Host "  NVIDIA DRIVER — Manual step:" -ForegroundColor Yellow
Write-Host "  After GPU swap (GTX 1070 into 9020):" -ForegroundColor White
Write-Host "    1. Download from nvidia.com/drivers" -ForegroundColor White
Write-Host "    2. Pick: GTX 1070 / Windows 10 64-bit / Game Ready" -ForegroundColor White
Write-Host "    3. Install, reboot" -ForegroundColor White
Write-Host "    4. Verify: nvidia-smi (should show CUDA 12.6)" -ForegroundColor White

# ── Step 4: Claude Code CLI ──────────────────────────────────
Write-Host ""
Write-Host "  Installing Claude Code CLI..." -ForegroundColor Yellow
npm install -g @anthropic-ai/claude-code

# ── Step 5: Create workspace ─────────────────────────────────
Write-Host ""
Write-Host "  Creating workspace..." -ForegroundColor Yellow
$workspace = "c:\antigravity"
if (-not (Test-Path $workspace)) {
    New-Item -ItemType Directory -Path $workspace -Force | Out-Null
}
Write-Host "  [OK] $workspace ready" -ForegroundColor Green

# ── Step 6: PowerShell profile for 9020 ──────────────────────
Write-Host ""
Write-Host "  Writing PowerShell profile..." -ForegroundColor Yellow

$profileContent = @'
# ═══════════════════════════════════════════════════════════════
# PowerShell 7.5 Profile — 9020 GPU Node
# ═══════════════════════════════════════════════════════════════

try {
    $Host.UI.RawUI.BackgroundColor = "DarkGreen"
    $Host.UI.RawUI.ForegroundColor = "White"
    Clear-Host
} catch {}

$Host.UI.RawUI.WindowTitle = "OPUS CLI — 9020 GPU"

function prompt {
    $path = (Get-Location).Path -replace [regex]::Escape($HOME), "~"
    Write-Host "9020" -ForegroundColor Green -NoNewline
    Write-Host " $path" -ForegroundColor Yellow -NoNewline
    Write-Host " >" -ForegroundColor White -NoNewline
    return " "
}

Set-Alias -Name opus -Value claude

function Start-Opus {
    Set-Location c:\antigravity
    claude --dangerously-skip-permissions
}
Set-Alias -Name go -Value Start-Opus

Write-Host ""
Write-Host "  9020 GPU Node — PowerShell 7.5" -ForegroundColor Green
Write-Host "  Role: OpenClaw Inference Server (GTX 1070)" -ForegroundColor DarkGreen
Write-Host "  Type 'go' to launch Claude CLI" -ForegroundColor DarkGreen
Write-Host ""
'@

$profileDir = Split-Path $PROFILE -Parent
if (-not (Test-Path $profileDir)) {
    New-Item -ItemType Directory -Path $profileDir -Force | Out-Null
}
Set-Content -Path $PROFILE -Value $profileContent -Force
Write-Host "  [OK] Profile written to $PROFILE" -ForegroundColor Green

# ── Step 7: Docker compose for inference stack ────────────────
Write-Host ""
Write-Host "  Writing docker-compose for inference stack..." -ForegroundColor Yellow

$composeContent = @'
# 9020 GPU Node — Inference Stack
# Ollama runs native (not in Docker) for GPU access
# This handles Redis + Qdrant only

services:
  redis:
    image: redis:7-alpine
    container_name: redis-9020
    restart: always
    ports:
      - "6379:6379"
    volumes:
      - redis-data:/data
    command: redis-server --maxmemory 512mb --maxmemory-policy allkeys-lru

  qdrant:
    image: qdrant/qdrant:latest
    container_name: qdrant-9020
    restart: always
    ports:
      - "6333:6333"
      - "6334:6334"
    volumes:
      - qdrant-data:/qdrant/storage

volumes:
  redis-data:
  qdrant-data:
'@

$composePath = "$workspace\docker-compose.yml"
Set-Content -Path $composePath -Value $composeContent -Force
Write-Host "  [OK] docker-compose.yml written" -ForegroundColor Green

# ── Step 8: Reminder checklist ────────────────────────────────
Write-Host ""
Write-Host "  ═══════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  AFTER RUNNING THIS SCRIPT:" -ForegroundColor Yellow
Write-Host "  ═══════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""
Write-Host "  1. Swap GPUs (1070 → 9020, 1050 Ti → T5500)" -ForegroundColor White
Write-Host "  2. Install NVIDIA driver + reboot" -ForegroundColor White
Write-Host "  3. Run: nvidia-smi  (verify CUDA 12.6)" -ForegroundColor White
Write-Host "  4. Run: ollama serve  (starts on :11434)" -ForegroundColor White
Write-Host "  5. Run: ollama pull llama3.1  (or whatever model)" -ForegroundColor White
Write-Host "  6. Open Docker Desktop, then:" -ForegroundColor White
Write-Host "     cd c:\antigravity && docker compose up -d" -ForegroundColor White
Write-Host "  7. Copy master .env from 9020 SSD to c:\antigravity\.env" -ForegroundColor White
Write-Host "  8. Clone OpenClaw workspace or copy from T5500" -ForegroundColor White
Write-Host "  9. Run: claude setup-token  (auth to Anthropic)" -ForegroundColor White
Write-Host " 10. Type: go" -ForegroundColor White
Write-Host ""
Write-Host "  Network: T5500 talks to 9020 via LAN IP" -ForegroundColor DarkCyan
Write-Host "  Ollama: http://192.168.0.X:11434" -ForegroundColor DarkCyan
Write-Host "  (set OLLAMA_HOST=0.0.0.0 to allow LAN access)" -ForegroundColor DarkCyan
Write-Host ""
Write-Host "  DONE. Reboot, then run steps above." -ForegroundColor Green

