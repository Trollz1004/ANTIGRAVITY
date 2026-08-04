# Quick verify before deploying
# Josh runs this to confirm F:\ANTIGRAVITY is ready

Write-Host "=== F:\ANTIGRAVITY Pre-Deploy Verification ===" -ForegroundColor Cyan

$repo = "F:\ANTIGRAVITY"
cd $repo

# 1. Git
Write-Host "`n1. Git Status" -ForegroundColor Green
$status = git status --porcelain
if ($status) { Write-Host "[FAIL] Uncommitted changes found"; exit 1 }
Write-Host "[OK] Clean"
git log --oneline -1

# 2. Key Files
Write-Host "`n2. Production Files" -ForegroundColor Green
@(
    "backend/server.py",
    "scripts/silent-watchdog-t5500.ps1",
    "graphify-out/graph.html",
    "omniroute/config",
    "mission-control-v5/package.json",
    "frontend/react-app/package.json"
) | ForEach-Object {
    if (Test-Path $_) { Write-Host "[OK] $_" } else { Write-Host "[FAIL] MISSING: $_"; exit 1 }
}

# 3. Repo Size
Write-Host "`n3. Repo Size" -ForegroundColor Green
$size = (Get-ChildItem -Recurse -File -ErrorAction SilentlyContinue | Measure-Object -Sum Length).Sum
$mb = [math]::Round($size/1MB, 0)
Write-Host "[OK] $mb MB (target ~150 MB)"
if ($mb -gt 300) { Write-Host "[FAIL] TOO LARGE"; exit 1 }

# 4. Graphify Endpoints
Write-Host "`n4. Graphify Integration" -ForegroundColor Green
$graphify = Select-String -Path backend/server.py -Pattern "graphify" | Measure-Object | Select-Object -ExpandProperty Count
if ($graphify -ge 2) { Write-Host "[OK] Graphify endpoints wired" } else { Write-Host "[FAIL] Graphify missing"; exit 1 }

# 5. Watchdog Script
Write-Host "`n5. Watchdog Script" -ForegroundColor Green
$ports = Select-String -Path scripts/silent-watchdog-t5500.ps1 -Pattern "20128|3151|3200" | Measure-Object | Select-Object -ExpandProperty Count
if ($ports -ge 3) { Write-Host "[OK] Critical ports monitored" } else { Write-Host "[FAIL] Port config"; exit 1 }

# 6. Scheduled Task Script
Write-Host "`n6. Task Registration Script" -ForegroundColor Green
if (Test-Path scripts/register-silent-watchdog-task.ps1) { Write-Host "[OK] Present" } else { Write-Host "[FAIL] Missing"; exit 1 }

Write-Host "`n=== ALL CHECKS PASSED ===" -ForegroundColor Green
Write-Host "`nNext: (1) Test services  (2) Register watchdog  (3) Reboot  (4) Verify logs"

