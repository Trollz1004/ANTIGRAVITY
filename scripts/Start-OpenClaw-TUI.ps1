param(
    [Parameter(ValueFromRemainingArguments = $true)]
    [string[]]$TuiArgs
)

$ErrorActionPreference = 'Stop'

Set-Location 'C:\ANTIGRAVITY'

$gatewayUrl = 'http://127.0.0.1:18789/'

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
