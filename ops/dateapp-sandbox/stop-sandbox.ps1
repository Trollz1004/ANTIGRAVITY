<#
.SYNOPSIS
  Stops the date app sandbox copy started by start-sandbox.ps1. No window.

.DESCRIPTION
  Stops the process trees recorded in %LOCALAPPDATA%\dateapp-sandbox\pids, then frees the two
  sandbox ports if a python or node process from this sandbox still holds them.
#>
[CmdletBinding()]
param([string]$EnvFile = '')

$ErrorActionPreference = 'Stop'
. (Join-Path $PSScriptRoot 'sandbox-common.ps1')

$sandboxHome = Get-SandboxHome
$pidDir = Join-Path $sandboxHome 'pids'
if (-not $EnvFile) { $EnvFile = Join-Path $sandboxHome 'env.sandbox' }

function Stop-Tree([int]$ProcessId) {
    # taskkill /T stops child processes too (uvicorn workers, node under the tsx shim).
    & taskkill.exe /PID $ProcessId /T /F 2>&1 | Out-Null
}

foreach ($name in 'backend', 'frontend') {
    $file = Join-Path $pidDir "$name.pid"
    if (Test-Path -LiteralPath $file) {
        $id = 0
        if ([int]::TryParse((Get-Content -LiteralPath $file -Raw).Trim(), [ref]$id) -and (Get-Process -Id $id -ErrorAction SilentlyContinue)) {
            Stop-Tree $id
            Write-Output "Stopped $name (pid $id)."
        } else {
            Write-Output "$name was not running."
        }
        Remove-Item -LiteralPath $file -Force
    } else {
        Write-Output "$name has no pid file."
    }
}

# Fallback: free the sandbox ports, but only from python or node processes.
$ports = @(8460, 3460)
if (Test-Path -LiteralPath $EnvFile) {
    $values = Read-SandboxEnv -Path $EnvFile
    $p1 = 0; $p2 = 0
    if ([int]::TryParse((Get-Setting $values 'SANDBOX_BACKEND_PORT'), [ref]$p1) -and (Test-SandboxPort $p1)) { $ports[0] = $p1 }
    if ([int]::TryParse((Get-Setting $values 'SANDBOX_FRONTEND_PORT'), [ref]$p2) -and (Test-SandboxPort $p2)) { $ports[1] = $p2 }
}
foreach ($port in $ports) {
    $owners = Get-NetTCPConnection -LocalAddress 127.0.0.1 -LocalPort $port -State Listen -ErrorAction SilentlyContinue |
        Select-Object -ExpandProperty OwningProcess -Unique
    foreach ($owner in $owners) {
        $proc = Get-Process -Id $owner -ErrorAction SilentlyContinue
        if ($proc -and $proc.ProcessName -match '^(python|pythonw|node)$') {
            Stop-Tree $owner
            Write-Output "Freed port $port ($($proc.ProcessName), pid $owner)."
        }
    }
}
Write-Output "Sandbox stopped."
exit 0
