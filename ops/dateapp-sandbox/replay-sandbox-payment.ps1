<#
.SYNOPSIS
  Replays a real Square SANDBOX payment to the local sandbox backend as a signed payment.updated event.

.DESCRIPTION
  Square only delivers webhooks to a public HTTPS address, and a tunnel is not allowed here, so
  Square's own delivery cannot reach 127.0.0.1. This script does the closest honest thing:
    1. Reads the payment from Square's sandbox API (read only) with the sandbox token.
    2. Wraps it in the same event shape Square sends (type payment.updated).
    3. Signs it exactly the way Square does: base64(HMAC-SHA256(key, notification_url + body)),
       using the local key in the sandbox env file.
    4. Posts it to the local backend's webhook address on 127.0.0.1 only.
  The backend's signature check stays on and is the same code production runs.
  Prints only the payment id, amount, status and the backend's reply. Never prints a setting value.

.PARAMETER PaymentId
  Sandbox payment id. Default: the newest COMPLETED 1 dollar payment at the sandbox location.
#>
[CmdletBinding()]
param(
    [string]$EnvFile = '',
    [string]$PaymentId = ''
)

$ErrorActionPreference = 'Stop'
. (Join-Path $PSScriptRoot 'sandbox-common.ps1')
if (-not $EnvFile) { $EnvFile = Get-SandboxEnvFile }
if (-not (Test-Path -LiteralPath $EnvFile)) { Write-Output "STOPPED: sandbox env file not found. Run start-sandbox.ps1 first."; exit 1 }
$values = Read-SandboxEnv -Path $EnvFile

if (-not (Test-SandboxSquareHost $values)) { Write-Output "REFUSED: Square host is not the sandbox host."; exit 2 }
$notify = Get-Setting $values 'SQUARE_PAYMENT_WEBHOOK_NOTIFICATION_URL'
if ($notify -notmatch '^http://127\.0\.0\.1:\d+/') { Write-Output "REFUSED: webhook address is not on 127.0.0.1."; exit 2 }
$key = Get-Setting $values 'SQUARE_PAYMENT_WEBHOOK_SIGNATURE_KEY'
$token = Get-Setting $values 'SQUARE_ACCESS_TOKEN'
$location = Get-Setting $values 'SQUARE_LOCATION_ID'
if (-not $key -or -not $token -or -not $location) { Write-Output "STOPPED: run start-sandbox.ps1 with both Josh values filled first."; exit 4 }

$squareHost = (Get-Setting $values 'SQUARE_API_BASE_URL').TrimEnd('/')
$headers = @{
    Authorization    = "Bearer $token"
    'Square-Version' = (Get-Setting $values 'SQUARE_API_VERSION')
}

if ($PaymentId) {
    $payment = (Invoke-RestMethod -Method Get -Uri "$squareHost/v2/payments/$PaymentId" -Headers $headers).payment
} else {
    $list = Invoke-RestMethod -Method Get -Headers $headers `
        -Uri "$squareHost/v2/payments?location_id=$([uri]::EscapeDataString($location))&sort_order=DESC&limit=20"
    $payment = @($list.payments) | Where-Object { $_.status -eq 'COMPLETED' -and $_.amount_money.amount -eq 100 } | Select-Object -First 1
}
if (-not $payment) { Write-Output "STOPPED: no completed 1 dollar sandbox payment found at this location."; exit 1 }

$event = [ordered]@{
    merchant_id = 'sandbox-replay'
    type        = 'payment.updated'
    event_id    = [guid]::NewGuid().ToString()
    created_at  = (Get-Date).ToUniversalTime().ToString('yyyy-MM-ddTHH:mm:ss.fffZ')
    data        = [ordered]@{
        type   = 'payment'
        id     = $payment.id
        object = [ordered]@{ payment = $payment }
    }
}
$body = $event | ConvertTo-Json -Depth 30 -Compress
$bytes = [Text.Encoding]::UTF8.GetBytes($body)

$hmac = New-Object System.Security.Cryptography.HMACSHA256 (, [Text.Encoding]::UTF8.GetBytes($key))
$signature = [Convert]::ToBase64String($hmac.ComputeHash([Text.Encoding]::UTF8.GetBytes($notify + $body)))

Write-Output ("Replaying sandbox payment {0}: {1} cents, status {2}" -f $payment.id, $payment.amount_money.amount, $payment.status)
$reply = Invoke-RestMethod -Method Post -Uri $notify -Body $bytes -ContentType 'application/json' `
    -Headers @{ 'x-square-hmacsha256-signature' = $signature }
Write-Output ("Backend reply: " + ($reply | ConvertTo-Json -Compress))
exit 0
