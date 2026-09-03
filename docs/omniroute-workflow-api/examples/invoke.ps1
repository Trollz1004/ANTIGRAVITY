# OmniRoute gateway examples — PowerShell.
# Reads the key from $env:OMNI_ROUTE_API_KEY at runtime. Never hardcode it.
#
# Usage:
#   $env:OMNI_ROUTE_API_KEY = <read it from your own secret store>
#   .\invoke.ps1

$ErrorActionPreference = "Stop"

$BaseUrl = if ($env:OPENAI_COMPAT_BASE_URL) { $env:OPENAI_COMPAT_BASE_URL } else { "http://192.168.0.8:20128/v1" }

if (-not $env:OMNI_ROUTE_API_KEY) {
    Write-Error "OMNI_ROUTE_API_KEY is not set in the environment. Aborting."
    exit 1
}

$Headers = @{
    Authorization = "Bearer $($env:OMNI_ROUTE_API_KEY)"
}

Write-Output "== List models =="
try {
    $models = Invoke-RestMethod -Uri "$BaseUrl/models" -Headers $Headers -Method Get -TimeoutSec 30
    Write-Output "Model count: $($models.data.Count)"
} catch {
    Write-Output "ERROR: $($_.Exception.Message)"
}

Write-Output "`n== Non-streaming chat completion =="
$body = @{
    model      = "auto/best-coding"
    messages   = @(@{ role = "user"; content = "Say OK." })
    max_tokens = 5
    stream     = $false
} | ConvertTo-Json -Depth 5

try {
    $resp = Invoke-RestMethod -Uri "$BaseUrl/chat/completions" -Headers $Headers -Method Post `
        -ContentType "application/json" -Body $body -TimeoutSec 60
    $resp | ConvertTo-Json -Depth 5
} catch {
    Write-Output "ERROR: $($_.Exception.Message)"
}

Write-Output "`n== Streaming chat completion (SSE) =="
# Invoke-WebRequest does not stream SSE incrementally; this reads the full
# response body once the stream completes (or times out).
$streamBody = @{
    model    = "auto/best-coding"
    messages = @(@{ role = "user"; content = "Count to 3." })
    stream   = $true
} | ConvertTo-Json -Depth 5

try {
    $resp = Invoke-WebRequest -Uri "$BaseUrl/chat/completions" -Headers $Headers -Method Post `
        -ContentType "application/json" -Body $streamBody -TimeoutSec 60 -UseBasicParsing
    Write-Output $resp.Content
} catch {
    Write-Output "ERROR: $($_.Exception.Message)"
}
