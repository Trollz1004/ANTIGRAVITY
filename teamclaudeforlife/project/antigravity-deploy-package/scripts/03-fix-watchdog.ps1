$ErrorActionPreference = 'Stop'
$RepoRoot   = 'C:\ANTIGRAVITY'
$WorkflowFile = "C:\ANTIGRAVITY\.github\workflows\hermes-integrity-watchdog.yml"
$FixedFile    = Join-Path $PSScriptRoot "..\workflows\hermes-integrity-watchdog-FIXED.yml"
Set-Location $RepoRoot

function OK($m)   { Write-Host "[OK]   $m" -ForegroundColor Green }
function FAIL($m) { Write-Host "[FAIL] $m" -ForegroundColor Red }
function INFO($m) { Write-Host "[INFO] $m" -ForegroundColor Cyan }
function WARN($m) { Write-Host "[WARN] $m" -ForegroundColor Yellow }

Write-Host "`n=== 03-fix-watchdog.ps1 ===" -ForegroundColor Cyan

if (-not (Test-Path $WorkflowFile)) {
  FAIL "Workflow file not found: $WorkflowFile"
  exit 1
}

# ── Option A: drop in the pre-fixed file ─────────────────────────────────────
if (Test-Path $FixedFile) {
  INFO "Pre-fixed workflow file found. Applying drop-in replacement..."
  Copy-Item $FixedFile $WorkflowFile -Force
  OK "Replaced $WorkflowFile with fixed version"
} else {
  # ── Option B: patch in-place ──────────────────────────────────────────────
  INFO "Patching watchdog workflow in-place..."
  $content = Get-Content $WorkflowFile -Raw

  # Verify the bad path is still there before patching
  if ($content -notmatch 'paperclip-9020') {
    OK "Workflow already patched — paperclip-9020 not found. Nothing to do."
    exit 0
  }

  # Fix on.push.paths and on.pull_request.paths trigger globs
  $content = $content -replace "'paperclip-9020/agents/hermes-ceo/\*\*\.md'",
                                "'paperclip/agents/ceo/**.md'"
  # Remove non-existent config JSON trigger paths
  $content = $content -replace "\s+'paperclip-9020/config/integrity-watchdog\.json'", ""
  $content = $content -replace "\s+'paperclip-9020/config/adapter-allowlist\.json'", ""
  $content = $content -replace "\s+'paperclip-9020/config/plugins\.json'", ""

  # Fix git diff path filter in Extract diff step
  $content = $content -replace "'paperclip-9020/agents/hermes-ceo/\*\.md'",
                                "'paperclip/agents/ceo/*.md'"
  $content = $content -replace "\s+'paperclip-9020/config/integrity-watchdog\.json'\\", ""
  $content = $content -replace "\s+'paperclip-9020/config/adapter-allowlist\.json'\\", ""
  $content = $content -replace "\s+'paperclip-9020/config/plugins\.json'", ""

  # Fix sha256sum targets
  $content = $content -replace 'paperclip-9020/agents/hermes-ceo/AGENTS\.md',    'paperclip/agents/ceo/AGENTS.md'
  $content = $content -replace 'paperclip-9020/agents/hermes-ceo/TOOLS\.md',     'paperclip/agents/ceo/TOOLS.md'
  $content = $content -replace 'paperclip-9020/agents/hermes-ceo/HEARTBEAT\.md', 'paperclip/agents/ceo/HEARTBEAT.md'
  $content = $content -replace 'paperclip-9020/agents/hermes-ceo/SOUL\.md',      'paperclip/agents/ceo/SOUL.md'
  $content = $content -replace 'paperclip-9020/agents/hermes-ceo/SKILLS\.md',    'paperclip/agents/ceo/SKILLS.md'
  # Remove non-existent config JSON from sha256sum
  $content = $content -replace '\s+paperclip-9020/config/integrity-watchdog\.json \\', ''
  $content = $content -replace '\s+paperclip-9020/config/adapter-allowlist\.json \\', ''
  $content = $content -replace '\s+paperclip-9020/config/plugins\.json \\', ''

  Set-Content $WorkflowFile $content -Encoding UTF8
  OK "Watchdog workflow patched in-place"
}

# ── Verify no paperclip-9020 references remain ───────────────────────────────
$verify = Get-Content $WorkflowFile -Raw
if ($verify -match 'paperclip-9020') {
  FAIL "paperclip-9020 reference still present in workflow! Manual review needed."
  Select-String -Path $WorkflowFile -Pattern 'paperclip-9020'
  exit 1
} else {
  OK "No paperclip-9020 references remain in workflow"
}

INFO "Resulting CEO paths in watchdog:"
Select-String -Path $WorkflowFile -Pattern 'paperclip/agents/ceo' |
  ForEach-Object { Write-Host "  $($_.Line.Trim())" }

Write-Host "`n[DONE] 03-fix-watchdog.ps1 complete" -ForegroundColor Green
exit 0
