# Start Hermes Workspace on Windows (port 3000)
# Runs `pnpm start:all` in C:\Users\joshl\hermes-workspace with PATH set so the
# global pnpm/cmd shims are found.

$ErrorActionPreference = 'Continue'
$WorkspaceDir = 'C:\Users\joshl\hermes-workspace'
$LogDir = 'c:\antigravity\logs'
$LogFile = Join-Path $LogDir 'hermes-workspace-start.log'

New-Item -ItemType Directory -Force -Path $LogDir | Out-Null

function Log($msg) {
    $line = "[{0}] {1}" -f (Get-Date -Format 'yyyy-MM-dd HH:mm:ss'), $msg
    Add-Content -Path $LogFile -Value $line -ErrorAction SilentlyContinue
}

if (-not (Test-Path $WorkspaceDir)) {
    Log "ERROR: Hermes Workspace directory not found: $WorkspaceDir"
    exit 1
}

Log "Starting Hermes Workspace in $WorkspaceDir"

$env:PATH = 'C:\Users\joshl\AppData\Roaming\npm;' + $env:PATH

# Use cmd.exe so the pnpm.cmd shim resolves correctly and the VITE dev server
# stays alive as a child of the hidden console. Redirect output to a log file.
$cmd = "cd /d `"$WorkspaceDir`" && set PATH=C:\Users\joshl\AppData\Roaming\npm;%PATH% && pnpm start:all >> `"$LogFile`" 2>&1"

Start-Process -FilePath 'cmd.exe' `
    -ArgumentList @('/c', $cmd) `
    -WorkingDirectory $WorkspaceDir `
    -WindowStyle Hidden `
    -ErrorAction SilentlyContinue | Out-Null

Log "Hermes Workspace start command issued via cmd.exe."
