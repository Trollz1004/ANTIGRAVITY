param(
    [Parameter(ValueFromRemainingArguments = $true)]
    [string[]]$TuiArgs
)

$ErrorActionPreference = 'Stop'

Set-Location 'c:\antigravity'

$gatewayUrl = 'http://127.0.0.1:18789/'
$briefingPath = 'c:\antigravity\briefings\grok-openclaw\BRIEFING.md'

Write-Host ''
Write-Host 'ANTIGRAVITY Mission Guard' -ForegroundColor Cyan
Write-Host 'This is not a simulation.' -ForegroundColor Yellow
Write-Host 'Work done here must protect the mission, users, and provider terms of service.' -ForegroundColor Yellow
Write-Host 'Joshua values the mission more than urgency or profit.' -ForegroundColor Yellow
Write-Host "Read first: $briefingPath" -ForegroundColor Green
Write-Host ''

function Test-OpenClawGateway {
    try {
        Invoke-WebRequest -Uri $gatewayUrl -UseBasicParsing -TimeoutSec 5 | Out-Null
        return $true
    } catch {
        return $false
    }
}

if (-not (Test-OpenClawGateway)) {
    & openclaw gateway start | Out-Null
    Start-Sleep -Seconds 4
}

if (-not (Test-OpenClawGateway)) {
    throw "OpenClaw gateway is not reachable at $gatewayUrl. Check 'openclaw gateway status' and the OpenClaw Gateway service."
}

& openclaw tui @TuiArgs
