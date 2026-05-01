$ErrorActionPreference = 'Stop'
$RepoRoot = 'C:\ANTIGRAVITY'
Set-Location $RepoRoot

function OK($m)   { Write-Host "[OK]   $m" -ForegroundColor Green }
function WARN($m) { Write-Host "[WARN] $m" -ForegroundColor Yellow }
function INFO($m) { Write-Host "[INFO] $m" -ForegroundColor Cyan }
function SEP()    { Write-Host ("-"*55) }

Write-Host "`n=== 01-inspect-state.ps1 ===" -ForegroundColor Cyan

SEP
INFO "Git state"
$branch = git branch --show-current
$remote  = git remote get-url origin 2>$null
$localHead  = git rev-parse HEAD
$remoteHead = git rev-parse origin/main 2>$null

Write-Host "  Branch:       $branch"
Write-Host "  Remote:       $remote"
Write-Host "  Local HEAD:   $localHead"
Write-Host "  Remote HEAD:  $remoteHead"

if ($branch -ne "main") { Write-Host "[WARN] Not on main — currently on: $branch" -ForegroundColor Yellow }
else { OK "On branch main" }

if ($localHead -ne $remoteHead) {
  WARN "Local and remote HEAD differ. Run: git fetch origin && git log --oneline origin/main -10"
  git log --oneline -8
  Write-Host "--- origin/main ---"
  git log --oneline origin/main -8
} else {
  OK "Local HEAD matches origin/main"
}

SEP
INFO "Git status"
git status --short

SEP
INFO "Last 8 commits"
git log --oneline -8

SEP
INFO "Hermes config path detection"
$candidates = @(
  "C:\Users\joshl\.hermes\config.yaml",
  "C:\Users\joshl\AppData\Local\hermes\config.yaml"
)
$found = @()
foreach ($p in $candidates) {
  if (Test-Path $p) { OK "EXISTS: $p"; $found += $p }
  else { WARN "MISSING: $p" }
}
if ($found.Count -eq 0) { Write-Host "[FAIL] Neither Hermes config path exists." -ForegroundColor Red }
if ($found.Count -gt 1) { WARN "Both config paths exist — ambiguity. Script 02 will resolve." }

SEP
INFO "CEO agent files"
$ceoFiles = @("AGENTS.md","HEARTBEAT.md","SOUL.md","TOOLS.md","SKILLS.md")
foreach ($f in $ceoFiles) {
  $fp = "C:\ANTIGRAVITY\paperclip\agents\ceo\$f"
  if (Test-Path $fp) { OK $fp } else { Write-Host "[MISS] $fp" -ForegroundColor Red }
}

SEP
INFO "Service quick-check (non-blocking)"
$checks = @{
  "Hermes :5555"  = "http://127.0.0.1:5555"
  "Paperclip :3100" = "http://127.0.0.1:3100/api/health"
}
foreach ($name in $checks.Keys) {
  try {
    $null = Invoke-RestMethod -Uri $checks[$name] -TimeoutSec 5
    OK "$name reachable"
  } catch {
    WARN "$name not reachable (may need autostart)"
  }
}

SEP
INFO "Cloudflare tunnel process"
$tunnel = Get-CimInstance Win32_Process -ErrorAction SilentlyContinue |
  Where-Object { $_.CommandLine -like '*paperclip-hq.yml*' } | Select-Object -First 1
if ($tunnel) { OK "Cloudflare tunnel running (PID $($tunnel.ProcessId))" }
else { WARN "Cloudflare tunnel not running" }

SEP
INFO "Open GitHub security issues (requires gh CLI)"
try { gh issue list --label security --state open 2>&1 }
catch { WARN "gh CLI not available or not authenticated" }

Write-Host "`n[DONE] 01-inspect-state.ps1 complete" -ForegroundColor Green
exit 0
