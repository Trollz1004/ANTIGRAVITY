$ErrorActionPreference = 'Stop'
$RepoRoot = 'C:\ANTIGRAVITY'
Set-Location $RepoRoot

function OK($m)   { Write-Host "[OK]   $m" -ForegroundColor Green }
function INFO($m) { Write-Host "[INFO] $m" -ForegroundColor Cyan }
function WARN($m) { Write-Host "[WARN] $m" -ForegroundColor Yellow }

Write-Host "`n=== 04-resolve-audit.ps1 ===" -ForegroundColor Cyan

# ── 1. Fetch latest remote state ─────────────────────────────────────────────
INFO "Fetching origin..."
git fetch origin 2>&1 | ForEach-Object { Write-Host "  $_" }

$localHead  = git rev-parse HEAD
$remoteHead = git rev-parse origin/main

INFO "Local  HEAD: $localHead"
INFO "Remote HEAD: $remoteHead"

# ── 2. Check for auto-revert commit from github-actions[bot] ─────────────────
$revertCommit = git log --oneline origin/main -20 |
  Where-Object { $_ -match 'github-actions\[bot\]|auto-revert|revert unauthorized|skip ci' } |
  Select-Object -First 1

if ($revertCommit) {
  INFO "Auto-revert commit found on origin/main: $revertCommit"
} else {
  INFO "No auto-revert commit detected on origin/main in last 20 commits"
}

# ── 3. If remote is ahead, pull (fast-forward only) ──────────────────────────
$behind = git rev-list HEAD..origin/main --count
$behind = [int]($behind.Trim())

if ($behind -gt 0) {
  INFO "Local is $behind commit(s) behind origin/main. Pulling..."
  git pull origin main --ff-only 2>&1 | ForEach-Object { Write-Host "  $_" }
  OK "Pulled $behind commit(s) from origin/main"
} else {
  OK "Local is up to date with origin/main"
}

# ── 4. Check HEARTBEAT.md files state ────────────────────────────────────────
INFO "Checking HEARTBEAT.md files..."
$localHeartbeats = Get-ChildItem "$RepoRoot\paperclip\agents" -Recurse -Filter "HEARTBEAT.md" -ErrorAction SilentlyContinue
if ($localHeartbeats.Count -eq 0) {
  WARN "No HEARTBEAT.md files present locally after pull."
  WARN "If HEARTBEATs are desired, they will be committed in Step 06 alongside the watchdog fix."
  WARN "The watchdog fix commit itself will trigger the audit, but it's an authorized push."
} else {
  OK "HEARTBEAT.md files present: $($localHeartbeats.Count) found"
  $localHeartbeats | ForEach-Object { Write-Host "  $($_.FullName.Replace($RepoRoot,''))" }
}

# Check if remote main has them
$remoteCeoHeartbeat = git show origin/main:paperclip/agents/ceo/HEARTBEAT.md 2>$null
if ($LASTEXITCODE -eq 0) {
  OK "origin/main has paperclip/agents/ceo/HEARTBEAT.md"
} else {
  WARN "origin/main does NOT have paperclip/agents/ceo/HEARTBEAT.md"
  WARN "If desired, it will be added in the watchdog fix commit."
}

# ── 5. Show diff between local and remote for ceo/ folder ────────────────────
INFO "Diff: local vs origin/main in paperclip/agents/ceo/"
$diff = git diff origin/main -- paperclip/agents/ceo/ 2>&1
if ($diff) { $diff | ForEach-Object { Write-Host "  $_" } }
else       { OK "No diff in paperclip/agents/ceo/ vs origin/main" }

# ── 6. Close open security issues via gh CLI ─────────────────────────────────
INFO "Checking for open security issues to close..."
try {
  $issues = gh issue list --label security --state open --json number,title 2>$null |
    ConvertFrom-Json -ErrorAction SilentlyContinue
  if ($issues -and $issues.Count -gt 0) {
    foreach ($issue in $issues) {
      WARN "Open security issue #$($issue.number): $($issue.title)"
      WARN "Close it after push with:"
      WARN "  gh issue close $($issue.number) --comment 'Resolved: watchdog path fixed, HEARTBEAT.md state reconciled. Commit pushed and CI passing.'"
    }
  } else {
    OK "No open security issues with label 'security'"
  }
} catch {
  WARN "gh CLI not available or not authenticated. Check issues manually at:"
  WARN "https://github.com/Trollz1004/ANTIGRAVITY/issues?q=label:security+state:open"
}

Write-Host "`n[DONE] 04-resolve-audit.ps1 complete" -ForegroundColor Green
exit 0
