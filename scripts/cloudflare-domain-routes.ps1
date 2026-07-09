# Dry-run/apply helper for Mission Control domain routes.
#
# Default mode is dry-run. Live apply requires:
#   -Apply
#   $env:CLOUDFLARE_API_TOKEN
#   zone id env vars such as CF_ZONE_AI_SOLUTIONS_STORE, CF_ZONE_AIDESISTAIL_ONLINE
#
# This script does not print token values.

param(
    [switch]$Apply
)

$ErrorActionPreference = 'Stop'

$RepoRoot = Split-Path -Parent $PSScriptRoot
$RoutesFile = Join-Path $RepoRoot 'ops\mission-control\domain-routes.json'

if (-not (Test-Path $RoutesFile)) {
    throw "Missing route file: $RoutesFile"
}

$config = Get-Content -Raw -LiteralPath $RoutesFile | ConvertFrom-Json

function Get-RootDomain {
    param([string]$Domain)
    $parts = $Domain.Split('.')
    if ($parts.Length -lt 2) { return $Domain }
    return ($parts[($parts.Length - 2)..($parts.Length - 1)] -join '.')
}

function Get-ZoneEnvName {
    param([string]$RootDomain)
    'CF_ZONE_' + ($RootDomain.ToUpperInvariant() -replace '[^A-Z0-9]', '_')
}

function Write-Route {
    param($Route)
    $root = Get-RootDomain $Route.domain
    $zoneEnv = Get-ZoneEnvName $root
    [pscustomobject]@{
        Domain = $Route.domain
        Aliases = (($Route.aliases | ForEach-Object { $_ }) -join ', ')
        Lane = $Route.lane
        Service = $Route.service
        Node = $Route.node
        LocalTarget = $Route.localTarget
        Method = $Route.publicMethod
        Status = $Route.status
        ZoneEnv = $zoneEnv
    }
}

$rows = foreach ($route in $config.routes) { Write-Route $route }
$rows | Format-Table -AutoSize

if (-not $Apply) {
    Write-Host ''
    Write-Host 'Dry-run only. Re-run with -Apply after exact DNS targets are confirmed.' -ForegroundColor Yellow
    exit 0
}

if (-not $env:CLOUDFLARE_API_TOKEN) {
    throw 'CLOUDFLARE_API_TOKEN is not set in the current process environment.'
}

throw 'Apply mode is intentionally blocked until exact record types and target hostnames are filled in for each route.'
