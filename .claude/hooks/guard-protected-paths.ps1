# guard-protected-paths.ps1 - PreToolUse guard for Edit/Write/MultiEdit.
#
# Blocks any agent (including me) from writing to files that, when corrupted,
# take the whole platform down. Every rule here exists because the failure
# actually happened on 2026-07-31:
#
#   - a dashboard wrote its own secret redaction back over a live API key,
#     so authentication failed silently while the config looked correct
#   - an agent reported a "full clone" of a profile whose memory database was
#     never copied, then asked to rm -rf the only copy
#   - work was written against C:\antigravity, a stale path that still exists
#     on disk, so files landed on the wrong drive and looked like they vanished
#
# Reads the tool-call JSON on stdin. Exit 2 = block (stderr goes back to the
# agent as the reason). Exit 0 = allow.

$ErrorActionPreference = 'Stop'
try { $payload = [Console]::In.ReadToEnd() | ConvertFrom-Json } catch { exit 0 }

$path = $payload.tool_input.file_path
if (-not $path) { exit 0 }
$p = $path.ToLower() -replace '/', '\'

function Deny($why, $instead) {
  # Must write straight to stderr and exit 2. Write-Error under
  # ErrorActionPreference='Stop' throws first and the process exits 1, which
  # Claude Code treats as "hook errored" and ALLOWS the write through.
  [Console]::Error.WriteLine("BLOCKED: $why")
  [Console]::Error.WriteLine($instead)
  [Console]::Error.Flush()
  exit 2
}

# ── secrets: env files and vaults ─────────────────────────────────────────
if ($p -match '\\\.env(\.|$)' -or $p -match '\\\.env$' -or $p -match 'personal vault') {
  Deny "$path holds live credentials." @"
Secrets are edited by Josh only. If a key needs changing, tell him which key
and why - do not write the file. Note: a value like sk-2d6...2541 is a UI
redaction, not a key; writing it back breaks authentication silently.
"@
}

# ── agent configs: one bad write takes down a lane ────────────────────────
if ($p -match 'hermes\\config\.yaml' -or $p -match 'hermes\\profiles\\.*\\config\.yaml' -or
    $p -match '\.openclaw\\openclaw\.json' -or $p -match '\.omniroute\\\.env') {
  Deny "$path is a live agent config." @"
Back it up first, change one key at a time, then re-validate with:
  powershell -File C:\ANTIGRAVITY\.claude\hooks\verify-stack-integrity.ps1
If this edit is intended, run it as an explicit Bash command so it is visible
in the transcript rather than an invisible file write.
"@
}

# ── stale repo root ───────────────────────────────────────────────────────
# Match ANY drive but C:. Drive letters move when disks are added or swapped -
# the old F:\ANTIGRAVITY became D:\ANTIGRAVITY on 2026-08-25 and a letter-
# specific guard would have silently stopped guarding anything.
if ($p -match '^(?!c:)[a-z]:\\antigravity\\') {
  $clone = ($p -split '\\')[0].ToUpper() + '\ANTIGRAVITY'
  Deny "$clone is an ARCHIVE clone (old disk), not the live repo." @"
The live root is C:\ANTIGRAVITY (canonical-path directive 2026-08-16, same on
every node). Anything written to $clone changes the archive, not the running
stack or git.
"@
}

# ── databases: never hand-edit, never overwrite ───────────────────────────
if ($p -match '\.db$' -or $p -match '\.sqlite3?$' -or $p -match 'memory_store' -or $p -match 'state\.db') {
  Deny "$path is a live database." @"
Do not write databases as files - a plain copy misses the write-ahead log and
Windows refuses to rename an open handle. Use SQLite's backup API instead:
  src = sqlite3.connect(f'file:{path}?mode=ro', uri=True)
  src.backup(sqlite3.connect(dest))
"@
}

exit 0
