# Post one line to the shared node ledger on Buzz — PowerShell twin of ledger.sh
# for Windows nodes that do not have Git Bash.
#
#   .\ops\buzz\ledger.ps1 "landed X · path · sha"
#
# Reads BUZZ_* from .env at runtime; never prints a value.
param(
  [Parameter(Mandatory = $true, ValueFromRemainingArguments = $true)][string[]]$Message,
  [string]$Channel = $(if ($env:BUZZ_LEDGER_CHANNEL) { $env:BUZZ_LEDGER_CHANNEL } else { 'node-ledger' }),
  [string]$Agent   = $(if ($env:BUZZ_AGENT_NAME) { $env:BUZZ_AGENT_NAME } else { 'claude-judge' }),
  [string]$EnvFile = $(if ($env:ANTIGRAVITY_ENV) { $env:ANTIGRAVITY_ENV } else { 'C:\ANTIGRAVITY\.env' })
)
$ErrorActionPreference = 'Stop'
if (-not (Test-Path $EnvFile)) { Write-Error "ledger: $EnvFile not found — NOT CONFIGURED"; exit 2 }
foreach ($line in Get-Content $EnvFile) {
  if ($line -match '^(BUZZ_[A-Za-z_]+)=(.*)$') { Set-Item -Path "env:$($Matches[1])" -Value $Matches[2].Trim().Trim('"') }
}
if (-not $env:BUZZ_PRIVATE_KEY) { $env:BUZZ_PRIVATE_KEY = $env:BUZZ_IDENTITY_KEY }
if (-not $env:BUZZ_PRIVATE_KEY) { Write-Error 'ledger: BUZZ_IDENTITY_KEY missing — AUTH MISSING'; exit 3 }
if (-not $env:BUZZ_RELAY_URL) { $env:BUZZ_RELAY_URL = "https://$($env:BUZZ_COMMUNITY)" }
$buzz = if ($env:BUZZ_BIN) { $env:BUZZ_BIN } else { Join-Path $env:LOCALAPPDATA 'buzz\buzz.exe' }

$body = ($Message -join ' ').Trim()
if ($body -match 'sk_live_|sk_test_|ghp_[A-Za-z0-9]{20}|nsec1[a-z0-9]{50}|AKIA[0-9A-Z]{16}|BEGIN .*PRIVATE KEY|eyJhbGciOi') {
  Write-Error 'ledger: refusing — message contains a credential-shaped string'; exit 4
}

$repoDir = (git rev-parse --show-toplevel 2>$null)
$repo = if ($repoDir) { "$(Split-Path $repoDir -Leaf)@$(git -C $repoDir rev-parse --short HEAD 2>$null)" } else { 'no-repo' }
$stamp = (Get-Date).ToUniversalTime().ToString('yyyy-MM-ddTHH:mmZ')

$channels = & $buzz channels list | ConvertFrom-Json
$ch = ($channels | Where-Object { $_.name -eq $Channel } | Select-Object -First 1).channel_id
if (-not $ch) { Write-Error "ledger: channel '$Channel' not found on $($env:BUZZ_RELAY_URL)"; exit 2 }

$line = "[$stamp · $env:COMPUTERNAME · $Agent · $repo] $body"
$line | & $buzz messages send --channel $ch --content - | Out-Null
Write-Host "ledger: posted to #$Channel as $Agent@$env:COMPUTERNAME"
