# verify-all-nodes.ps1 — Full infrastructure health check
# Run from any node. Tests ALL ports, services, CLIs.
# Usage: pwsh -NoProfile -File scripts/verify-all-nodes.ps1

$ErrorActionPreference = 'Continue'

$sabretooth = '192.168.0.8'
$node9020 = '192.168.0.5'
$results = @()
$pass = 0
$fail = 0

function Test-Endpoint($name, $url, $timeout = 5) {
  try {
    $r = Invoke-WebRequest -Uri $url -UseBasicParsing -TimeoutSec $timeout -ErrorAction Stop
    $script:pass++
    Write-Host "  PASS  $name" -ForegroundColor Green
    return $true
  } catch {
    $script:fail++
    Write-Host "  FAIL  $name — $($_.Exception.Message)" -ForegroundColor Red
    return $false
  }
}

function Test-CLI($name, $cmd) {
  try {
    $r = Invoke-Expression "$cmd 2>&1" -ErrorAction Stop
    if ($LASTEXITCODE -eq 0 -or $null -eq $LASTEXITCODE) {
      $script:pass++
      $ver = ($r | Select-Object -First 1).ToString().Trim()
      Write-Host "  PASS  $name — $ver" -ForegroundColor Green
      return $true
    }
  } catch {}
  $script:fail++
  Write-Host "  FAIL  $name — not found or error" -ForegroundColor Red
  return $false
}

function Test-Port($name, $targetHost, $port, $timeout = 3) {
  try {
    $tcp = New-Object System.Net.Sockets.TcpClient
    $connect = $tcp.BeginConnect($targetHost, $port, $null, $null)
    $wait = $connect.AsyncWaitHandle.WaitOne($timeout * 1000, $false)
    if ($wait -and $tcp.Connected) {
      $tcp.Close()
      $script:pass++
      Write-Host "  PASS  $name ($targetHost`:$port)" -ForegroundColor Green
      return $true
    }
    $tcp.Close()
  } catch {}
  $script:fail++
  Write-Host "  FAIL  $name ($targetHost`:$port)" -ForegroundColor Red
  return $false
}

Write-Host "`n=== SABRETOOTH LOCAL (127.0.0.1) ===" -ForegroundColor Cyan
Test-Endpoint "FCC proxy" "http://127.0.0.1:8082/health"
Test-Endpoint "Ollama" "http://127.0.0.1:11434/api/tags"
Test-Endpoint "Hermes router" "http://127.0.0.1:11435/"
Test-Endpoint "Hermes dashboard" "http://127.0.0.1:9119/api/status"
Test-Port "Hermes Workspace" "127.0.0.1" 3000
Test-Port "Paperclip TRO" "127.0.0.1" 3110

Write-Host "`n=== 9020 ($node9020) — Business + Joshua Workspace ===" -ForegroundColor Cyan
Test-Endpoint "Ollama" "http://${node9020}:11434/api/tags"
Test-Port "Paperclip Business" $node9020 3120

Write-Host "`n=== LOCAL CLIs ===" -ForegroundColor Cyan
Test-CLI "fcc-claude" "fcc-claude --version"
Test-CLI "codex" "codex --version"
Test-CLI "grok" "grok --version"
Test-CLI "opencode" "opencode --version"
Test-CLI "pi" "pi --version"
Test-CLI "hermes" "hermes --version"
Test-CLI "cloudflared" "cloudflared --version"
Test-CLI "wrangler" "wrangler --version"
Test-CLI "docker" "docker --version"
Test-CLI "node" "node --version"
Test-CLI "pnpm" "pnpm --version"

Write-Host "`n=== FILE STRUCTURE ===" -ForegroundColor Cyan
$paths = @(
  'C:\antigravity\AGENT-DOCTRINE.md',
  'C:\antigravity\CLAUDE.md',
  'C:\antigravity\paperclip-tro\ROSTER.md',
  'C:\antigravity\paperclip-tro\ADAPTORS.md',
  'C:\antigravity\adapters\claude\manifest.yaml',
  'C:\antigravity\adapters\codex\manifest.yaml',
  'C:\antigravity\adapters\grok\manifest.yaml',
  'C:\antigravity\adapters\gemini\manifest.yaml',
  'C:\antigravity\services\hermes-router\config.yaml',
  'C:\antigravity\opencode\opencode.json'
)
foreach ($p in $paths) {
  if (Test-Path $p) {
    $pass++
    Write-Host "  PASS  $p" -ForegroundColor Green
  } else {
    $fail++
    Write-Host "  FAIL  $p — missing" -ForegroundColor Red
  }
}

# Agent state files
Write-Host "`n=== AGENT STATE FILES ===" -ForegroundColor Cyan
$agents = @('ceo','ant-dev','ant-reviewer','ant-devops','ant-compliance','ant-support','ant-growth','ebay-lister','aisol-dev')
foreach ($a in $agents) {
  $hb = "C:\antigravity\paperclip-tro\agents\$a\HEARTBEAT.md"
  $st = "C:\antigravity\paperclip-tro\agents\$a\STATE.md"
  $ag = "C:\antigravity\paperclip-tro\agents\$a\AGENT.md"
  if ((Test-Path $hb) -and (Test-Path $st) -and (Test-Path $ag)) {
    $pass++
    Write-Host "  PASS  $a (HEARTBEAT+STATE+AGENT)" -ForegroundColor Green
  } else {
    $fail++
    $missing = @()
    if (-not (Test-Path $hb)) { $missing += 'HEARTBEAT' }
    if (-not (Test-Path $st)) { $missing += 'STATE' }
    if (-not (Test-Path $ag)) { $missing += 'AGENT' }
    Write-Host "  FAIL  $a — missing: $($missing -join ', ')" -ForegroundColor Red
  }
}

Write-Host "`n========================================" -ForegroundColor White
Write-Host "TOTAL: $($pass + $fail)  PASS: $pass  FAIL: $fail" -ForegroundColor $(if ($fail -eq 0) { 'Green' } else { 'Yellow' })
Write-Host "========================================`n" -ForegroundColor White

if ($fail -gt 0) { exit 1 } else { exit 0 }
