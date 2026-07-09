# Read-only payment readiness audit for the three revenue lanes.
# This does not read populated .env files, charge cards, call Square APIs, or
# expose transaction secrets. It checks code readiness and redacted proof files.

[CmdletBinding()]
param(
  [string]$RepoRoot = 'C:\antigravity',
  [string]$ProofPath = '',
  [string]$OutputPath = ''
)

$ErrorActionPreference = 'Continue'

if (-not $ProofPath) {
  $ProofPath = Join-Path $RepoRoot 'ops\mission-control\payment-transaction-proofs.json'
}

$LogDir = Join-Path $RepoRoot 'logs'
New-Item -ItemType Directory -Force -Path $LogDir | Out-Null
if (-not $OutputPath) {
  $stamp = Get-Date -Format 'yyyyMMdd-HHmmss'
  $OutputPath = Join-Path $LogDir "payment-readiness-audit-$stamp.json"
}

function New-Check {
  param(
    [string]$Name,
    [string]$Status,
    [string]$Message,
    [object]$Data = $null
  )
  [pscustomobject]@{
    name = $Name
    status = $Status
    message = $Message
    data = $Data
  }
}

function Test-FileContains {
  param(
    [string]$RelativePath,
    [string[]]$Patterns
  )
  $path = Join-Path $RepoRoot $RelativePath
  if (-not (Test-Path -LiteralPath $path)) {
    return [pscustomobject]@{ path = $path; exists = $false; missingPatterns = $Patterns; matchedPatterns = @() }
  }
  $text = Get-Content -Raw -LiteralPath $path -ErrorAction SilentlyContinue
  $matched = @()
  $missing = @()
  foreach ($pattern in $Patterns) {
    if ($text -match $pattern) { $matched += $pattern } else { $missing += $pattern }
  }
  return [pscustomobject]@{ path = $path; exists = $true; missingPatterns = $missing; matchedPatterns = $matched }
}

function Add-StaticCheck {
  param(
    [System.Collections.Generic.List[object]]$Checks,
    [string]$Name,
    [string]$RelativePath,
    [string[]]$Patterns,
    [string]$PassMessage,
    [string]$FailMessage
  )
  $result = Test-FileContains -RelativePath $RelativePath -Patterns $Patterns
  if ($result.exists -and @($result.missingPatterns).Count -eq 0) {
    $Checks.Add((New-Check $Name 'pass' $PassMessage $result))
  } else {
    $Checks.Add((New-Check $Name 'incomplete' $FailMessage $result))
  }
}

function Get-ProofForLane {
  param(
    [object]$Proof,
    [string]$Lane
  )
  if (-not $Proof -or -not $Proof.lanes) { return $null }
  return @($Proof.lanes | Where-Object { $_.lane -eq $Lane } | Select-Object -First 1)
}

function Test-ProofPlaceholder {
  param(
    [string]$Field,
    [object]$Value
  )
  if ($null -eq $Value) { return $true }
  $text = ([string]$Value).Trim()
  if ([string]::IsNullOrWhiteSpace($text)) { return $true }
  $placeholderValues = @(
    'YYYY-MM-DDTHH:mm:ssZ',
    'sandbox-or-production',
    'redacted-provider-transaction-id',
    'redacted-receipt-id',
    'redacted-webhook-event-id'
  )
  if ($placeholderValues -contains $text) { return $true }
  if ($text -match '^example-' -or $text -match '^todo-' -or $text -match '^placeholder-') { return $true }
  return $false
}

function Test-IsoTimestamp {
  param([object]$Value)
  if (Test-ProofPlaceholder 'timestamp' $Value) { return $false }
  $parsed = [DateTimeOffset]::MinValue
  return [DateTimeOffset]::TryParse([string]$Value, [ref]$parsed)
}

function Test-ProofComplete {
  param([object]$LaneProof)
  if (-not $LaneProof) { return $false }
  $required = @(
    'lane',
    'environment',
    'approvedBy',
    'approvedAt',
    'transactionId',
    'receiptId',
    'webhookEventId',
    'webhookReceivedAt',
    'provider',
    'amountCents'
  )
  foreach ($field in $required) {
    if (-not ($LaneProof.PSObject.Properties.Name -contains $field)) { return $false }
    if (Test-ProofPlaceholder $field $LaneProof.$field) { return $false }
  }
  if (@('sandbox','production') -notcontains ([string]$LaneProof.environment).ToLowerInvariant()) { return $false }
  if (@('square') -notcontains ([string]$LaneProof.provider).ToLowerInvariant()) { return $false }
  if (-not (Test-IsoTimestamp $LaneProof.approvedAt)) { return $false }
  if (-not (Test-IsoTimestamp $LaneProof.webhookReceivedAt)) { return $false }
  $amount = 0
  if (-not [int]::TryParse([string]$LaneProof.amountCents, [ref]$amount)) { return $false }
  if ($amount -le 0) { return $false }
  return $true
}

$checks = New-Object System.Collections.Generic.List[object]

Add-StaticCheck $checks 'date-app-square-payment-webhook' 'backend\fastapi-app\app\routers\webhooks.py' @(
  '@router\.post\("/square-payment"',
  'payment\.completed',
  '_verify_square_signature',
  'mark_webhook_event_processed'
) 'Date-app Square payment webhook structure is present.' 'Date-app Square payment webhook structure is incomplete.'

Add-StaticCheck $checks 'date-app-account-bound-checkout' 'backend\fastapi-app\app\routers\billing.py' @(
  '@router\.post\("/checkout-link"',
  'build_checkout_reference',
  'create_square_payment_link'
) 'Date-app account-bound checkout route is present.' 'Date-app account-bound checkout route is incomplete.'

Add-StaticCheck $checks 'date-app-checkout-truth' 'backend\fastapi-app\app\payment_truth.py' @(
  'build_checkout_reference',
  'parse_checkout_reference',
  'build_account_bound_checkout_request',
  'infer_payment_tier'
) 'Date-app checkout reference and tier truth helpers are present.' 'Date-app checkout truth helpers are incomplete.'

Add-StaticCheck $checks 'date-app-square-link-creator' 'backend\fastapi-app\app\square_checkout.py' @(
  '/v2/online-checkout/payment-links',
  'square_access_token',
  'square_location_id'
) 'Square payment-link creation helper is present.' 'Square payment-link creation helper is incomplete.'

Add-StaticCheck $checks 'date-app-payment-tests' 'backend\fastapi-app\tests\test_square_webhook_security.py' @(
  '/api/v1/webhooks/square-payment',
  'x-square-hmacsha256-signature'
) 'Square webhook security tests are present.' 'Square webhook security tests are incomplete.'

Add-StaticCheck $checks 'square-sandbox-payment-probe' 'scripts\payments\Invoke-SquareSandboxPaymentProbe.ps1' @(
  'connect\.squareupsandbox\.com/v2/payments',
  'cnon:card-nonce-ok',
  'bnon:bank-nonce-ok',
  'SQUARE_SANDBOX_ACCESS_TOKEN',
  'payment-sandbox-proofs'
) 'Square sandbox payment probe exists for no-live-dollar verification.' 'Square sandbox payment probe is missing or incomplete.'

Add-StaticCheck $checks 'online-recycle-square-booking-webhook' 'backend\fastapi-app\app\routers\webhooks.py' @(
  '@router\.post\("/square-booking"',
  'square_booking_webhook',
  'OnlineRecycle\.net'
) 'OnlineRecycle Square booking webhook is present and uses .net wording.' 'OnlineRecycle booking webhook is missing or still has stale wording.'

Add-StaticCheck $checks 'online-recycle-booking-watchdog' 'scripts\youandinotai\square-booking-watchdog.js' @(
  'square-booking',
  'BOOKINGS_CSV',
  'NEW_BOOKING'
) 'OnlineRecycle booking watchdog exists.' 'OnlineRecycle booking watchdog is incomplete.'

Add-StaticCheck $checks 'business-exchange-app-present' 'apps\business-exchange\prisma\schema.prisma' @(
  'pricing',
  'Listing'
) 'Business Exchange marketplace/pricing data model is present.' 'Business Exchange marketplace/pricing model is incomplete.'

$businessCheckout = Test-FileContains -RelativePath 'apps\business-exchange\src\app\api\checkout\route.ts' -Patterns @('Square|square|checkout|payment')
if ($businessCheckout.exists -and @($businessCheckout.missingPatterns).Count -eq 0) {
  $checks.Add((New-Check 'business-exchange-checkout-route' 'pass' 'Business Exchange lane-specific checkout route exists.' $businessCheckout))
} else {
  $checks.Add((New-Check 'business-exchange-checkout-route' 'incomplete' 'Business Exchange has marketplace/pricing structure but no lane-specific checkout route was found.' $businessCheckout))
}

$proof = $null
if (Test-Path -LiteralPath $ProofPath) {
  try {
    $proof = Get-Content -Raw -LiteralPath $ProofPath | ConvertFrom-Json
    $checks.Add((New-Check 'payment-proof-file' 'pass' 'Payment proof file loaded.' @{ path = $ProofPath }))
  } catch {
    $checks.Add((New-Check 'payment-proof-file' 'fail' $_.Exception.Message @{ path = $ProofPath }))
  }
} else {
  $checks.Add((New-Check 'payment-proof-file' 'incomplete' 'No redacted payment proof file exists yet.' @{ path = $ProofPath }))
}

foreach ($lane in @('date-app','business-exchange','online-recycle')) {
  $laneProof = Get-ProofForLane -Proof $proof -Lane $lane
  if (Test-ProofComplete $laneProof) {
    $checks.Add((New-Check "transaction-proof-$lane" 'pass' "Redacted transaction and webhook proof exists for $lane." $laneProof))
  } else {
    $checks.Add((New-Check "transaction-proof-$lane" 'incomplete' "No complete redacted transaction/webhook proof exists for $lane." $laneProof))
  }
}

$legacyScan = & rg -ni 'onlinerecycle\.org' backend/fastapi-app/app backend/fastapi-app/API_DOCS.md backend/fastapi-app/openapi.json scripts/onlinerecycle scripts/clawx-control docs/governance 2>$null
if ($LASTEXITCODE -eq 0 -and @($legacyScan).Count -gt 0) {
  $checks.Add((New-Check 'active-payment-lane-stale-domain' 'fail' 'Active payment/revenue lane files still reference OnlineRecycle.org.' @($legacyScan)))
} else {
  $checks.Add((New-Check 'active-payment-lane-stale-domain' 'pass' 'Active payment/revenue lane files use OnlineRecycle.net.'))
}

$summary = @{
  pass = @($checks | Where-Object status -eq 'pass').Count
  fail = @($checks | Where-Object status -eq 'fail').Count
  warn = @($checks | Where-Object status -eq 'warn').Count
  incomplete = @($checks | Where-Object status -eq 'incomplete').Count
}

$report = [pscustomobject]@{
  timestamp = (Get-Date).ToString('o')
  repoRoot = $RepoRoot
  proofPath = $ProofPath
  summary = $summary
  checks = $checks
}

$report | ConvertTo-Json -Depth 20 | Set-Content -LiteralPath $OutputPath -Encoding UTF8
$report | ConvertTo-Json -Depth 20

if ($summary['fail'] -gt 0) { exit 1 }
if ($summary['incomplete'] -gt 0 -or $summary['warn'] -gt 0) { exit 2 }
exit 0
