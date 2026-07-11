$ErrorActionPreference = 'Stop'

$api = 'http://127.0.0.1:3111'
$logDir = 'C:\Users\joshl\.paperclip\instances\default\logs'
$stdout = Join-Path $logDir 'sabretooth-stdout.log'
$stderr = Join-Path $logDir 'sabretooth-stderr.log'

try {
    $response = Invoke-WebRequest -UseBasicParsing -TimeoutSec 3 -Uri "$api/api/health"
    if ($response.StatusCode -eq 200) { exit 0 }
} catch {}

New-Item -ItemType Directory -Force -Path $logDir | Out-Null
$npx = (Get-Command npx.cmd -ErrorAction Stop).Source
Start-Process -FilePath $npx `
    -ArgumentList @('--no-install', 'paperclipai', 'run', '--no-repair') `
    -WorkingDirectory 'C:\antigravity' `
    -RedirectStandardOutput $stdout `
    -RedirectStandardError $stderr `
    -WindowStyle Hidden

for ($attempt = 1; $attempt -le 12; $attempt++) {
    Start-Sleep -Seconds 5
    try {
        $response = Invoke-WebRequest -UseBasicParsing -TimeoutSec 3 -Uri "$api/api/health"
        if ($response.StatusCode -eq 200) { exit 0 }
    } catch {}
}

throw 'Paperclip did not become healthy on 127.0.0.1:3111.'
