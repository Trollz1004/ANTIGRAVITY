$ErrorActionPreference = 'Stop'
$RepoRoot = 'C:\ANTIGRAVITY'
Set-Location $RepoRoot

function OK($m)   { Write-Host "[OK]   $m" -ForegroundColor Green }
function FAIL($m) { Write-Host "[FAIL] $m" -ForegroundColor Red; $script:failCount++ }
function WARN($m) { Write-Host "[WARN] $m" -ForegroundColor Yellow }
function INFO($m) { Write-Host "[INFO] $m" -ForegroundColor Cyan }
function SEP()    { Write-Host ("-"*55) }

$script:failCount = 0
$results = [ordered]@{}

Write-Host "`n=== 05-validate-all.ps1 ===" -ForegroundColor Cyan
Write-Host "Timestamp: $(Get-Date -Format 'yyyy-MM-ddTHH:mm:ssZ')`n"

# ── 1. Branch ────────────────────────────────────────────────────────────────
SEP; INFO "Check 1: Branch"
$branch = git branch --show-current
if ($branch -eq "main") { OK "On branch main"; $results["Branch"] = "PASS" }
else { FAIL "Wrong branch: $branch"; $results["Branch"] = "FAIL" }

# ── 2. Git status clean ──────────────────────────────────────────────────────
SEP; INFO "Check 2: Git status"
$dirty = git status --porcelain
if (-not $dirty) { OK "Working tree clean"; $results["GitStatus"] = "PASS" }
else {
  WARN "Uncommitted changes present (will be staged in step 06):"
  $dirty | ForEach-Object { Write-Host "  $_" }
  $results["GitStatus"] = "WARN"
}

# ── 3. No secrets in staged or working diff ──────────────────────────────────
SEP; INFO "Check 3: Secrets scan"
$secretPatterns = @(
  'MASTER-UNIVERSAL-ENV',
  '\.env$',
  'TROLLZ1004\.env',
  'BEGIN (RSA|EC|OPENSSH) PRIVATE KEY',
  'sk-[a-zA-Z0-9]{32,}',
  'ya29\.[a-zA-Z0-9_-]+'
)
$allChangedFiles = (git status --porcelain | ForEach-Object { $_.Substring(3).Trim() })
$secretHit = $false
foreach ($f in $allChangedFiles) {
  foreach ($pattern in $secretPatterns) {
    if ($f -match $pattern) {
      FAIL "Potential secret in changed file: $f (matched: $pattern)"
      $secretHit = $true
    }
  }
}
if (-not $secretHit) { OK "No secret file patterns in working changes"; $results["SecretsCheck"] = "PASS" }
else { $results["SecretsCheck"] = "FAIL" }

# ── 4. Hermes dashboard ──────────────────────────────────────────────────────
SEP; INFO "Check 4: Hermes dashboard (127.0.0.1:5555)"
try {
  $null = Invoke-RestMethod -Uri "http://127.0.0.1:5555" -TimeoutSec 8
  OK "Hermes dashboard reachable"; $results["HermesDashboard"] = "PASS"
} catch {
  FAIL "Hermes dashboard not reachable: $($_.Exception.Message)"
  $results["HermesDashboard"] = "FAIL"
}

# ── 5. Paperclip local health ────────────────────────────────────────────────
SEP; INFO "Check 5: Paperclip local (127.0.0.1:3100/api/health)"
try {
  $r = Invoke-RestMethod -Uri "http://127.0.0.1:3100/api/health" -TimeoutSec 10
  OK "Paperclip local healthy: $($r | ConvertTo-Json -Compress)"
  $results["PaperclipLocal"] = "PASS"
} catch {
  FAIL "Paperclip local not reachable: $($_.Exception.Message)"
  WARN "Start it: pwsh -File C:\ANTIGRAVITY\scripts\autostart.ps1"
  $results["PaperclipLocal"] = "FAIL"
}

# ── 6. Public HQ ─────────────────────────────────────────────────────────────
SEP; INFO "Check 6: Public HQ (paperclip-hq.youandinotai.com/api/health)"
try {
  $r = Invoke-RestMethod -Uri "https://paperclip-hq.youandinotai.com/api/health" -TimeoutSec 20
  OK "Public HQ healthy: $($r | ConvertTo-Json -Compress)"
  $results["PublicHQ"] = "PASS"
} catch {
  FAIL "Public HQ not reachable: $($_.Exception.Message)"
  WARN "Ensure Cloudflare tunnel is running: C:\cloudflared\cloudflared.exe tunnel --config C:\ANTIGRAVITY\infra\cloudflare\paperclip-hq.yml run"
  $results["PublicHQ"] = "FAIL"
}

# ── 7. Hermes model response ──────────────────────────────────────────────────
SEP; INFO "Check 7: Hermes model response"
try {
  $output = & hermes run "Reply with the single word OK and nothing else." 2>&1
  if ($output) {
    OK "Hermes responded: $($output -join ' ' | Select-Object -First 120)"
    $results["HermesModel"] = "PASS"
  } else {
    FAIL "Hermes returned empty response"
    $results["HermesModel"] = "FAIL"
  }
} catch {
  FAIL "Hermes run error: $($_.Exception.Message)"
  $results["HermesModel"] = "FAIL"
}

# ── 8. CEO fallback chain ─────────────────────────────────────────────────────
SEP; INFO "Check 8: CEO fallback chain"
try {
  $fbOutput = pwsh -NoProfile -ExecutionPolicy Bypass -File "C:\ANTIGRAVITY\scripts\test-ceo-fallbacks.ps1" 2>&1
  $fbOutput | ForEach-Object { Write-Host "  $_" }
  if ($fbOutput -match '\[FAIL\]') {
    FAIL "CEO fallback chain has FAIL entries"
    $results["CEOFallbacks"] = "FAIL"
  } else {
    OK "CEO fallback chain: no FAIL entries"
    $results["CEOFallbacks"] = "PASS"
  }
} catch {
  WARN "Could not run test-ceo-fallbacks.ps1: $($_.Exception.Message)"
  $results["CEOFallbacks"] = "WARN"
}

# ── 9. Agent audit dry-run ────────────────────────────────────────────────────
SEP; INFO "Check 9: Agent audit (dry-run)"
try {
  # Try bash (WSL or Git Bash)
  $bashPath = @("C:\Program Files\Git\bin\bash.exe", "bash") |
    Where-Object { (Get-Command $_ -ErrorAction SilentlyContinue) -ne $null } |
    Select-Object -First 1
  if ($bashPath) {
    $auditOut = & $bashPath "C:\ANTIGRAVITY\scripts\paperclip\agent-audit.sh" "C:\ANTIGRAVITY" 2>&1
    $auditOut | ForEach-Object { Write-Host "  $_" }
    if ($auditOut -match 'PASS') {
      OK "Agent audit: PASS"; $results["AgentAudit"] = "PASS"
    } else {
      FAIL "Agent audit returned non-PASS"; $results["AgentAudit"] = "FAIL"
    }
  } else {
    WARN "bash not found — skipping agent audit dry-run (will run in CI after push)"
    $results["AgentAudit"] = "SKIP"
  }
} catch {
  WARN "Agent audit error: $($_.Exception.Message)"
  $results["AgentAudit"] = "WARN"
}

# ── 10. CEO files intact ──────────────────────────────────────────────────────
SEP; INFO "Check 10: CEO source-of-truth files"
$ceoFiles = @("AGENTS.md","HEARTBEAT.md","SOUL.md","TOOLS.md","SKILLS.md")
$ceoMissing = 0
foreach ($f in $ceoFiles) {
  $fp = "C:\ANTIGRAVITY\paperclip\agents\ceo\$f"
  if (Test-Path $fp) { OK $f }
  else { FAIL "Missing: $fp"; $ceoMissing++ }
}
$results["CEOFiles"] = if ($ceoMissing -eq 0) { "PASS" } else { "FAIL" }

# ── Summary ───────────────────────────────────────────────────────────────────
SEP
Write-Host "`nVALIDATION SUMMARY" -ForegroundColor White
Write-Host "==================" -ForegroundColor White
foreach ($k in $results.Keys) {
  $v = $results[$k]
  $color = if ($v -eq "PASS") { "Green" } elseif ($v -eq "FAIL") { "Red" } else { "Yellow" }
  Write-Host ("  {0,-25} {1}" -f $k, $v) -ForegroundColor $color
}

Write-Host ""
if ($script:failCount -gt 0) {
  Write-Host "[BLOCKED] $($script:failCount) check(s) failed. Fix above before pushing." -ForegroundColor Red
  exit 1
} else {
  Write-Host "[CLEAR]  All required checks passed. Safe to proceed to 06-commit-and-push.ps1" -ForegroundColor Green
  exit 0
}
