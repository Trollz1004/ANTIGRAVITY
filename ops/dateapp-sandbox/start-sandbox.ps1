<#
.SYNOPSIS
  Starts the date app backend and front end from this repo as a local Square SANDBOX copy.

.DESCRIPTION
  Binds to 127.0.0.1 only, on the ports in the sandbox env file (never 3200, 8000, 9160 or 3130).
  Runs hidden, logs to %LOCALAPPDATA%\dateapp-sandbox\logs, and returns at once (it does not wait).
  Reads only the sandbox env file. Every backend setting already in this shell is removed from the
  child processes first, and the backend runs from an empty folder so no repo .env file is read.

  Refuses to start (and starts nothing) when:
    - the Square host is not https://connect.squareupsandbox.com   (exit 2)
    - the database is not a local sandbox database                  (exit 3)
  Other stops: the two Josh values are empty (4), port problem (5), stray .env file (6), other (1).

.PARAMETER EnvFile
  Sandbox env file. Default: %LOCALAPPDATA%\dateapp-sandbox\env.sandbox

.PARAMETER CheckOnly
  Run the safety checks and exit 0 without starting anything.
#>
[CmdletBinding()]
param(
    [string]$EnvFile = '',
    [switch]$CheckOnly
)

$ErrorActionPreference = 'Stop'
. (Join-Path $PSScriptRoot 'sandbox-common.ps1')

$sandboxHome = Get-SandboxHome
if (-not $EnvFile) { $EnvFile = Join-Path $sandboxHome 'env.sandbox' }

if (-not (Test-Path -LiteralPath $EnvFile)) {
    $defaultPath = Join-Path $sandboxHome 'env.sandbox'
    if ([IO.Path]::GetFullPath($EnvFile) -ieq [IO.Path]::GetFullPath($defaultPath)) {
        New-Item -ItemType Directory -Force -Path $sandboxHome | Out-Null
        Copy-Item -LiteralPath (Join-Path $PSScriptRoot 'env.sandbox.example') -Destination $defaultPath
        Write-Output "Created %LOCALAPPDATA%\dateapp-sandbox\env.sandbox from the example."
        Write-Output "Fill SQUARE_ACCESS_TOKEN and SQUARE_LOCATION_ID in that file, then run this script again."
        exit 4
    }
    Write-Output "STOPPED: env file not found."
    exit 1
}

$values = Read-SandboxEnv -Path $EnvFile

# ---- Refusal 1: Square host ----
if (-not (Test-SandboxSquareHost $values)) {
    Write-Output "REFUSED: SQUARE_API_BASE_URL is not Square's sandbox host ($script:SandboxSquareHost). Nothing started."
    exit 2
}

# ---- Refusal 2: database ----
if (-not (Test-SandboxDatabase $values)) {
    Write-Output "REFUSED: database address is not a local sandbox database (or SUPABASE_DB_URL is set, or it matches a production setting in this shell). Nothing started."
    exit 3
}

$backendPort = 0; $frontendPort = 0
[void][int]::TryParse((Get-Setting $values 'SANDBOX_BACKEND_PORT'), [ref]$backendPort)
[void][int]::TryParse((Get-Setting $values 'SANDBOX_FRONTEND_PORT'), [ref]$frontendPort)
if (-not (Test-SandboxPort $backendPort) -or -not (Test-SandboxPort $frontendPort) -or $backendPort -eq $frontendPort) {
    Write-Output "STOPPED: SANDBOX_BACKEND_PORT and SANDBOX_FRONTEND_PORT must be two different ports, not 3200, 8000, 9160 or 3130."
    exit 5
}

$notify = Get-Setting $values 'SQUARE_PAYMENT_WEBHOOK_NOTIFICATION_URL'
if ($notify -notmatch "^http://127\.0\.0\.1:$backendPort/") {
    Write-Output "STOPPED: SQUARE_PAYMENT_WEBHOOK_NOTIFICATION_URL must point at http://127.0.0.1:$backendPort/."
    exit 1
}
if ((Get-Setting $values 'SQUARE_WEBHOOK_VERIFY_SIGNATURE') -notmatch '^(?i)(true|1|yes)$') {
    Write-Output "STOPPED: SQUARE_WEBHOOK_VERIFY_SIGNATURE must be true."
    exit 1
}
foreach ($n in 'SQUARE_BOT_SHIELD_PAYMENT_LINK', 'SQUARE_SUBSCRIPTION_PAYMENT_LINK') {
    if (Get-Setting $values $n) { Write-Output "STOPPED: $n must be empty in the sandbox copy."; exit 1 }
}

if ($CheckOnly) {
    Write-Output "CHECK OK: sandbox Square host, local sandbox database, ports $backendPort and $frontendPort. Nothing started."
    exit 0
}

# ---- The two values Josh fills ----
foreach ($n in 'SQUARE_ACCESS_TOKEN', 'SQUARE_LOCATION_ID') {
    if (-not (Get-Setting $values $n)) {
        Write-Output "STOPPED: $n is empty. Fill it in the sandbox env file from the Sandbox tab of your Square Developer page."
        exit 4
    }
}

# ---- Fill the two local random secrets once, in the sandbox env file itself ----
$fileText = Get-Content -LiteralPath $EnvFile -Raw
$changed = $false
foreach ($n in 'JWT_SECRET', 'SQUARE_PAYMENT_WEBHOOK_SIGNATURE_KEY') {
    if (-not (Get-Setting $values $n)) {
        $secret = New-SandboxSecret
        $fileText = [regex]::Replace($fileText, "(?m)^$n=[ \t]*$", "$n=$secret")
        $values[$n] = $secret
        $changed = $true
    }
}
if ($changed) { Set-Content -LiteralPath $EnvFile -Value $fileText -NoNewline -Encoding UTF8 }

# ---- Ports free? ----
foreach ($p in $backendPort, $frontendPort) {
    if (Get-NetTCPConnection -LocalPort $p -State Listen -ErrorAction SilentlyContinue) {
        Write-Output "STOPPED: port $p is already in use. Run stop-sandbox.ps1 first."
        exit 5
    }
}

# ---- Paths ----
$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot '..\..')).Path
$appRoot = Join-Path $repoRoot 'domains\youandinotai.com'
$backendDir = Join-Path $appRoot 'backend'
$frontendDir = Join-Path $appRoot 'frontend'
$runDir = Join-Path $sandboxHome 'run\backend'
$logDir = Join-Path $sandboxHome 'logs'
$pidDir = Join-Path $sandboxHome 'pids'
foreach ($d in $runDir, $logDir, $pidDir, (Join-Path $sandboxHome 'uploads'), (Join-Path $sandboxHome 'booking-logs')) {
    New-Item -ItemType Directory -Force -Path $d | Out-Null
}
# The backend reads ../.env and .env relative to where it runs. Both must be absent.
foreach ($stray in (Join-Path $sandboxHome 'run\.env'), (Join-Path $runDir '.env')) {
    if (Test-Path -LiteralPath $stray) { Write-Output "STOPPED: a .env file exists in the sandbox run folder. Remove it."; exit 6 }
}

$python = Join-Path $backendDir '.venv\Scripts\python.exe'
if (-not (Test-Path -LiteralPath $python)) {
    $cmd = Get-Command python -ErrorAction SilentlyContinue
    if (-not $cmd) { Write-Output "STOPPED: no Python found. Create backend\.venv and install requirements.txt."; exit 1 }
    $python = $cmd.Source
}
$tsx = Join-Path $frontendDir 'node_modules\.bin\tsx.cmd'
if (-not (Test-Path -LiteralPath $tsx)) { Write-Output "STOPPED: front end packages missing. Run npm ci in the frontend folder."; exit 1 }

# ---- Child environment: strip every backend setting and VITE_ value, then load the sandbox file ----
$saved = @{}
Get-ChildItem Env: | ForEach-Object { $saved[$_.Name] = $_.Value }
try {
    $strip = @(Get-BackendSettingNames -ConfigPath (Join-Path $backendDir 'app\config.py'))
    foreach ($name in @($saved.Keys)) {
        if ($strip -contains $name.ToUpperInvariant() -or $name -like 'VITE_*' -or $name -like 'SQUARE_*') {
            Remove-Item -LiteralPath "Env:$name" -ErrorAction SilentlyContinue
        }
    }
    foreach ($k in $values.Keys) { Set-Item -LiteralPath "Env:$k" -Value ([string]$values[$k]) }
    $env:PYTHONUNBUFFERED = '1'

    $backend = Start-Process -FilePath $python -WorkingDirectory $runDir -WindowStyle Hidden -PassThru `
        -ArgumentList @('-m', 'uvicorn', 'app.main:app', '--app-dir', "`"$backendDir`"", '--host', '127.0.0.1', '--port', "$backendPort") `
        -RedirectStandardOutput (Join-Path $logDir 'backend.out.log') -RedirectStandardError (Join-Path $logDir 'backend.err.log')

    $env:PORT = "$frontendPort"
    $env:HOST = '127.0.0.1'
    $env:NODE_ENV = 'development'
    $frontend = Start-Process -FilePath $tsx -WorkingDirectory $frontendDir -WindowStyle Hidden -PassThru `
        -ArgumentList @('server.ts') `
        -RedirectStandardOutput (Join-Path $logDir 'frontend.out.log') -RedirectStandardError (Join-Path $logDir 'frontend.err.log')
}
finally {
    # Put this shell back exactly as it was.
    @(Get-ChildItem Env:) | ForEach-Object { if (-not $saved.ContainsKey($_.Name)) { Remove-Item -LiteralPath "Env:$($_.Name)" -ErrorAction SilentlyContinue } }
    foreach ($k in $saved.Keys) { Set-Item -LiteralPath "Env:$k" -Value $saved[$k] }
}

Set-Content -LiteralPath (Join-Path $pidDir 'backend.pid') -Value $backend.Id
Set-Content -LiteralPath (Join-Path $pidDir 'frontend.pid') -Value $frontend.Id
Write-Output "Started (hidden). Not waiting."
Write-Output "Front end: http://127.0.0.1:$frontendPort"
Write-Output "Backend:   http://127.0.0.1:$backendPort/api/v1/health"
Write-Output "Logs:      %LOCALAPPDATA%\dateapp-sandbox\logs"
Write-Output "Stop with: stop-sandbox.ps1"
exit 0
