<#
  FABLE'S HOUSE — housekeeping.

  Bounds the three things on this node that grow without limit. None of them is
  in git (all gitignored), so nothing here touches repo content — this is disk
  and noise control only.

  Measured 2026-08-28, and the rates are the point:
    ops/paperclip-ceo/wakes/   2,983 -> 3,308 files in a few hours, 45 MB.
                               The CEO bridge's cleanup only handles .tmp-*
                               skill entries; it never prunes wakes at all, so
                               they accumulate forever by omission.
    .freebuff/paperclip-247.log  22 MB -> 43 MB in the same window. No rotation.
    dump.rdb at the repo root  a stale 180 B file from 2026-08-25, left behind
                               when Redis was writing its RDB into whatever CWD
                               launched it. Redis now writes to
                               C:\Users\joshi\redis-win\data, so the root copy
                               is orphaned.

  Safe to run repeatedly. Never deletes anything newer than the retention
  window, so a wake that has not been read yet is never removed.
#>
param(
  # 3 days, not 7, and the arithmetic is the reason. Wakes arrive at roughly 60
  # per hour, so a 7-day window would hold ~10,000 files -- larger than the
  # backlog this script exists to bound. These are heartbeat run records whose
  # value decays within hours; 3 days keeps ~4,300 and still covers a weekend.
  # Raise it if a specific audit needs longer, but do the multiplication first.
  [int]$WakeRetentionDays = 3,
  [int]$LogMaxMB = 25,
  [switch]$WhatIf
)

$ErrorActionPreference = 'SilentlyContinue'
$repo = 'C:\ANTIGRAVITY'
$log  = Join-Path $repo 'logs\housekeeping.log'
New-Item -ItemType Directory -Force -Path (Split-Path $log) | Out-Null

function Say($m) {
  $line = "[{0}] {1}" -f (Get-Date -Format 'yyyy-MM-dd HH:mm:ss'), $m
  Write-Host $line
  Add-Content -Path $log -Value $line
}

Say '--- housekeeping start ---'

# 1. Wake queue. Keep the retention window so recent runs stay auditable.
$wakes = Join-Path $repo 'ops\paperclip-ceo\wakes'
if (Test-Path $wakes) {
  $cutoff = (Get-Date).AddDays(-$WakeRetentionDays)
  $old = @(Get-ChildItem -Path $wakes -Filter '*.json' -File | Where-Object { $_.LastWriteTime -lt $cutoff })
  $total = @(Get-ChildItem -Path $wakes -Filter '*.json' -File).Count
  if ($old.Count -gt 0) {
    $mb = [Math]::Round((($old | Measure-Object Length -Sum).Sum / 1MB), 1)
    if ($WhatIf) {
      Say ("wakes: WOULD remove {0} of {1} files older than {2}d ({3} MB)" -f $old.Count, $total, $WakeRetentionDays, $mb)
    } else {
      $old | Remove-Item -Force
      Say ("wakes: removed {0} of {1} files older than {2}d, reclaimed {3} MB" -f $old.Count, $total, $WakeRetentionDays, $mb)
    }
  } else {
    Say ("wakes: {0} files, none older than {1}d - nothing to do" -f $total, $WakeRetentionDays)
  }
}

# 2. Unrotated logs. Roll to .1 and truncate rather than deleting, so the most
#    recent history survives one cycle.
foreach ($f in @(
    (Join-Path $repo '.freebuff\paperclip-247.log'),
    (Join-Path $repo 'logs\fables-house.log')
  )) {
  if (-not (Test-Path $f)) { continue }
  $sizeMB = [Math]::Round(((Get-Item $f).Length / 1MB), 1)
  if ($sizeMB -ge $LogMaxMB) {
    if ($WhatIf) {
      Say ("log: WOULD rotate {0} ({1} MB >= {2} MB)" -f (Split-Path $f -Leaf), $sizeMB, $LogMaxMB)
    } else {
      # These logs are held open by a live writer (FreeBuff keeps
      # paperclip-247.log open), so Move-Item fails on Windows. An earlier
      # version used Move-Item under SilentlyContinue and printed "rotated"
      # regardless -- it reported success while the file sat untouched at
      # 43 MB. Copy-then-truncate works against an open append handle, and
      # every step is now VERIFIED before anything is claimed.
      $rolled = "$f.1"
      $name = Split-Path $f -Leaf
      Remove-Item $rolled -Force -ErrorAction SilentlyContinue
      Copy-Item $f $rolled -Force -ErrorAction SilentlyContinue
      if (-not (Test-Path $rolled)) {
        Say ("log: FAILED to copy {0} aside - NOT rotated, file left intact" -f $name)
      } else {
        try {
          # Truncate in place; keeps the writer's handle valid.
          $fs = [System.IO.File]::Open($f, 'Open', 'Write', 'ReadWrite')
          $fs.SetLength(0); $fs.Close()
        } catch {
          # Exclusive lock (FreeBuff opens paperclip-247.log without sharing).
          # Drop the copy we just made -- keeping it would DOUBLE the disk this
          # script exists to reclaim, every single run, and it archives nothing
          # the original does not already hold.
          Remove-Item $rolled -Force -ErrorAction SilentlyContinue
          Say ("log: {0} is exclusively locked by its writer - cannot rotate. Copy discarded so it does not double disk use. Remedy: stop the writer, or give it its own rotation." -f $name)
          continue
        }
        $after = [Math]::Round(((Get-Item $f).Length / 1MB), 2)
        if ($after -lt 1) { Say ("log: rotated {0} - {1} MB archived to .1, original now {2} MB" -f $name, $sizeMB, $after) }
        else { Say ("log: rotation of {0} did NOT take - still {1} MB" -f $name, $after) }
      }
    }
  } else {
    Say ("log: {0} at {1} MB - under the {2} MB threshold" -f (Split-Path $f -Leaf), $sizeMB, $LogMaxMB)
  }
}

# 3. Orphaned RDB at the repo root. Only removed when Redis is demonstrably
#    writing somewhere else, so a live snapshot is never deleted.
$rootRdb = Join-Path $repo 'dump.rdb'
$liveRdb = 'C:\Users\joshi\redis-win\data\dump.rdb'
if (Test-Path $rootRdb) {
  if ((Test-Path $liveRdb) -and ((Get-Item $liveRdb).LastWriteTime -gt (Get-Item $rootRdb).LastWriteTime)) {
    if ($WhatIf) { Say 'dump.rdb: WOULD remove the orphaned copy at the repo root' }
    else { Remove-Item $rootRdb -Force; Say 'dump.rdb: removed the orphaned copy at the repo root (live RDB is newer and elsewhere)' }
  } else {
    Say 'dump.rdb: root copy is NOT provably orphaned - leaving it alone'
  }
}

Say '--- housekeeping done ---'
