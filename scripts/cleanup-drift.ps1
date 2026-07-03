# cleanup-drift.ps1 — Remove drift files, stale configs, zombie processes
# DRY RUN by default. Pass -Execute to actually delete.
# Usage: pwsh -NoProfile -File scripts/cleanup-drift.ps1
#        pwsh -NoProfile -File scripts/cleanup-drift.ps1 -Execute

param(
  [switch]$Execute
)

$ErrorActionPreference = 'Continue'

if (-not $Execute) {
  Write-Host "=== DRY RUN — pass -Execute to actually delete ===" -ForegroundColor Yellow
}

$removed = 0

function Remove-Drift($path, $reason) {
  if (Test-Path $path) {
    if ($Execute) {
      Remove-Item -Path $path -Recurse -Force -Confirm:$false
      Write-Host "  REMOVED  $path — $reason" -ForegroundColor Red
    } else {
      Write-Host "  WOULD REMOVE  $path — $reason" -ForegroundColor Yellow
    }
    $script:removed++
  }
}

Write-Host "`n=== ZOMBIE PROCESSES ===" -ForegroundColor Cyan
$zombies = Get-Process -Name "claude" -ErrorAction SilentlyContinue | Where-Object { $_.CPU -lt 1 -and $_.WorkingSet64 -gt 500MB }
if ($zombies) {
  Write-Host "  Found $($zombies.Count) zombie claude.exe processes (>500MB, idle)" -ForegroundColor Yellow
  if ($Execute) {
    $zombies | Stop-Process -Force
    Write-Host "  Killed $($zombies.Count) zombies" -ForegroundColor Red
  }
} else {
  Write-Host "  No zombie processes" -ForegroundColor Green
}

Write-Host "`n=== PAPERCLIP UUID FOLDERS (unused agent configs) ===" -ForegroundColor Cyan
$pcBase = "C:\Users\joshl\.paperclip\instances\default"
if (Test-Path $pcBase) {
  # Find company folders
  $companies = Get-ChildItem "$pcBase\companies" -Directory -ErrorAction SilentlyContinue
  foreach ($c in $companies) {
    # Check for agent folders with UUID names that have no recent heartbeat
    $agentDirs = Get-ChildItem "$($c.FullName)\acpx-local\agents" -Directory -ErrorAction SilentlyContinue
    foreach ($ad in $agentDirs) {
      $heartbeat = Join-Path $ad.FullName "HEARTBEAT.md"
      if (-not (Test-Path $heartbeat)) {
        Write-Host "  STALE  $($ad.FullName) — no HEARTBEAT.md" -ForegroundColor Yellow
      }
    }
  }
  # Workspace UUID folders
  $workspaces = Get-ChildItem "$pcBase\workspaces" -Directory -ErrorAction SilentlyContinue
  Write-Host "  Found $($workspaces.Count) workspace folders in .paperclip" -ForegroundColor White
}

Write-Host "`n=== STALE WORKTREES ===" -ForegroundColor Cyan
$worktrees = Get-ChildItem "C:\antigravity\.claude\worktrees" -Directory -ErrorAction SilentlyContinue
foreach ($wt in $worktrees) {
  Write-Host "  WORKTREE  $($wt.Name)" -ForegroundColor Yellow
}

Write-Host "`n=== QUARANTINE (Copilot drift) ===" -ForegroundColor Cyan
$copilotDrift = "C:\Users\joshl\OneDrive\Microsoft Copilot Chat Files"
if (Test-Path $copilotDrift) {
  $count = (Get-ChildItem $copilotDrift -Recurse -File -ErrorAction SilentlyContinue).Count
  Write-Host "  $count files in Copilot Chat drift folder (quarantined, not deleted)" -ForegroundColor Yellow
}

Write-Host "`n=== TEMP/CACHE CLEANUP ===" -ForegroundColor Cyan
# Node modules caches that bloat
$nmCaches = @(
  "C:\antigravity\node_modules\.cache"
)
foreach ($c in $nmCaches) {
  Remove-Drift $c "stale build cache"
}

Write-Host "`n=== SUMMARY ===" -ForegroundColor White
Write-Host "Items flagged: $removed" -ForegroundColor $(if ($removed -eq 0) { 'Green' } else { 'Yellow' })
if (-not $Execute -and $removed -gt 0) {
  Write-Host "Run with -Execute to actually remove" -ForegroundColor Yellow
}
