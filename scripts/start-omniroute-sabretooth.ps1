$ErrorActionPreference = 'Stop'

$root = 'C:\paperclip\omniroute'
$health = 'http://127.0.0.1:20128/api/health/ping'
$logDir = 'C:\antigravity\logs'
$stdout = Join-Path $logDir 'omniroute-sabretooth.out.log'
$stderr = Join-Path $logDir 'omniroute-sabretooth.err.log'

try {
    $response = Invoke-WebRequest -UseBasicParsing -TimeoutSec 3 -Uri $health
    if ($response.StatusCode -eq 200) { exit 0 }
} catch {}

if (-not (Test-Path -LiteralPath (Join-Path $root 'package.json'))) {
    throw "OmniRoute installation not found at $root"
}

$listener = Get-NetTCPConnection -State Listen -LocalPort 20128 -ErrorAction SilentlyContinue | Select-Object -First 1
if ($listener) {
    $process = Get-CimInstance Win32_Process -Filter "ProcessId=$($listener.OwningProcess)" -ErrorAction SilentlyContinue
    $ancestry = @($process)
    $cursor = $process
    for ($depth = 0; $cursor -and $depth -lt 4; $depth++) {
        $cursor = Get-CimInstance Win32_Process -Filter "ProcessId=$($cursor.ParentProcessId)" -ErrorAction SilentlyContinue
        if ($cursor) { $ancestry += $cursor }
    }
    $ownedByOmniRoute = $ancestry | Where-Object { $_.CommandLine -match '(?i)C:\\paperclip\\omniroute|omniroute' }
    if ($process -and $ownedByOmniRoute) {
        Stop-Process -Id $listener.OwningProcess -Force
        Start-Sleep -Seconds 2
    } else {
        throw "Port 20128 is owned by unexpected process $($listener.OwningProcess)."
    }
}

New-Item -ItemType Directory -Force -Path $logDir | Out-Null
$npm = (Get-Command npm.cmd -ErrorAction Stop).Source
$npmArguments = if (Test-Path -LiteralPath (Join-Path $root '.build\next\BUILD_ID')) {
    @('run', 'start')
} else {
    @('run', 'dev')
}
Start-Process -FilePath $npm `
    -ArgumentList $npmArguments `
    -WorkingDirectory $root `
    -RedirectStandardOutput $stdout `
    -RedirectStandardError $stderr `
    -WindowStyle Hidden

for ($attempt = 1; $attempt -le 18; $attempt++) {
    Start-Sleep -Seconds 5
    try {
        $response = Invoke-WebRequest -UseBasicParsing -TimeoutSec 3 -Uri $health
        if ($response.StatusCode -eq 200) { exit 0 }
    } catch {}
}

throw 'OmniRoute did not become healthy on 127.0.0.1:20128.'
