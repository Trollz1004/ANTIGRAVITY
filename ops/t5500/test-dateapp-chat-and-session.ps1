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
    $vaultEnv = Join-Path $env:USERPROFILE '.antigravity-vault\vault-handoff\env-stash-from-documents\.env-not-for-github.txt'
    if (Test-Path $vaultEnv) {
        Get-Content $vaultEnv | ForEach-Object {
            if ($_ -match '^([A-Za-z_][A-Za-z0-9_]*)=(.*)$') {
                $k = $Matches[1]; $v = $Matches[2].Trim()
                if ($v.Length -gt 0) { [Environment]::SetEnvironmentVariable($k, $v, 'Process') }
            }
        }
        $datingDb = (Get-Content $vaultEnv | Where-Object { $_ -match '^DATABASE_URL=postgresql\+asyncpg://' } | Select-Object -First 1)
        if ($datingDb) {
            [Environment]::SetEnvironmentVariable('DATABASE_URL', $datingDb.Substring('DATABASE_URL='.Length).Trim(), 'Process')
        }
    }
    $supaEnv = Join-Path $env:USERPROFILE '.antigravity-vault\supabase-db-url.env'
    if (Test-Path $supaEnv) {
        $line = (Get-Content $supaEnv | Where-Object { $_ -match '^DATABASE_URL=' } | Select-Object -First 1)
        if ($line) {
            [Environment]::SetEnvironmentVariable('DATABASE_URL', $line.Substring('DATABASE_URL='.Length).Trim(), 'Process')
        }
    }
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
