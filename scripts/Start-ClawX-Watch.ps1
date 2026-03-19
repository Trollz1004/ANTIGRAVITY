$dashboardDir = 'C:\ANTIGRAVITY\antigravity'
$dashboardUrl = 'http://127.0.0.1:3000'
$openClawUrl = 'http://127.0.0.1:18789'
$serverScript = Join-Path $dashboardDir '.next\standalone\server.js'
$logPath = Join-Path $dashboardDir 'dashboard.log'
$errPath = Join-Path $dashboardDir 'dashboard.err'

function Test-PortListening {
    param([int]$Port)
    return [bool](Get-NetTCPConnection -LocalPort $Port -ErrorAction SilentlyContinue)
}

if (-not (Test-Path -LiteralPath $serverScript)) {
    Push-Location $dashboardDir
    try {
        npm run build
    } finally {
        Pop-Location
    }
}

if (-not (Test-PortListening -Port 3000)) {
    Start-Process `
        -FilePath 'C:\Program Files\nodejs\node.exe' `
        -ArgumentList '.next/standalone/server.js' `
        -WorkingDirectory $dashboardDir `
        -WindowStyle Hidden `
        -RedirectStandardOutput $logPath `
        -RedirectStandardError $errPath | Out-Null

    $deadline = (Get-Date).AddSeconds(20)
    do {
        Start-Sleep -Milliseconds 500
        try {
            $response = Invoke-WebRequest -Uri $dashboardUrl -UseBasicParsing -TimeoutSec 2
            if ($response.StatusCode -eq 200) {
                break
            }
        } catch {
            # Keep waiting until the deadline expires.
        }
    } while ((Get-Date) -lt $deadline)
}

Start-Process $dashboardUrl
Start-Process $openClawUrl

Write-Output "Dashboard: $dashboardUrl"
Write-Output "OpenClaw: $openClawUrl"
