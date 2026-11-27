# DateApp Two-Account Chat & 30-Minute Session Persistence Test Harness (Stage B.1).
#
# Default (no -Apply, no -LocalSqliteSmoke): prints the dry-run plan only.
# With -LocalSqliteSmoke: boots an isolated temporary SQLite DB + local FastAPI/Vite
#   servers on ephemeral ports, runs the full headless Chromium E2E test, writes
#   docs/screenshots/dateapp-chat-session/{two-account-chat-1440.png,session-after-30m-1440.png},
#   and confirms 0 leftover test rows.
# With -Apply (for the Judge on T5500): runs the E2E flow against the T5500 DateApp stack
#   and cleans up all test rows in finally.
param(
    [switch]$Apply,
    [switch]$LocalSqliteSmoke,
    [string]$RepoPath = '',
    [string]$PythonExe = '',
    [string]$BindHost = '192.168.0.15',
    [int]$ApiPort = 8000,
    [int]$FrontendPort = 3200
)

$ErrorActionPreference = 'Stop'

$Repo = if ($RepoPath) {
    $RepoPath
} elseif (Test-Path 'C:\ANTIGRAVITY\ops\t5500\run_dateapp_chat_session_e2e.py') {
    'C:\ANTIGRAVITY'
} else {
    (Resolve-Path (Join-Path $PSScriptRoot '..\..')).Path
}

$RunnerPy = Join-Path $Repo 'ops\t5500\run_dateapp_chat_session_e2e.py'
if (-not (Test-Path $RunnerPy)) {
    Write-Error "E2E runner not found at $RunnerPy"
    exit 1
}

$ResolvedPython = if ($PythonExe -and (Test-Path $PythonExe)) {
    $PythonExe
} elseif (Test-Path 'C:\ANTIGRAVITY\backend\.venv\Scripts\python.exe') {
    'C:\ANTIGRAVITY\backend\.venv\Scripts\python.exe'
} elseif (Test-Path (Join-Path $env:TEMP 'stage-b-venv\Scripts\python.exe')) {
    Join-Path $env:TEMP 'stage-b-venv\Scripts\python.exe'
} else {
    'python'
}

$ApiBaseUrl      = "http://${BindHost}:${ApiPort}"
$FrontendBaseUrl = "http://${BindHost}:${FrontendPort}"
$ScreenshotDir   = Join-Path $Repo 'docs\screenshots\dateapp-chat-session'

if ($Apply -and (-not $env:JWT_SECRET -or -not ($env:SUPABASE_DB_URL -or $env:DATABASE_URL))) {
    # The judge runs -Apply from a shell where the service's own settings are already loaded.
    # This script never opens an env file or a vault file; it reads settings by name only.
    Write-Error 'JWT_SECRET and DATABASE_URL (or SUPABASE_DB_URL) must already be set in this process. Nothing was run.'
    exit 2
}

$pyArgs = @(
    $RunnerPy,
    '--repo-root', $Repo,
    '--api-base-url', $ApiBaseUrl,
    '--frontend-base-url', $FrontendBaseUrl,
    '--screenshot-dir', $ScreenshotDir
)

if ($LocalSqliteSmoke) {
    $pyArgs += '--local-sqlite-smoke'
} elseif ($Apply) {
    $pyArgs += '--apply'
}

& $ResolvedPython @pyArgs
exit $LASTEXITCODE
