# Creates a redacted Square Sandbox payment evidence artifact.
#
# Default mode is dry-run and does not call Square. Use -Execute only after
# sandbox credentials are loaded in the current process environment.
# This script never reads .env files and never prints access tokens, card
# numbers, buyer details, raw payment IDs, or raw receipt URLs.
#
# Official Square sandbox values used here:
# - Web Payments UI card success: 4111 1111 1111 1111
# - Server-side CreatePayment source_id success: cnon:card-nonce-ok
# - ACH/Plaid sandbox success source_id: bnon:bank-nonce-ok

[CmdletBinding()]
param(
  [ValidateSet('date-app','business-exchange','online-recycle')]
  [string]$Lane = 'date-app',
  [ValidateSet('card','ach')]
  [string]$PaymentMethod = 'card',
  [ValidateRange(1,10000000)]
  [int]$AmountCents = 100,
  [string]$Currency = 'USD',
  [string]$SourceId = '',
  [string]$RepoRoot = 'C:\antigravity',
  [string]$OutputPath = '',
  [string]$AccessTokenEnv = 'SQUARE_SANDBOX_ACCESS_TOKEN',
  [string]$LocationIdEnv = 'SQUARE_SANDBOX_LOCATION_ID',
  [string]$SquareVersion = '',
  [switch]$Execute
)

$ErrorActionPreference = 'Stop'

if ([string]::IsNullOrWhiteSpace($SourceId)) {
  if ($PaymentMethod -eq 'ach') {
    $SourceId = 'bnon:bank-nonce-ok'
  } else {
    $SourceId = 'cnon:card-nonce-ok'
  }
}

function ConvertTo-Sha256 {
  param([AllowNull()][string]$Value)
  if ([string]::IsNullOrWhiteSpace($Value)) { return $null }
  $bytes = [Text.Encoding]::UTF8.GetBytes($Value)
  $hash = [Security.Cryptography.SHA256]::Create().ComputeHash($bytes)
  return 'sha256:' + (($hash | ForEach-Object { $_.ToString('x2') }) -join '')
}

function New-SafeEvidence {
  param(
    [string]$Status,
    [hashtable]$Square = @{},
    [string]$Message = ''
  )
  [ordered]@{
    evidence_status = $Status
    lane = $Lane
    provider = 'square'
    environment = 'sandbox'
    payment_method = $PaymentMethod
    amount_cents = $AmountCents
    currency = $Currency
    message = $Message
    square = $Square
    source_id_label = if ($SourceId -eq 'cnon:card-nonce-ok') { 'official-square-sandbox-card-success-token' } elseif ($SourceId -eq 'bnon:bank-nonce-ok') { 'official-square-sandbox-ach-success-token' } else { 'custom-source-id-not-printed' }
    no_card_numbers_or_secret_values_printed = $true
    generated_at = (Get-Date).ToUniversalTime().ToString('o')
  }
}

$proofDir = Join-Path $RepoRoot 'ops\mission-control\payment-sandbox-proofs'
New-Item -ItemType Directory -Force -Path $proofDir | Out-Null

if (-not $OutputPath) {
  $stamp = Get-Date -Format 'yyyyMMdd-HHmmss'
  $OutputPath = Join-Path $proofDir "square-sandbox-$Lane-$stamp.json"
}

if (-not $Execute) {
  $evidence = New-SafeEvidence -Status 'dry_run' -Message 'Dry run only. Re-run with -Execute after sandbox env vars are loaded.'
  $evidence.required_env = @($AccessTokenEnv, $LocationIdEnv)
  $evidence.square_endpoint = 'https://connect.squareupsandbox.com/v2/payments'
  $evidence.web_payments_ui_test_card = 'Square official sandbox Visa success card; do not use in production.'
  $evidence.server_create_payment_source_id = 'cnon:card-nonce-ok'
  $evidence.ach_plaid_sandbox = @{
    source_id = 'bnon:bank-nonce-ok'
    username = 'user_good'
    password = 'pass_good'
    note = 'Official sandbox-only Plaid-style credentials; do not use as production credentials.'
  }
  $evidence | ConvertTo-Json -Depth 10 | Set-Content -LiteralPath $OutputPath -Encoding UTF8
  $evidence | ConvertTo-Json -Depth 10
  exit 0
}

$accessToken = [Environment]::GetEnvironmentVariable($AccessTokenEnv)
$locationId = [Environment]::GetEnvironmentVariable($LocationIdEnv)
if ([string]::IsNullOrWhiteSpace($accessToken)) {
  throw "Missing sandbox access token env var: $AccessTokenEnv"
}
if ([string]::IsNullOrWhiteSpace($locationId)) {
  throw "Missing sandbox location id env var: $LocationIdEnv"
}

$idempotencyKey = [guid]::NewGuid().ToString()
$referenceId = "sandbox:${Lane}:$($idempotencyKey.Substring(0,8))"
$body = @{
  source_id = $SourceId
  idempotency_key = $idempotencyKey
  location_id = $locationId
  reference_id = $referenceId
  note = "ANTIGRAVITY sandbox payment probe lane=$Lane method=$PaymentMethod"
  amount_money = @{
    amount = $AmountCents
    currency = $Currency
  }
}

$headers = @{
  Authorization = "Bearer $accessToken"
  'Content-Type' = 'application/json'
}
if (-not [string]::IsNullOrWhiteSpace($SquareVersion)) {
  $headers['Square-Version'] = $SquareVersion
}

try {
  $response = Invoke-RestMethod `
    -Method Post `
    -Uri 'https://connect.squareupsandbox.com/v2/payments' `
    -Headers $headers `
    -Body ($body | ConvertTo-Json -Depth 10) `
    -TimeoutSec 30

  $payment = $response.payment
  $evidence = New-SafeEvidence -Status 'candidate' -Message 'Sandbox CreatePayment returned a payment object. Webhook receipt still must be checked separately if required.'
  $evidence.square = [ordered]@{
    payment_id_hash = ConvertTo-Sha256 $payment.id
    order_id_hash = ConvertTo-Sha256 $payment.order_id
    receipt_number_hash = ConvertTo-Sha256 $payment.receipt_number
    receipt_url_hash = ConvertTo-Sha256 $payment.receipt_url
    status = $payment.status
    created_at = $payment.created_at
    updated_at = $payment.updated_at
    amount_cents = $payment.amount_money.amount
    currency = $payment.amount_money.currency
    location_id_hash = ConvertTo-Sha256 $payment.location_id
    reference_id_hash = ConvertTo-Sha256 $payment.reference_id
    source_type = $payment.source_type
  }
  $evidence | ConvertTo-Json -Depth 12 | Set-Content -LiteralPath $OutputPath -Encoding UTF8
  $evidence | ConvertTo-Json -Depth 12
} catch {
  $evidence = New-SafeEvidence -Status 'blocked' -Message $_.Exception.Message
  $evidence | ConvertTo-Json -Depth 10 | Set-Content -LiteralPath $OutputPath -Encoding UTF8
  $evidence | ConvertTo-Json -Depth 10
  exit 1
}
