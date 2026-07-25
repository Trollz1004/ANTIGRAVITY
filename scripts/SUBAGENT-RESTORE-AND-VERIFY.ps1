# SUBAGENT-RESTORE-AND-VERIFY.ps1  (written by claude, 2026-07-07)
# Purpose: restore main's true history (66c8390) lost to a force-push from a stale
#          clone, replay Gordon's Docker commits on top, then run safe Docker
#          cleanup + boot verification. Logs everything.
# Usage:
#   Step 1:  powershell -ExecutionPolicy Bypass -File E:\ANTIGRAVITY\scripts\SUBAGENT-RESTORE-AND-VERIFY.ps1
#   Step 2 (only if Step 1 prints PREPARED_OK):
#            powershell -ExecutionPolicy Bypass -File E:\ANTIGRAVITY\scripts\SUBAGENT-RESTORE-AND-VERIFY.ps1 -Push
param([switch]$Push)

$ErrorActionPreference = 'Continue'
$repo   = 'E:\ANTIGRAVITY'
$oldTip = '66c839034cb86ab6ee09838733d5b90c1b2006d8'   # true main tip before force-push
$gordon = @('940d0d3b','78272ada')                      # Gordon's commits, oldest first
$rbr    = 'restore/main-66c8390'
$logDir = Join-Path $repo 'logs'
if (!(Test-Path $logDir)) { New-Item -ItemType Directory -Path $logDir | Out-Null }
$log    = Join-Path $logDir ('subagent-restore-' + (Get-Date -Format 'yyyy-MM-dd') + '.log')
function L($m){ $line = (Get-Date -Format 'HH:mm:ss') + '  ' + $m; $line | Tee-Object -FilePath $log -Append }

Set-Location $repo
L '=== SUBAGENT START ==='
L ('mode: ' + $(if($Push){'PUSH'}else{'PREPARE'}))

# ---------- PHASE 0: safety checks ----------
$obj = git cat-file -t $oldTip 2>$null
if ($obj -ne 'commit') { L "FATAL: old tip $oldTip not in local object store. STOP. (Recovery source: 9020 clone.)"; exit 1 }
L 'old tip object present locally: YES'
git fetch origin --prune 2>&1 | Out-Null
L ('remote main now: ' + (git log origin/main -1 --format='%h %s'))
$dirty = (git status --porcelain | Measure-Object).Count
L ("working tree dirty files: $dirty")
if ($dirty -gt 0 -and -not $Push) { L 'NOTE: dirty tree — restore uses a separate branch, working tree untouched until checkout. Continuing.' }

# ---------- PHASE 1: build restored branch ----------
if (-not $Push) {
  git branch -D $rbr 2>$null | Out-Null
  git branch $rbr $oldTip 2>&1 | ForEach-Object { L $_ }
  # replay Gordon's commits onto true history in a temp worktree (keeps main checkout untouched)
  $wt = 'C:\agent-worktrees\restore-main'
  git worktree remove $wt --force 2>$null | Out-Null
  git worktree add $wt $rbr 2>&1 | ForEach-Object { L $_ }
  Push-Location $wt
  $ok = $true
  foreach ($c in $gordon) {
    git cherry-pick $c 2>&1 | ForEach-Object { L $_ }
    if ($LASTEXITCODE -ne 0) { L "CHERRY-PICK CONFLICT on $c — aborting pick, branch left at last good commit."; git cherry-pick --abort 2>$null; $ok = $false; break }
    L ("cherry-picked $c OK")
  }
  L ('restored branch tip: ' + (git log -1 --format='%h %s'))
  Pop-Location
  if ($ok) {
    L 'PREPARED_OK — review then rerun with -Push to restore main on GitHub.'
    L ("push command that -Push will run: git push origin ${rbr}:main --force-with-lease=main")
  } else {
    L 'PREPARED_WITH_CONFLICT — Gordon commits need manual replay. True history branch exists: ' 
    L ("  $rbr @ $oldTip  (pushing this alone still restores the 913 commits, minus Gordon docker work)")
  }
}

# ---------- PHASE 2: push (explicit opt-in) ----------
if ($Push) {
  $wt = 'C:\agent-worktrees\restore-main'
  if (Test-Path $wt) { Push-Location $wt } else { Push-Location $repo }
  git push origin ("$rbr" + ':main') --force-with-lease=main 2>&1 | ForEach-Object { L $_ }
  if ($LASTEXITCODE -eq 0) { L 'MAIN RESTORED on origin. Old Gordon-only tip preserved in this log + reflog.' }
  else { L 'PUSH FAILED (auth or lease). Nothing changed remotely. If auth: push from an authed session.' }
  Pop-Location
}

# ---------- PHASE 3: docker safe cleanup (NEVER volumes) ----------
L '--- docker cleanup (containers/images/build-cache only; volumes untouched) ---'
docker container prune -f 2>&1 | ForEach-Object { L $_ }
docker image prune -f     2>&1 | Select-Object -Last 2 | ForEach-Object { L $_ }
docker builder prune -f   2>&1 | Select-Object -Last 2 | ForEach-Object { L $_ }
L '--- docker df after cleanup ---'
docker system df 2>&1 | ForEach-Object { L $_ }

# ---------- PHASE 4: stack up + health polls ----------
L '--- compose up -d ---'
docker-compose --env-file .env.docker up -d 2>&1 | Select-Object -Last 6 | ForEach-Object { L $_ }
$targets = @(
  @{n='workspace :3000'; u='http://127.0.0.1:3000/'},
  @{n='gateway  :8642';  u='http://127.0.0.1:8642/health'},
  @{n='dashbrd  :9119';  u='http://127.0.0.1:9119/api/status'}
)
for ($i=1; $i -le 12; $i++) {
  $states = @()
  foreach ($t in $targets) {
    try { $r = Invoke-WebRequest -Uri $t.u -UseBasicParsing -TimeoutSec 5; $states += ($t.n + '=UP(' + $r.StatusCode + ')') }
    catch { $states += ($t.n + '=down') }
  }
  L ("poll $i/12: " + ($states -join '  '))
  if (($states -join '') -notmatch 'down') { L 'ALL SERVICES HEALTHY'; break }
  Start-Sleep -Seconds 30
}

# ---------- PHASE 5: env + task sanity ----------
if (Test-Path "$repo\.env.docker") {
  $keys = (Select-String -Path "$repo\.env.docker" -Pattern '^[A-Z0-9_]*API_KEY\s*=\s*\S' -ErrorAction SilentlyContinue | ForEach-Object { ($_.Line -split '=')[0].Trim() })
  L ('.env.docker populated key NAMES: ' + $(if($keys){$keys -join ', '}else{'NONE — Hermes chat will fail until an LLM key is set'}))
} else { L '.env.docker MISSING — copy .env.docker.example and fill keys' }
schtasks /query /tn 'ANTIGRAVITY-Bootstrap' 2>$null | Select-Object -Last 2 | ForEach-Object { L $_ }
L ('docker ps: ' + ((docker ps --format '{{.Names}}' 2>$null) -join ', '))
L '=== SUBAGENT END ==='
Write-Host "`nFull log: $log"