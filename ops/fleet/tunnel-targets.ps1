<#
.SYNOPSIS
Audits or updates T5500 cloudflared config.yml ingress targets from ops/fleet/fleet-map.json.

.DESCRIPTION
FINALIZE Stage A.7 safety script (print-by-default, -Apply gated):
- Defaults -ConfigPath to (Join-Path $env:USERPROFILE '.cloudflared\config.yml').
- Drops stale 'dashboard.aidoesitall.website' hostname + service ingress pair.
- Rewrites loopback host and port targets on service lines to 192.168.0.15:<PORT>
  strictly for LAN-scoped ('lan' or 'lan-guarded') T5500 services in ops/fleet/fleet-map.json
  (local-only Postgres 5432 and Redis 6379 are never rewritten).
- Probes the live TCP listener on 192.168.0.15:<PORT> when -ProbeLive is passed or when
  executing directly on T5500 (unless -SkipProbe is passed for offline/fixture runs).
- Prints a diff by default without touching disk; with -Apply, creates a timestamped
  backup first and edits ONLY hostname and service lines.
#>
[CmdletBinding()]
param(
    [string]$ConfigPath = (Join-Path $env:USERPROFILE '.cloudflared\config.yml'),
    [switch]$Apply,
    [switch]$ProbeLive,
    [switch]$SkipProbe,
    [string]$MapPath = ''
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$requestedConfigPath = $ConfigPath
$requestedMapPath = $MapPath
$staleDashboardHost = 'dashboard.aidoesitall.website'

. (Join-Path $PSScriptRoot 'Get-FleetEndpoint.ps1')

$map = Get-FleetMap -CustomMapPath $requestedMapPath
$t5500Node = Get-FleetNode -NodeId 't5500' -CustomMapPath $requestedMapPath
$t5500Ip = ([string]$t5500Node.ip).Trim()

$t5500LanPorts = New-Object 'System.Collections.Generic.HashSet[int]'
foreach ($svc in @(Get-FleetServices -FleetMap $map)) {
    $svcNode = ([string]$svc.node).Trim().ToLowerInvariant()
    $svcScope = ([string]$svc.scope).Trim().ToLowerInvariant()
    if (Test-FleetMachineLocalScope -Scope $svcScope) {
        continue
    }
    if ($svcNode -eq 't5500' -and $svcScope -in @('lan', 'lan-guarded')) {
        [void]$t5500LanPorts.Add([int]$svc.port)
    }
}

function Test-LocalInterfaceOwnsIp {
    param([Parameter(Mandatory = $true)][string]$TargetIp)
    try {
        $interfaces = [System.Net.NetworkInformation.NetworkInterface]::GetAllNetworkInterfaces()
        foreach ($nic in $interfaces) {
            if ($nic.OperationalStatus -ne [System.Net.NetworkInformation.OperationalStatus]::Up) {
                continue
            }
            foreach ($uni in $nic.GetIPProperties().UnicastAddresses) {
                if ($uni.Address.AddressFamily -eq [System.Net.Sockets.AddressFamily]::InterNetwork -and
                    $uni.Address.IPAddressToString -eq $TargetIp) {
                    return $true
                }
            }
        }
    } catch {
        return $false
    }
    return $false
}

function Test-TcpListener {
    param(
        [Parameter(Mandatory = $true)][string]$TargetHost,
        [Parameter(Mandatory = $true)][int]$Port,
        [int]$TimeoutMs = 800
    )
    $client = New-Object System.Net.Sockets.TcpClient
    try {
        $task = $client.ConnectAsync($TargetHost, $Port)
        if (-not $task.Wait($TimeoutMs)) {
            return $false
        }
        return [bool]$client.Connected
    } catch {
        return $false
    } finally {
        $client.Dispose()
    }
}

function Get-YamlKeyValue {
    param(
        [AllowEmptyString()][string]$Line,
        [Parameter(Mandatory = $true)][string]$ExpectedKey
    )
    $pattern = '^\s*(?:-\s*)?' + [regex]::Escape($ExpectedKey) + '\s*:\s*(.+?)\s*$'
    if ($Line -notmatch $pattern) {
        return $null
    }
    $val = $Matches[1].Trim()
    if ($val.StartsWith('"')) {
        if ($val -match '^"([^"]*)"') { return $Matches[1].Trim() }
    } elseif ($val.StartsWith("'")) {
        if ($val -match "^'([^']*)'") { return $Matches[1].Trim() }
    } else {
        $val = ($val -replace '\s+#.*$', '').Trim()
    }
    return $val
}

function Test-IsHostnameLine {
    param([AllowEmptyString()][string]$Line)
    return ($null -ne (Get-YamlKeyValue -Line $Line -ExpectedKey 'hostname'))
}

function Test-IsServiceLine {
    param([AllowEmptyString()][string]$Line)
    return ($null -ne (Get-YamlKeyValue -Line $Line -ExpectedKey 'service'))
}

if (-not (Test-Path -LiteralPath $requestedConfigPath)) {
    throw "Cloudflared config file not found at: $requestedConfigPath"
}

$onT5500 = Test-LocalInterfaceOwnsIp -TargetIp $t5500Ip
$shouldProbe = (-not $SkipProbe) -and ($ProbeLive -or $onT5500)
$probeReason = if ($SkipProbe) {
    'skipped (-SkipProbe)'
} elseif ($ProbeLive) {
    "enabled (-ProbeLive -> $t5500Ip)"
} elseif ($onT5500) {
    "enabled (local host owns $t5500Ip)"
} else {
    "skipped (not running on $t5500Ip; pass -ProbeLive to probe remotely)"
}

$utf8NoBom = New-Object System.Text.UTF8Encoding($false)
$raw = [System.IO.File]::ReadAllText((Resolve-Path -LiteralPath $requestedConfigPath).Path, $utf8NoBom)
$eol = if ($raw.Contains("`r`n")) { "`r`n" } else { "`n" }
$lines = $raw -split "\r?\n"

# Pass 1: locate stale dashboard.aidoesitall.website hostname + service lines within the same YAML list item.
$dropIndices = New-Object 'System.Collections.Generic.HashSet[int]'
for ($i = 0; $i -lt $lines.Count; $i++) {
    if ($dropIndices.Contains($i)) { continue }
    $line = $lines[$i]

    $hostVal = Get-YamlKeyValue -Line $line -ExpectedKey 'hostname'
    if ($null -ne $hostVal -and $hostVal.Equals($staleDashboardHost, [System.StringComparison]::OrdinalIgnoreCase)) {
        [void]$dropIndices.Add($i)
        if ($line -match '^\s*-\s*hostname\s*:') {
            for ($j = $i + 1; $j -lt $lines.Count; $j++) {
                if ($lines[$j] -match '^\s*-\s+' -or $lines[$j] -match '^[^\s#]') { break }
                if (Test-IsServiceLine -Line $lines[$j]) {
                    [void]$dropIndices.Add($j)
                    break
                }
            }
        } else {
            for ($j = $i - 1; $j -ge 0; $j--) {
                if (Test-IsServiceLine -Line $lines[$j]) {
                    [void]$dropIndices.Add($j)
                    break
                }
                if ($lines[$j] -match '^\s*-\s+' -or $lines[$j] -match '^[^\s#]') { break }
            }
        }
    }
}

# Pass 2: build updated line list while touching ONLY hostname and service lines.
$probeCache = @{}
$outputLines = New-Object System.Collections.Generic.List[string]
$diffEntries = New-Object System.Collections.Generic.List[pscustomobject]
$warnings = New-Object System.Collections.Generic.List[string]

for ($i = 0; $i -lt $lines.Count; $i++) {
    $origLine = $lines[$i]
    $lineNo = $i + 1

    if ($dropIndices.Contains($i)) {
        $diffEntries.Add([pscustomobject]@{
            LineNumber = $lineNo
            Action     = 'drop'
            Before     = $origLine
            After      = $null
        })
        continue
    }

    if (Test-IsServiceLine -Line $origLine) {
        if ($origLine -match '^(\s*(?:-\s*)?service\s*:\s*[^#]*?)(\s+#.*)?$') {
            $codePart = $Matches[1]
            $commentPart = if ($Matches[2]) { $Matches[2] } else { '' }
            if ($codePart -match '(?i)\b(localhost|127\.0\.0\.1):(\d+)\b') {
                $port = [int]$Matches[2]
                if ($t5500LanPorts.Contains($port)) {
                    $canRewrite = $true
                    if ($shouldProbe) {
                        if (-not $probeCache.ContainsKey($port)) {
                            $probeCache[$port] = Test-TcpListener -TargetHost $t5500Ip -Port $port
                        }
                        if (-not $probeCache[$port]) {
                            $canRewrite = $false
                            $warnings.Add("Line ${lineNo}: listener check failed on ${t5500Ip}:${port}; keeping existing service target.")
                        }
                    }

                    if ($canRewrite) {
                        $rewrittenCode = [regex]::Replace(
                            $codePart,
                            "(?i)\b(localhost|127\.0\.0\.1):$port\b",
                            "${t5500Ip}:${port}"
                        )
                        $newLine = $rewrittenCode + $commentPart
                        if ($newLine -cne $origLine) {
                            $diffEntries.Add([pscustomobject]@{
                                LineNumber = $lineNo
                                Action     = 'rewrite'
                                Before     = $origLine
                                After      = $newLine
                            })
                            $outputLines.Add($newLine)
                            continue
                        }
                    }
                } else {
                    $warnings.Add("Line ${lineNo}: port ${port} is not a LAN-scoped T5500 service in fleet-map.json; keeping existing target.")
                }
            }
        }
    }

    $outputLines.Add($origLine)
}

$sortedPorts = @($t5500LanPorts | Sort-Object) -join ', '
$modeLabel = if ($Apply) { 'APPLY (backup + write)' } else { 'DRY-RUN (diff-only; pass -Apply to write)' }

Write-Output "# ANTIGRAVITY T5500 Cloudflare Tunnel Targets (Stage A.7)"
Write-Output "# Mode: $modeLabel"
Write-Output "# ConfigPath: $requestedConfigPath"
Write-Output "# T5500 Host: $t5500Ip | LAN Ports: $sortedPorts"
Write-Output "# Listener Probe: $probeReason"

foreach ($w in $warnings) {
    Write-Output "# NOTE: $w"
}

if ($diffEntries.Count -eq 0) {
    Write-Output "# No changes required."
    exit 0
}

Write-Output "--- a/$requestedConfigPath"
Write-Output "+++ b/$requestedConfigPath"
foreach ($entry in $diffEntries) {
    Write-Output "@@ line $($entry.LineNumber) ($($entry.Action)) @@"
    Write-Output "-$($entry.Before)"
    if ($null -ne $entry.After) {
        Write-Output "+$($entry.After)"
    }
}

if ($Apply) {
    $resolvedFullPath = (Resolve-Path -LiteralPath $requestedConfigPath).Path
    $stamp = (Get-Date).ToUniversalTime().ToString('yyyyMMddTHHmmssZ')
    $backupPath = "${resolvedFullPath}.bak-${stamp}"
    [System.IO.File]::Copy($resolvedFullPath, $backupPath, $true)
    $updatedContent = [string]::Join($eol, $outputLines)
    [System.IO.File]::WriteAllText($resolvedFullPath, $updatedContent, $utf8NoBom)
    Write-Output "# Backup written: $backupPath"
    Write-Output "# Applied $($diffEntries.Count) line update(s) to: $resolvedFullPath"
}
