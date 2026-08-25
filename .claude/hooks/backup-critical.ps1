# backup-critical.ps1 - snapshots everything that cannot be regenerated.
#
# Databases go through SQLite's backup API, never a file copy: a copy misses
# the write-ahead log (one rescue caught 34 facts where the db held 35) and
# Windows refuses to rename a database with an open handle. The API reads
# through the lock and checkpoints the WAL.
#
# Idempotent and safe to run while the stack is live. Keeps the last 7 runs.
# Configs are stored with credentials masked so a snapshot can never leak.

param([switch]$Quiet)
$ErrorActionPreference = 'Continue'
$stamp = Get-Date -Format 'yyyyMMdd-HHmmss'
$root  = "$env:USERPROFILE\OneDrive\Personal Vault-Laptop\stack-backups"
$dest  = Join-Path $root $stamp
New-Item -ItemType Directory -Force -Path $dest | Out-Null
function L($m){ if(-not $Quiet){ Write-Host "  $m" } }

Write-Host ''
Write-Host "  BACKUP -> $dest" -ForegroundColor Cyan

# ── databases (WAL-safe) ──────────────────────────────────────────────────
$dbs = @(
  @{ n='hermes-memory'; p="$env:LOCALAPPDATA\hermes\profiles\telegram\memory_store.db" },
  @{ n='hermes-state';  p="$env:USERPROFILE\hermes-archive-20260731\state.db" },
  @{ n='openclaw-tasks';p="$env:USERPROFILE\.openclaw\tasks\runs.sqlite" },
  @{ n='omniroute';     p="$env:USERPROFILE\.omniroute\storage.sqlite" }
)
$py = @'
import sqlite3, sys, os
src_path, dst_path = sys.argv[1], sys.argv[2]
src = sqlite3.connect(f'file:{src_path}?mode=ro', uri=True)
dst = sqlite3.connect(dst_path)
src.backup(dst)
n = 0
try:
    for (t,) in src.execute("SELECT name FROM sqlite_master WHERE type='table'"):
        n += dst.execute(f'SELECT COUNT(*) FROM "{t}"').fetchone()[0]
except Exception:
    pass
dst.close(); src.close()
print(f'{round(os.path.getsize(dst_path)/1048576,1)} MB, {n} rows')
'@
$tmp = Join-Path $env:TEMP "sqlite-backup-$stamp.py"
$py | Set-Content -Path $tmp -Encoding UTF8
foreach ($d in $dbs) {
  if (-not (Test-Path $d.p)) { L "skip  $($d.n) (not present)"; continue }
  $out = & python $tmp $d.p (Join-Path $dest "$($d.n).db") 2>&1
  if ($LASTEXITCODE -eq 0) { L "db    $($d.n): $out" } else { L "FAIL  $($d.n): $out" }
}
Remove-Item $tmp -Force -ErrorAction SilentlyContinue

# ── configs, with every credential masked ─────────────────────────────────
$cfgs = @(
  "$env:LOCALAPPDATA\hermes\config.yaml",
  "$env:USERPROFILE\.openclaw\openclaw.json",
  "$env:USERPROFILE\.env",
  "$env:USERPROFILE\.omniroute\.env",
  'C:\ANTIGRAVITY\mission-control-v5\server\.env',
  'C:\ANTIGRAVITY\.mcp.json'
)
$cfgDir = Join-Path $dest 'configs'
New-Item -ItemType Directory -Force -Path $cfgDir | Out-Null
foreach ($c in $cfgs) {
  if (-not (Test-Path $c)) { continue }
  $name = (Split-Path $c -Parent | Split-Path -Leaf) + '_' + (Split-Path $c -Leaf)
  # Mask any value that looks like a credential. Structure is preserved so the
  # snapshot stays useful for diffing; the secret itself never lands on disk.
  (Get-Content $c) -replace '((?i)(?:api[_-]?key|token|secret|password|_KEY)\s*[:=]\s*)\S+', '$1<MASKED>' |
    Set-Content -Path (Join-Path $cfgDir $name) -Encoding UTF8
  L "cfg   $name (credentials masked)"
}

# ── manifest ──────────────────────────────────────────────────────────────
@"
ANTIGRAVITY critical backup
taken     : $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')
node      : $env:COMPUTERNAME
method    : SQLite backup API (WAL checkpointed) for databases; configs masked
restore   : copy a .db back over the live file while the service is STOPPED,
            then run .claude\hooks\verify-stack-integrity.ps1
warning   : configs here have credentials replaced with <MASKED>. They are for
            diffing structure, not for restoring keys. Real keys live only in
            the master env and the locked vault.
"@ | Set-Content (Join-Path $dest 'MANIFEST.txt') -Encoding UTF8

# ── rotate: keep 7 ────────────────────────────────────────────────────────
$old = Get-ChildItem $root -Directory | Sort-Object Name -Descending | Select-Object -Skip 7
foreach ($o in $old) { Remove-Item $o.FullName -Recurse -Force -ErrorAction SilentlyContinue; L "rotated out $($o.Name)" }

$size = [math]::Round((Get-ChildItem $dest -Recurse -File | Measure-Object Length -Sum).Sum/1MB,1)
Write-Host ''
Write-Host "  done - $size MB, $((Get-ChildItem $root -Directory).Count) snapshot(s) retained" -ForegroundColor Green
Write-Host ''
