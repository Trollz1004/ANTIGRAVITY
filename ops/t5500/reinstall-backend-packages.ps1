# Reinstall pinned DateApp backend packages into the T5500 production virtualenv (post-PR 406).
#
# Default (no -Apply): read-only dry-run. Reads domains\youandinotai.com\backend\requirements.txt,
# prints the pinned package counts, and prints the exact pip + health probe commands for T5500.
# With -Apply (for the Judge on T5500): snapshots pip freeze to logs\, runs pip install --no-input -r,
# verifies dependency consistency with pip check, restarts the API if needed, and probes health.
param(
    [switch]$Apply,
    [switch]$RestartApi,
    [string]$RepoPath = '',
    [string]$VenvPython = 'C:\ANTIGRAVITY\backend\.venv\Scripts\python.exe',
    [string]$HealthUrl = 'http://192.168.0.15:8000/api/v1/health'
)

$ErrorActionPreference = 'Stop'
[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12

$Repo = if ($RepoPath) {
    $RepoPath
} elseif (Test-Path 'C:\ANTIGRAVITY\domains\youandinotai.com\backend\requirements.txt') {
    'C:\ANTIGRAVITY'
} else {
    (Resolve-Path (Join-Path $PSScriptRoot '..\..')).Path
}

$RequirementsRel  = 'domains\youandinotai.com\backend\requirements.txt'
$RequirementsPath = Join-Path $Repo $RequirementsRel
$ProdRequirements = Join-Path 'C:\ANTIGRAVITY' $RequirementsRel

if (-not (Test-Path $RequirementsPath)) {
    Write-Error "requirements.txt not found at $RequirementsPath"
    exit 1
}

$rawLines    = @(Get-Content -Path $RequirementsPath -Encoding UTF8)
$activeSpecs = @($rawLines | ForEach-Object { $_.Trim() } | Where-Object { $_ -and -not $_.StartsWith('#') })
$exactPinned = @($activeSpecs | Where-Object { $_ -match '==' })
$rangePinned = @($activeSpecs | Where-Object { $_ -notmatch '==' })

$timestamp    = Get-Date -Format 'yyyyMMdd-HHmmss'
$snapshotPath = "C:\ANTIGRAVITY\logs\backend-pip-freeze-$timestamp.txt"

Write-Host "=================================================================="
Write-Host " T5500 DateApp Backend Pinned Packages Reinstall (Post-PR 406)"
Write-Host "=================================================================="
Write-Host ("Mode:                " + $(if ($Apply) { 'APPLY (live T5500 execution)' } else { 'DRY-RUN (read-only plan; pass -Apply on T5500)' }))
Write-Host ("Repository Root:     " + $Repo)
Write-Host ("Target Venv Python:  " + $VenvPython)
Write-Host ("Requirements File:   " + $RequirementsRel)
Write-Host ("Total Package Specs: " + $activeSpecs.Count + " (" + $exactPinned.Count + " exact == pins, " + $rangePinned.Count + " floor/unpinned specs)")
Write-Host ("Health Probe URL:    " + $HealthUrl)
Write-Host ""

if (-not $Apply) {
    Write-Host "-- ExactPinned Packages ($($exactPinned.Count)) --"
    foreach ($spec in $exactPinned) {
        Write-Host ("  " + $spec)
    }
    if ($rangePinned.Count -gt 0) {
        Write-Host ""
        Write-Host "-- Additional Requirement Specs ($($rangePinned.Count)) --"
        foreach ($spec in $rangePinned) {
            Write-Host ("  " + $spec)
        }
    }
    Write-Host ""
    Write-Host "-- Commands that -Apply will run on T5500 --"
    Write-Host ("  1. & `"" + $VenvPython + "`" -m pip freeze | Out-File -FilePath `"" + $snapshotPath + "`" -Encoding utf8")
    Write-Host ("  2. & `"" + $VenvPython + "`" -m pip install --no-input -r `"" + $ProdRequirements + "`"")
    Write-Host ("  3. & `"" + $VenvPython + "`" -m pip check")
    Write-Host ("  4. Invoke-WebRequest -Uri `"" + $HealthUrl + "`" -UseBasicParsing -TimeoutSec 15")
    Write-Host "=================================================================="
    exit 0
}

if (-not (Test-Path $VenvPython)) {
    Write-Error "Target venv Python not found at $VenvPython"
    exit 1
}

$logDir = Join-Path $Repo 'logs'
New-Item -ItemType Directory -Force -Path $logDir | Out-Null
$localSnapshot = Join-Path $logDir ("backend-pip-freeze-" + $timestamp + ".txt")

Write-Host "[1/4] Snapshotting current pip freeze to $localSnapshot ..."
& $VenvPython -m pip freeze | Out-File -FilePath $localSnapshot -Encoding utf8
if ($LASTEXITCODE -ne 0) {
    Write-Error "pip freeze failed with exit code $LASTEXITCODE"
    exit $LASTEXITCODE
}

Write-Host "[2/4] Installing pinned requirements from $RequirementsPath ..."
& $VenvPython -m pip install --no-input -r $RequirementsPath
if ($LASTEXITCODE -ne 0) {
    Write-Error "pip install failed with exit code $LASTEXITCODE"
    exit $LASTEXITCODE
}

Write-Host "[3/4] Running pip check ..."
& $VenvPython -m pip check
if ($LASTEXITCODE -ne 0) {
    Write-Error "pip check reported broken dependencies (exit code $LASTEXITCODE)"
    exit $LASTEXITCODE
}

function Test-ApiHealth([string]$url) {
    try {
        $resp = Invoke-WebRequest -Uri $url -UseBasicParsing -TimeoutSec 15
        return ($resp.StatusCode -eq 200 -and $resp.Content -match '"db_connected"\s*:\s*true')
    } catch {
        return $false
    }
}

if ($RestartApi -or -not (Test-ApiHealth $HealthUrl)) {
    Write-Host "Restarting DateApp API (:8000) via tab-dateapp-api.ps1 ..."
    Get-NetTCPConnection -LocalPort 8000 -State Listen -ErrorAction SilentlyContinue | ForEach-Object {
        Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue
    }
    Start-Sleep -Seconds 2
    $apiLauncher = Join-Path $Repo 'scripts\fables-house\tab-dateapp-api.ps1'
    if (Test-Path $apiLauncher) {
        Start-Process -FilePath powershell -ArgumentList @('-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', $apiLauncher) -WindowStyle Hidden
    }
    $waited = 0
    while ($waited -lt 45 -and -not (Test-ApiHealth $HealthUrl)) {
        Start-Sleep -Seconds 3
        $waited += 3
    }
}

Write-Host "[4/4] Probing DateApp API health at $HealthUrl ..."
$healthResp = Invoke-WebRequest -Uri $HealthUrl -UseBasicParsing -TimeoutSec 15
Write-Host ("  HTTP " + $healthResp.StatusCode + " " + $healthResp.Content)
if ($healthResp.StatusCode -ne 200 -or $healthResp.Content -notmatch '"db_connected"\s*:\s*true') {
    Write-Error "Health probe did not confirm db_connected=true"
    exit 1
}

Write-Host "=================================================================="
Write-Host " SUCCESS: Pinned backend packages installed and API health verified"
Write-Host "=================================================================="
exit 0
