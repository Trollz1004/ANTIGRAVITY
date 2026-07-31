# retire-hermes-dateapp.ps1 - RUN AS ADMINISTRATOR
#
# Finishes retiring the Hermes "dateapp" profile safely. Written 2026-07-31
# after verifying that the kill list Hermes proposed was wrong: it included
# PIDs 48032 and 38588, which run the DEFAULT profile - killing those would
# have taken down the live session.
#
# What this does, in order:
#   1. Disables the scheduled tasks that respawn the dateapp gateway.
#   2. Kills ONLY processes whose command line contains "--profile dateapp".
#      Every other hermes process is left alone. No exceptions, no guessing.
#   3. Archives state.db (322 MB, 164 sessions, 24,116 messages) - it exists
#      ONLY in dateapp and would otherwise be destroyed.
#   4. Deletes the dateapp profile folder.
#   5. Verifies the telegram profile still has memory + auth.
#
# Already done before this script runs (no action needed):
#   - memory_store.db backed up WAL-safe (35 facts, 19 entities) to both
#     the telegram profile and OneDrive\Personal Vault-Laptop\
#     hermes-memory-rescue-20260731\
#   - SOUL.md (32 KB) preserved in the telegram profile and the vault
#     (dateapp's own copy was truncated to 0 bytes during Hermes's copy)

$ErrorActionPreference = 'Continue'
$profiles = "$env:LOCALAPPDATA\hermes\profiles"
$dateapp  = "$profiles\dateapp"
$telegram = "$profiles\telegram"
$archive  = "$env:USERPROFILE\hermes-archive-20260731"

function L($m) { Write-Host "[retire-dateapp] $m" }

if (-not (Test-Path $dateapp)) { L 'dateapp profile already gone - nothing to do.'; exit 0 }

# ── 1. stop the respawners ───────────────────────────────────────────────
foreach ($t in 'Hermes_Gateway_dateapp','Hermes_Gateway') {
  if (Get-ScheduledTask -TaskName $t -ErrorAction SilentlyContinue) {
    try { Disable-ScheduledTask -TaskName $t -ErrorAction Stop | Out-Null; L "disabled task: $t" }
    catch { L "could not disable ${t}: $($_.Exception.Message)" }
  }
}

# ── 2. kill ONLY dateapp-profile processes ───────────────────────────────
# Two passes: the desktop app respawns children, so kill, wait, kill again.
for ($pass = 1; $pass -le 3; $pass++) {
  $procs = @(Get-CimInstance Win32_Process | Where-Object { $_.CommandLine -match '--profile\s+dateapp' })
  if ($procs.Count -eq 0) { L "pass ${pass}: no dateapp processes left"; break }
  foreach ($p in $procs) {
    L "pass ${pass}: killing $($p.ProcessId)"
    Stop-Process -Id $p.ProcessId -Force -ErrorAction SilentlyContinue
  }
  Start-Sleep -Seconds 4
}
$still = @(Get-CimInstance Win32_Process | Where-Object { $_.CommandLine -match '--profile\s+dateapp' })
if ($still.Count -gt 0) {
  L "WARNING: $($still.Count) dateapp process(es) survived - close the Hermes desktop app and re-run."
  exit 1
}

# ── 3. archive the databases (the irreplaceable part) ─────────────────────
# Move-Item does NOT work here: SQLite keeps a handle open and Windows
# refuses the rename ("being used by another process") even after every
# --profile dateapp process is gone. SQLite's own backup API reads straight
# through the lock, so use that instead. It also checkpoints the WAL, which
# a file copy would miss - that is how one memory nearly got lost.
New-Item -ItemType Directory -Force -Path $archive | Out-Null
$py = @"
import sqlite3, os, sys
src_dir, arc = sys.argv[1], sys.argv[2]
for name in ('state.db', 'memory_store.db'):
    s = os.path.join(src_dir, name)
    if not os.path.exists(s): continue
    src = sqlite3.connect(f'file:{s}?mode=ro', uri=True)
    dst = sqlite3.connect(os.path.join(arc, name))
    src.backup(dst); dst.close(); src.close()
    print(f'archived {name} ({round(os.path.getsize(os.path.join(arc,name))/1048576,1)} MB)')
"@
$tmp = Join-Path $env:TEMP 'hermes-archive.py'
$py | Set-Content -Path $tmp -Encoding UTF8
& python $tmp $dateapp $archive
if (-not (Test-Path (Join-Path $archive 'state.db'))) { L 'FAILED to archive state.db - aborting'; exit 1 }
L 'databases archived (SQLite backup, WAL checkpointed)'

# ── 4. delete the profile ────────────────────────────────────────────────
Remove-Item -Path $dateapp -Recurse -Force -ErrorAction SilentlyContinue
if (Test-Path $dateapp) { L 'delete incomplete - some files still locked. Close Hermes desktop and re-run.'; exit 1 }
L 'dateapp profile deleted.'

# ── 5. verify what survived ──────────────────────────────────────────────
L '--- verification ---'
foreach ($f in 'memory_store.db','auth.json','SOUL.md') {
  $p = Join-Path $telegram $f
  if (Test-Path $p) { L ("telegram/{0}: OK ({1} KB)" -f $f, [math]::Round((Get-Item $p).Length/1KB,1)) }
  else { L "telegram/${f}: MISSING" }
}
L "archive kept at: $archive"
L 'done.'
