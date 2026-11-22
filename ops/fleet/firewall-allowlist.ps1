<#
.SYNOPSIS
Generates (or applies when -Apply is explicitly passed) Windows Defender Firewall
inbound allowlist rules from ops/fleet/fleet-map.json for LAN and LAN-guarded fleet ports.

.DESCRIPTION
Print-by-default safety script (FINALIZE Stage A):
- Reads active fleet node IPs (t5500 192.168.0.15, alienware 192.168.0.40) and
  service definitions from ops/fleet/fleet-map.json via Get-FleetEndpoint.ps1.
- Emits inbound TCP allow rules restricted strictly to fleet node RemoteAddress IPs
  for services with scope 'lan' or 'lan-guarded'.
- Explicitly skips 'local-only' services (PostgreSQL 5432, Redis 6379).
- Does NOT modify system firewall state unless -Apply is passed.
#>
[CmdletBinding()]
param(
    [switch]$Apply,
    [ValidateSet('all', 't5500', 'alienware')]
    [string]$Node = 'all',
    [string]$MapPath = ''
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$requestedNode = $Node
$requestedMapPath = $MapPath

. (Join-Path $PSScriptRoot 'Get-FleetEndpoint.ps1')

$map = Get-FleetMap -CustomMapPath $requestedMapPath

$activeNodeIds = @('t5500', 'alienware')
$nodesList = @(Get-FleetNodes -FleetMap $map)
if ($nodesList.Count -eq 0) {
    throw 'ops/fleet/fleet-map.json defines no nodes.'
}

$allowedIps = New-Object System.Collections.Generic.List[string]
$nodeSummary = New-Object System.Collections.Generic.List[string]

foreach ($n in $nodesList) {
    $nid = ([string]$n.id).Trim().ToLowerInvariant()
    $nip = ([string]$n.ip).Trim()
    if ($nid -notin $activeNodeIds) {
        throw "Refusing unexpected or retired node '$nid' ($nip) in fleet-map.json."
    }
    if (-not ($nip -match '^\d{1,3}(\.\d{1,3}){3}$')) {
        throw "Invalid IPv4 address '$nip' on node '$nid'."
    }
    if (-not $allowedIps.Contains($nip)) {
        $allowedIps.Add($nip)
    }
    $nodeSummary.Add("$nid=$nip")
}

$remoteAddressArray = @($allowedIps | Sort-Object)
$remoteAddressLiteral = ($remoteAddressArray -join ',')
$ruleGroup = 'ANTIGRAVITY-Fleet'

$targetNodes = if ($requestedNode -eq 'all') { $activeNodeIds } else { @($requestedNode.ToLowerInvariant()) }

$skippedLocal = New-Object System.Collections.Generic.List[string]
$plannedRules = New-Object System.Collections.Generic.List[pscustomobject]

foreach ($svc in @(Get-FleetServices -FleetMap $map)) {
    $svcNode = ([string]$svc.node).Trim().ToLowerInvariant()
    if ($svcNode -notin $targetNodes) {
        continue
    }

    $scope = ([string]$svc.scope).Trim().ToLowerInvariant()
    $port = [int]$svc.port
    $svcId = ([string]$svc.id).Trim()
    $svcName = ([string]$svc.name).Trim()

    if (Test-FleetMachineLocalScope -Scope $scope) {
        $skippedLocal.Add("$svcId ($svcNode TCP $port)")
        continue
    }

    if ($scope -notin @('lan', 'lan-guarded')) {
        throw "Unsupported scope '$scope' on service '$svcId'."
    }

    $ruleName = "ANTIGRAVITY-Fleet-$svcNode-$svcId-TCP-$port"
    $tokEnv = Get-FleetServiceTokenEnv -ServiceObj $svc
    $tokenSuffix = if ($tokEnv) { ", token=$tokEnv" } else { '' }
    $displayName = "ANTIGRAVITY Fleet [$svcNode] $svcName (TCP $port, $scope$tokenSuffix)"

    $cmdText = @(
        'New-NetFirewallRule'
        "-Name '$ruleName'"
        "-DisplayName '$displayName'"
        "-Group '$ruleGroup'"
        '-Direction Inbound'
        '-Action Allow'
        '-Protocol TCP'
        "-LocalPort $port"
        "-RemoteAddress $remoteAddressLiteral"
        '-Profile Private'
        '-Enabled True'
    ) -join ' '

    $plannedRules.Add([pscustomobject]@{
        Node        = $svcNode
        ServiceId   = $svcId
        Port        = $port
        Scope       = $scope
        RuleName    = $ruleName
        DisplayName = $displayName
        Command     = $cmdText
    })
}

$modeBanner = if ($Apply) { 'APPLY (live Windows Defender Firewall update)' } else { 'DRY-RUN (print-only; pass -Apply to enact)' }
Write-Output "# ANTIGRAVITY Fleet Firewall Allowlist"
Write-Output "# Mode: $modeBanner"
Write-Output "# Nodes: $($nodeSummary -join ', ')"
Write-Output "# RemoteAddress allowlist: $remoteAddressLiteral"
if ($skippedLocal.Count -gt 0) {
    Write-Output "# Skipped local-only services (never exposed to LAN): $($skippedLocal -join ', ')"
}
Write-Output ""

foreach ($targetNode in $targetNodes) {
    $nodeRules = @($plannedRules | Where-Object { $_.Node -eq $targetNode } | Sort-Object Port, ServiceId)
    if ($nodeRules.Count -eq 0) { continue }

    $nodeObj = Get-FleetNode -NodeId $targetNode -CustomMapPath $requestedMapPath
    Write-Output "# --- Node: $targetNode ($($nodeObj.ip)) [$($nodeRules.Count) inbound TCP rules] ---"
    foreach ($rule in $nodeRules) {
        if (-not $Apply) {
            Write-Output $rule.Command
        } else {
            $existing = Get-NetFirewallRule -Name $rule.RuleName -ErrorAction SilentlyContinue
            if ($existing) {
                Remove-NetFirewallRule -Name $rule.RuleName -ErrorAction Stop
            }
            New-NetFirewallRule `
                -Name $rule.RuleName `
                -DisplayName $rule.DisplayName `
                -Group $ruleGroup `
                -Direction Inbound `
                -Action Allow `
                -Protocol TCP `
                -LocalPort $rule.Port `
                -RemoteAddress $remoteAddressArray `
                -Profile Private `
                -Enabled True | Out-Null
            Write-Output "APPLIED: $($rule.RuleName) (TCP $($rule.Port) <- $remoteAddressLiteral)"
        }
    }
    Write-Output ""
}
