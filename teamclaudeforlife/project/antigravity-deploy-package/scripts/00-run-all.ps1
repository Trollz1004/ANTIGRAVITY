param([switch]$SkipPush)
$ErrorActionPreference = 'Stop'
$PackageRoot = $PSScriptRoot
$RepoRoot = 'C:\ANTIGRAVITY'

function Header($msg) { Write-Host "`n$('='*60)`n  $msg`n$('='*60)" -ForegroundColor Cyan }
function OK($msg)     { Write-Host "[OK]   $msg" -ForegroundColor Green }
function FAIL($msg)   { Write-Host "[FAIL] $msg" -ForegroundColor Red }
function INFO($msg)   { Write-Host "[INFO] $msg" -ForegroundColor Yellow }

$results = @{}

Header "ANTIGRAVITY Deploy Package — 00-run-all.ps1"
INFO "Repo: $RepoRoot"
INFO "Package: $PackageRoot"
INFO "Date: $(Get-Date -Format 'yyyy-MM-ddTHH:mm:ssZ')"

Set-Location $RepoRoot

$scripts = @(
  "01-inspect-state.ps1",
  "02-fix-hermes-config.ps1",
  "03-fix-watchdog.ps1",
  "04-resolve-audit.ps1",
  "05-validate-all.ps1"
)

foreach ($script in $scripts) {
  $path = Join-Path $PackageRoot $script
  Header "Running: $script"
  try {
    & pwsh -NoProfile -ExecutionPolicy Bypass -File $path
    if ($LASTEXITCODE -ne 0) {
      FAIL "$script exited with code $LASTEXITCODE"
      $results[$script] = "FAIL"
    } else {
      OK "$script completed"
      $results[$script] = "PASS"
    }
  } catch {
    FAIL "$script threw: $($_.Exception.Message)"
    $results[$script] = "FAIL"
  }
}

Header "Summary"
$allPassed = $true
foreach ($k in $results.Keys) {
  if ($results[$k] -eq "PASS") { OK "$k" } else { FAIL "$k"; $allPassed = $false }
}

if (-not $allPassed) {
  FAIL "One or more steps failed. Stopping before push. Fix above errors and re-run."
  exit 1
}

if ($SkipPush) {
  INFO "SkipPush flag set — skipping commit and push."
  exit 0
}

Header "Running: 06-commit-and-push.ps1"
& pwsh -NoProfile -ExecutionPolicy Bypass -File (Join-Path $PackageRoot "06-commit-and-push.ps1")
if ($LASTEXITCODE -ne 0) {
  FAIL "Push step failed. Review output above."
  exit 1
}

OK "All steps complete. ANTIGRAVITY is live."
