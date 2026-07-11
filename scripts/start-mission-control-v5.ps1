$ErrorActionPreference = 'Stop'

$root = 'C:\Users\joshl\mission-control-v5'
$health = 'http://127.0.0.1:3151/api/health'
$logDir = 'C:\antigravity\logs'
$stdout = Join-Path $logDir 'mission-control-v5.out.log'
$stderr = Join-Path $logDir 'mission-control-v5.err.log'

try {
    $response = Invoke-WebRequest -UseBasicParsing -TimeoutSec 3 -Uri $health
    if ($response.StatusCode -eq 200) { exit 0 }
} catch {}

if (-not (Test-Path -LiteralPath (Join-Path $root 'package.json'))) {
    throw "Mission Control v5 installation not found at $root"
}

New-Item -ItemType Directory -Force -Path $logDir | Out-Null
$npm = (Get-Command npm.cmd -ErrorAction Stop).Source
Start-Process -FilePath $npm `
    -ArgumentList @('start') `
    -WorkingDirectory $root `
    -RedirectStandardOutput $stdout `
    -RedirectStandardError $stderr `
    -WindowStyle Hidden

for ($attempt = 1; $attempt -le 12; $attempt++) {
    Start-Sleep -Seconds 5
    try {
        $response = Invoke-WebRequest -UseBasicParsing -TimeoutSec 3 -Uri $health
        if ($response.StatusCode -eq 200) { exit 0 }
    } catch {}
}

throw 'Mission Control v5 did not become healthy on 127.0.0.1:3151.'
