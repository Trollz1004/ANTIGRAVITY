<#
.SYNOPSIS
    Nightly cold-tier backup for T5500 (C:\ANTIGRAVITY -> Google Drive via rclone).

.DESCRIPTION
    Executes in order per BACKUP-DESIGN.md and AGY-TASK-2.md:
      1. git bundle create the whole repo to ops/backups/cold-tier/bundles/repo-YYYY-MM-DD.bundle
      2. Tar+zstd any new day-folders under ops/hermes/out and content/yesterday-news
         (plus ops/packets/hermes-youtube-YYYYMMDD) to ops/backups/cold-tier/content/hermes-out-YYYY-MM-DD.tar.zst
      3. rclone copy both staging folders to <Remote>:antigravity/bundles/ and <Remote>:antigravity/content/
         with --bwlimit 8M --fast-list --tpslimit 10 --drive-chunk-size 128M
      4. Prune bundles older than 14 days, locally and on Drive
      5. Exclude .claude, .codex, .gemini caches and Ollama models entirely

    Never points rclone at a live working tree; only staged archives under ops/backups/cold-tier/ are uploaded.
#>
[CmdletBinding()]
param(
    [string] $Remote = 'gdrive',
    [int]    $RetentionDays = 14,
    [switch] $SkipRemote
)

$ErrorActionPreference = 'Stop'

$repo       = 'C:\ANTIGRAVITY'
$stageRoot  = Join-Path $repo 'ops\backups\cold-tier'
$bundlesDir = Join-Path $stageRoot 'bundles'
$contentDir = Join-Path $stageRoot 'content'
$logDir     = Join-Path $stageRoot 'logs'

foreach ($d in @($bundlesDir, $contentDir, $logDir)) {
    if (-not (Test-Path $d)) {
        New-Item -ItemType Directory -Path $d -Force | Out-Null
    }
}

# Rebuild PATH from registry + WinGet Links so scheduled task finds git, tar, zstd, rclone
$machinePath = [System.Environment]::GetEnvironmentVariable('Path', 'Machine')
$userPath    = [System.Environment]::GetEnvironmentVariable('Path', 'User')
$wingetLinks = Join-Path $env:LOCALAPPDATA 'Microsoft\WinGet\Links'
$env:Path    = "$wingetLinks;$machinePath;$userPath"

$today = Get-Date -Format 'yyyy-MM-dd'
$stamp = Get-Date -Format 'yyyyMMdd-HHmmss'
$logFile = Join-Path $logDir "cold-tier-$stamp.log"

function Write-Step([string]$msg) {
    $line = "$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss') $msg"
    Write-Output $line
    $line | Out-File -FilePath $logFile -Append -Encoding utf8
}

Write-Step "=== cold-tier backup start (repo=$repo, remote=$Remote) ==="
Write-Step "[step 5] hard exclusions active: .claude, .codex, .gemini, .ollama/models excluded from all staging and rclone calls"

# --- Step 1: git bundle create the whole repo to a dated file ----------------
$bundleFile = Join-Path $bundlesDir "repo-$today.bundle"
$bundleTmp  = "$bundleFile.tmp"
if (Test-Path $bundleTmp) { Remove-Item $bundleTmp -Force }

Write-Step "[step 1] creating git bundle: $bundleFile"
& git -C $repo bundle create $bundleTmp --all 2>&1 | ForEach-Object { Write-Step "  git: $_" }
if ($LASTEXITCODE -ne 0 -or -not (Test-Path $bundleTmp)) {
    throw "git bundle create failed with exit code $LASTEXITCODE"
}
& git -C $repo bundle verify $bundleTmp 2>&1 | Select-Object -First 3 | ForEach-Object { Write-Step "  verify: $_" }
if ($LASTEXITCODE -ne 0) {
    throw "git bundle verify failed with exit code $LASTEXITCODE"
}
Move-Item -Path $bundleTmp -Destination $bundleFile -Force
$bundleSize = (Get-Item $bundleFile).Length
Write-Step "[step 1] bundle ready: $bundleFile ($bundleSize bytes)"

# --- Step 2: Tar any new day-folders under ops/hermes/out and content/yesterday-news ---
$daySet = [System.Collections.Generic.SortedSet[string]]::new()
foreach ($relRoot in @('ops\hermes\out', 'content\yesterday-news')) {
    $fullRoot = Join-Path $repo $relRoot
    if (Test-Path $fullRoot) {
        Get-ChildItem -Path $fullRoot -Directory | Where-Object { $_.Name -match '^\d{8}$' } | ForEach-Object {
            [void]$daySet.Add($_.Name)
        }
    }
}

$newArchives = 0
$skippedArchives = 0
foreach ($day in $daySet) {
    $ymd = "{0}-{1}-{2}" -f $day.Substring(0,4), $day.Substring(4,2), $day.Substring(6,2)
    $tarFile = Join-Path $contentDir "hermes-out-$ymd.tar.zst"
    if ((Test-Path $tarFile) -and ((Get-Item $tarFile).Length -gt 0)) {
        $skippedArchives++
        continue
    }
    $relTargets = @()
    foreach ($candidate in @(
        "ops/hermes/out/$day",
        "content/yesterday-news/$day",
        "ops/packets/hermes-youtube-$day"
    )) {
        if (Test-Path (Join-Path $repo $candidate)) {
            $relTargets += $candidate
        }
    }
    if ($relTargets.Count -eq 0) { continue }

    $tarTmp = "$tarFile.tmp"
    if (Test-Path $tarTmp) { Remove-Item $tarTmp -Force }
    $tarArgs = @('--zstd', '--exclude=.claude', '--exclude=.codex', '--exclude=.gemini', '--exclude=.ollama', '-cf', $tarTmp, '-C', $repo) + $relTargets
    & tar @tarArgs 2>&1 | ForEach-Object { Write-Step "  tar ($ymd): $_" }
    if ($LASTEXITCODE -ne 0 -or -not (Test-Path $tarTmp)) {
        throw "tar --zstd failed for $day (exit $LASTEXITCODE)"
    }
    Move-Item -Path $tarTmp -Destination $tarFile -Force
    $sz = (Get-Item $tarFile).Length
    Write-Step "[step 2] archived $day -> hermes-out-$ymd.tar.zst ($sz bytes)"
    $newArchives++
}
Write-Step "[step 2] day archives complete: $newArchives new, $skippedArchives already staged (total=$($daySet.Count))"

# --- Step 4a: Prune local bundles older than RetentionDays -------------------
$cutoff = (Get-Date).AddDays(-$RetentionDays)
$prunedLocal = 0
Get-ChildItem -Path $bundlesDir -Filter 'repo-*.bundle' -File | Where-Object { $_.LastWriteTime -lt $cutoff } | ForEach-Object {
    Write-Step "[step 4] pruning local bundle older than ${RetentionDays}d: $($_.Name)"
    Remove-Item $_.FullName -Force
    $prunedLocal++
}
Write-Step "[step 4] local prune complete ($prunedLocal removed)"

if ($SkipRemote) {
    Write-Step "=== SkipRemote set; skipping rclone upload and remote prune ==="
    exit 0
}

# --- Step 3: rclone copy both to antigravity/bundles/ and antigravity/content/ ---
$rcloneCommon = @(
    '--bwlimit', '8M',
    '--fast-list',
    '--tpslimit', '10',
    '--drive-chunk-size', '128M',
    '--exclude', '.claude/**',
    '--exclude', '.codex/**',
    '--exclude', '.gemini/**',
    '--exclude', '.ollama/**',
    '--exclude', '**/models/**',
    '--stats-one-line',
    '-v'
)

Write-Step "[step 3] rclone copy bundles -> ${Remote}:antigravity/bundles/"
$bArgs = @('copy', $bundlesDir, "${Remote}:antigravity/bundles/") + $rcloneCommon
& rclone @bArgs 2>&1 | ForEach-Object { Write-Step "  rclone(bundles): $_" }
if ($LASTEXITCODE -ne 0) {
    throw "rclone copy bundles failed with exit code $LASTEXITCODE"
}

Write-Step "[step 3] rclone copy content -> ${Remote}:antigravity/content/"
$cArgs = @('copy', $contentDir, "${Remote}:antigravity/content/") + $rcloneCommon
& rclone @cArgs 2>&1 | ForEach-Object { Write-Step "  rclone(content): $_" }
if ($LASTEXITCODE -ne 0) {
    throw "rclone copy content failed with exit code $LASTEXITCODE"
}

# --- Step 4b: Prune remote bundles older than RetentionDays ------------------
Write-Step "[step 4] rclone delete remote bundles older than ${RetentionDays}d on ${Remote}:antigravity/bundles/"
$pArgs = @(
    'delete', "${Remote}:antigravity/bundles/",
    '--min-age', "${RetentionDays}d",
    '--include', 'repo-*.bundle',
    '--fast-list',
    '--tpslimit', '10',
    '-v'
)
& rclone @pArgs 2>&1 | ForEach-Object { Write-Step "  rclone(prune): $_" }
if ($LASTEXITCODE -ne 0) {
    throw "rclone remote prune failed with exit code $LASTEXITCODE"
}

Write-Step "=== cold-tier backup complete (exit 0) ==="
exit 0
