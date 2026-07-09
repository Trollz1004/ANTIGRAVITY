# Read-only Cloudflare Pages/domain routing audit.
#
# Intended to run on T5500, where Wrangler/Cloudflare auth lives.
# This script reads the provided env file into process memory only, does not
# print secrets, and does not mutate DNS, Pages projects, or custom domains.

[CmdletBinding()]
param(
  [string]$EnvFile = '',
  [string]$AccountId = '516a3a855f44f5ad8453636d163ae25d',
  [string]$OutputPath = ''
)

$ErrorActionPreference = 'Stop'

if (-not $EnvFile) {
  $EnvFile = 'C:\Users\joshl\OneDrive\Personal Vault-DESKTOP-H4B53GL\ENV-AUTHORITY-20260608-082127\derived-platform-envs\runtime-misc.env'
}

if (-not (Test-Path -LiteralPath $EnvFile)) {
  throw "Missing env file: $EnvFile"
}

$vars = @{}
Get-Content -LiteralPath $EnvFile | ForEach-Object {
  $line = $_.Trim()
  if ($line -and -not $line.StartsWith('#') -and $line.Contains('=')) {
    $k, $v = $line.Split('=', 2)
    $vars[$k.Trim()] = $v.Trim().Trim('"')
  }
}

$token = $vars['CLOUDFLARE_API_TOKEN']
if ([string]::IsNullOrWhiteSpace($token)) {
  throw 'CLOUDFLARE_API_TOKEN is missing in the provided env file.'
}

$headers = @{
  Authorization = "Bearer $token"
  'Content-Type' = 'application/json'
}

$repoRoot = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
$logDir = Join-Path $repoRoot 'logs'
New-Item -ItemType Directory -Force -Path $logDir | Out-Null
if (-not $OutputPath) {
  $stamp = Get-Date -Format 'yyyyMMdd-HHmmss'
  $OutputPath = Join-Path $logDir "cloudflare-domain-routing-audit-$stamp.json"
}

$zoneResponse = Invoke-RestMethod -Method Get -Uri 'https://api.cloudflare.com/client/v4/zones?per_page=100' -Headers $headers
$zones = @($zoneResponse.result | Select-Object name, id, status, type)

$projects = @(
  'youandinotai',
  'ai-solutions-store',
  'onlinerecycle',
  'antigravity-mission-control'
)

$projectDomains = foreach ($project in $projects) {
  try {
    $domainResponse = Invoke-RestMethod -Method Get -Uri "https://api.cloudflare.com/client/v4/accounts/$AccountId/pages/projects/$project/domains" -Headers $headers
    [pscustomobject]@{
      project = $project
      ok = $true
      domains = @($domainResponse.result | Select-Object name, status, verification_data)
    }
  } catch {
    [pscustomobject]@{
      project = $project
      ok = $false
      error = $_.Exception.Message
    }
  }
}

function Get-ZoneStatus {
  param([string]$Name)
  $zone = $zones | Where-Object { $_.name -eq $Name } | Select-Object -First 1
  if ($zone) { return $zone.status }
  return 'missing'
}

function Get-PagesDomainStatus {
  param(
    [string]$Project,
    [string]$Domain
  )
  $projectData = $projectDomains | Where-Object { $_.project -eq $Project } | Select-Object -First 1
  if (-not $projectData -or -not $projectData.ok) { return 'project-query-failed' }
  $domainData = @($projectData.domains | Where-Object { $_.name -eq $Domain } | Select-Object -First 1)
  if (-not $domainData) { return 'missing' }
  return $domainData.status
}

$routingChecks = @(
  [pscustomobject]@{
    name = 'youandinotai.com'
    zone = Get-ZoneStatus 'youandinotai.com'
    pagesProject = 'youandinotai'
    pagesDomain = Get-PagesDomainStatus 'youandinotai' 'youandinotai.com'
  },
  [pscustomobject]@{
    name = 'www.youandinotai.com'
    zone = Get-ZoneStatus 'youandinotai.com'
    pagesProject = 'youandinotai'
    pagesDomain = Get-PagesDomainStatus 'youandinotai' 'www.youandinotai.com'
  },
  [pscustomobject]@{
    name = 'ai-solutions.store'
    zone = Get-ZoneStatus 'ai-solutions.store'
    pagesProject = 'ai-solutions-store'
    pagesDomain = Get-PagesDomainStatus 'ai-solutions-store' 'ai-solutions.store'
  },
  [pscustomobject]@{
    name = 'www.ai-solutions.store'
    zone = Get-ZoneStatus 'ai-solutions.store'
    pagesProject = 'ai-solutions-store'
    pagesDomain = Get-PagesDomainStatus 'ai-solutions-store' 'www.ai-solutions.store'
  },
  [pscustomobject]@{
    name = 'onlinerecycle.net'
    zone = Get-ZoneStatus 'onlinerecycle.net'
    pagesProject = 'onlinerecycle'
    pagesDomain = Get-PagesDomainStatus 'onlinerecycle' 'onlinerecycle.net'
  },
  [pscustomobject]@{
    name = 'onlinerecycle.org'
    zone = Get-ZoneStatus 'onlinerecycle.org'
    pagesProject = 'onlinerecycle'
    pagesDomain = Get-PagesDomainStatus 'onlinerecycle' 'onlinerecycle.org'
  }
)

$summary = @{
  activeZones = @($zones | Where-Object status -eq 'active').Count
  pendingZones = @($zones | Where-Object status -eq 'pending').Count
  missingOnlineRecycleNetZone = ((Get-ZoneStatus 'onlinerecycle.net') -eq 'missing')
  onlineRecycleOrgStillAttached = ((Get-PagesDomainStatus 'onlinerecycle' 'onlinerecycle.org') -ne 'missing')
}

$report = [pscustomobject]@{
  timestamp = (Get-Date).ToString('o')
  accountId = $AccountId
  envFilePath = $EnvFile
  summary = $summary
  zones = $zones
  pagesDomains = $projectDomains
  routingChecks = $routingChecks
  noSecretValuesPrinted = $true
}

$report | ConvertTo-Json -Depth 20 | Set-Content -LiteralPath $OutputPath -Encoding UTF8
$report | ConvertTo-Json -Depth 20

if ($summary.missingOnlineRecycleNetZone -or $summary.onlineRecycleOrgStillAttached) {
  exit 2
}

exit 0
