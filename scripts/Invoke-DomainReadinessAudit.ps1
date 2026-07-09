# Read-only DNS/public route audit.
# This script does not mutate Cloudflare, Wrangler, DNS records, tunnels, or payments.

[CmdletBinding()]
param(
  [string]$RepoRoot = 'C:\antigravity',
  [string]$RouteConfigPath = '',
  [string]$OutputPath = '',
  [int]$TimeoutSec = 4
)

$ErrorActionPreference = 'Continue'

if (-not $RouteConfigPath) {
  $RouteConfigPath = Join-Path $RepoRoot 'ops\mission-control\domain-routes.json'
}

$LogDir = Join-Path $RepoRoot 'logs'
New-Item -ItemType Directory -Force -Path $LogDir | Out-Null
if (-not $OutputPath) {
  $stamp = Get-Date -Format 'yyyyMMdd-HHmmss'
  $OutputPath = Join-Path $LogDir "domain-readiness-audit-$stamp.json"
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

function Resolve-HostRecords {
  param([string]$HostName)
  try {
    $records = Resolve-DnsName -Name $HostName -ErrorAction Stop |
      Where-Object { $_.Type -in @('A','AAAA','CNAME') } |
      Select-Object Type,NameHost,IPAddress
    return [pscustomobject]@{
      ok = @($records).Count -gt 0
      records = @($records)
      error = $null
    }
  } catch {
    return [pscustomobject]@{
      ok = $false
      records = @()
      error = $_.Exception.Message
    }
  }
}

function Test-PublicHttp {
  param([string]$HostName)
  $url = "https://$HostName/"
  try {
    $response = Invoke-WebRequest -Uri $url -Method Head -UseBasicParsing -MaximumRedirection 5 -TimeoutSec $TimeoutSec
    return [pscustomobject]@{
      ok = $response.StatusCode -ge 200 -and $response.StatusCode -lt 500
      url = $url
      statusCode = $response.StatusCode
      finalUrl = $response.BaseResponse.ResponseUri.AbsoluteUri
      error = $null
    }
  } catch {
    try {
      $response = Invoke-WebRequest -Uri $url -Method Get -UseBasicParsing -MaximumRedirection 5 -TimeoutSec $TimeoutSec
      return [pscustomobject]@{
        ok = $response.StatusCode -ge 200 -and $response.StatusCode -lt 500
        url = $url
        statusCode = $response.StatusCode
        finalUrl = $response.BaseResponse.ResponseUri.AbsoluteUri
        error = $null
      }
    } catch {
      return [pscustomobject]@{
        ok = $false
        url = $url
        statusCode = $null
        finalUrl = $null
        error = $_.Exception.Message
      }
    }
  }
}

function Get-ActiveLegacyReferences {
  param([string]$Root)
  $legacyMatches = New-Object System.Collections.Generic.List[object]
  $rg = Get-Command rg -ErrorAction SilentlyContinue
  if ($rg) {
    $args = @(
      '-n',
      'onlinerecycle\.org',
      'ops',
      'docs',
      'scripts',
      'services',
      'frontend',
      'backend',
      'apps',
      '--glob', '!**/archive/**',
      '--glob', '!**/business-only-retired-2026-06-22/**',
      '--glob', '!**/node_modules/**',
      '--glob', '!**/.next/**',
      '--glob', '!**/dist/**',
      '--glob', '!**/build/**',
      '--glob', '!scripts/Invoke-DomainReadinessAudit.ps1'
    )
    $raw = & $rg.Source @args 2>$null
    foreach ($line in @($raw)) {
      $parsed = [regex]::Match($line, '^(.*?):(\d+):(.*)$')
      if ($parsed.Success) {
        $legacyMatches.Add([pscustomobject]@{
          path = Join-Path $Root $parsed.Groups[1].Value
          line = [int]$parsed.Groups[2].Value
          text = $parsed.Groups[3].Value.Trim()
        })
      }
    }
    return @($legacyMatches | ForEach-Object { $_ })
  }

  $searchRoots = @('ops','docs','scripts','services','frontend','backend','apps') |
    ForEach-Object { Join-Path $Root $_ } |
    Where-Object { Test-Path -LiteralPath $_ }
  if (-not $searchRoots.Count) { return @() }

  $files = Get-ChildItem -Path $searchRoots -Recurse -File -ErrorAction SilentlyContinue |
    Where-Object {
      $_.Length -lt 2000000 -and
      $_.FullName -notmatch '\\archive\\' -and
      $_.FullName -notmatch '\\business-only-retired-2026-06-22\\' -and
      $_.FullName -notmatch '\\node_modules\\' -and
      $_.FullName -notmatch '\\\.next\\' -and
      $_.FullName -notmatch '\\dist\\' -and
      $_.FullName -notmatch '\\build\\' -and
      $_.FullName -notmatch '\\scripts\\Invoke-DomainReadinessAudit\.ps1$'
    }

  foreach ($file in $files) {
    try {
      $found = Select-String -LiteralPath $file.FullName -Pattern 'onlinerecycle\.org' -AllMatches -ErrorAction SilentlyContinue
      foreach ($item in $found) {
        $legacyMatches.Add([pscustomobject]@{
          path = $file.FullName
          line = $item.LineNumber
          text = $item.Line.Trim()
        })
      }
    } catch {}
  }
  return @($legacyMatches | ForEach-Object { $_ })
}

$checks = New-Object System.Collections.Generic.List[object]

if (-not (Test-Path -LiteralPath $RouteConfigPath)) {
  $checks.Add((New-Check 'route-config' 'fail' "Missing domain route config: $RouteConfigPath"))
} else {
  try {
    $config = Get-Content -Raw -LiteralPath $RouteConfigPath | ConvertFrom-Json
    $checks.Add((New-Check 'route-config' 'pass' 'Domain route config loaded.' @{ path = $RouteConfigPath; lastUpdated = $config.lastUpdated }))

    $onlineRecycleRoutes = @($config.routes | Where-Object { $_.domain -eq 'onlinerecycle.net' })
    $legacyOnlineRecycleRoutes = @($config.routes | Where-Object { $_.domain -eq 'onlinerecycle.org' -or @($_.aliases) -contains 'onlinerecycle.org' })
    if ($onlineRecycleRoutes.Count -gt 0 -and $legacyOnlineRecycleRoutes.Count -eq 0) {
      $checks.Add((New-Check 'onlinerecycle-canonical-domain' 'pass' 'OnlineRecycle canonical route is onlinerecycle.net and no .org route is active.' $onlineRecycleRoutes))
    } else {
      $checks.Add((New-Check 'onlinerecycle-canonical-domain' 'fail' 'OnlineRecycle route config still has missing .net or active .org references.' @{ netRoutes = $onlineRecycleRoutes; legacyRoutes = $legacyOnlineRecycleRoutes }))
    }

    foreach ($route in $config.routes) {
      $publicExpected = $route.status -in @('route-required','needs-online','reserved','parked')
      $hosts = @($route.domain) + @($route.aliases)
      foreach ($hostName in $hosts) {
        $dns = Resolve-HostRecords $hostName
        $isPrimary = $hostName -eq $route.domain
        $http = if ($publicExpected -and $isPrimary) { Test-PublicHttp $hostName } else { $null }
        $status = 'pass'
        $message = 'DNS resolves'
        if (-not $dns.ok) {
          $status = if ($publicExpected) { 'incomplete' } else { 'pass' }
          $message = if ($publicExpected) { 'DNS does not resolve yet.' } else { 'Private/standby route has no public DNS requirement.' }
        } elseif ($publicExpected -and $isPrimary -and (-not $http.ok)) {
          $status = 'incomplete'
          $message = 'DNS resolves but public HTTPS did not return a usable status.'
        } elseif ($publicExpected -and (-not $isPrimary)) {
          $message = 'Alias DNS resolves; HTTPS probe is limited to primary route domains.'
        } elseif (-not $publicExpected) {
          $message = 'Private/standby route DNS observed; exposure still requires approval.'
        } else {
          $message = 'DNS and public HTTPS respond.'
        }
        $checks.Add((New-Check "domain $hostName" $status $message @{
          lane = $route.lane
          routeStatus = $route.status
          publicExpected = $publicExpected
          dns = $dns
          http = $http
        }))
      }
    }
  } catch {
    $checks.Add((New-Check 'route-config' 'fail' $_.Exception.Message @{ path = $RouteConfigPath }))
  }
}

$legacyReferences = Get-ActiveLegacyReferences $RepoRoot
if ($legacyReferences.Count -eq 0) {
  $checks.Add((New-Check 'active-onlinerecycle-org-references' 'pass' 'No active non-archive onlinerecycle.org references found.'))
} else {
  $checks.Add((New-Check 'active-onlinerecycle-org-references' 'fail' 'Active non-archive onlinerecycle.org references remain.' $legacyReferences))
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
  routeConfigPath = $RouteConfigPath
  summary = $summary
  checks = $checks
}

$report | ConvertTo-Json -Depth 20 | Set-Content -LiteralPath $OutputPath -Encoding UTF8
$report | ConvertTo-Json -Depth 20

if ($summary['fail'] -gt 0) { exit 1 }
if ($summary['incomplete'] -gt 0 -or $summary['warn'] -gt 0) { exit 2 }
exit 0
