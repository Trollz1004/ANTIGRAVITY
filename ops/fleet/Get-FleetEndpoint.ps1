<#
.SYNOPSIS
Loads nodes, services, URLs, and bind hosts from ops/fleet/fleet-map.json.
Can be dot-sourced for helper functions or invoked directly from CLI.
#>
param(
    [string]$Service = '',
    [string]$Node = '',
    [string]$Path = '',
    [ValidateSet('Url', 'Host', 'Ip', 'Port', 'Bind', 'Scope', 'TokenEnv', 'Json')]
    [string]$Field = 'Url',
    [string]$MapPath = ''
)

$script:DefaultFleetMapPath = Join-Path $PSScriptRoot 'fleet-map.json'

function Get-FleetMap {
    param([string]$CustomMapPath = '')
    $resolved = if ($CustomMapPath) { $CustomMapPath } else { $script:DefaultFleetMapPath }
    if (-not (Test-Path -LiteralPath $resolved)) {
        throw "Fleet map not found at $resolved"
    }
    $raw = Get-Content -LiteralPath $resolved -Raw -Encoding UTF8
    return ($raw | ConvertFrom-Json)
}

function Get-FleetNode {
    param(
        [Parameter(Mandatory = $true)][string]$NodeId,
        [string]$CustomMapPath = ''
    )
    $map = Get-FleetMap -CustomMapPath $CustomMapPath
    $key = $NodeId.Trim().ToLowerInvariant()
    $prop = $map.nodes.PSObject.Properties[$key]
    if (-not $prop) {
        throw "Unknown fleet node '$NodeId'"
    }
    return $prop.Value
}

function Get-FleetService {
    param(
        [Parameter(Mandatory = $true)][string]$ServiceId,
        [string]$CustomMapPath = ''
    )
    $map = Get-FleetMap -CustomMapPath $CustomMapPath
    $key = $ServiceId.Trim().ToLowerInvariant()
    $prop = $map.services.PSObject.Properties[$key]
    if (-not $prop) {
        throw "Unknown fleet service '$ServiceId'"
    }
    return $prop.Value
}

function Get-FleetServiceUrl {
    param(
        [Parameter(Mandatory = $true)][string]$ServiceId,
        [string]$PathSuffix = '',
        [string]$CustomMapPath = ''
    )
    $svc = Get-FleetService -ServiceId $ServiceId -CustomMapPath $CustomMapPath
    $scheme = if ($svc.protocol -in @('http', 'https', 'ws', 'wss')) { $svc.protocol } else { 'http' }
    $base = if ($svc.PSObject.Properties['url'] -and $svc.url) { [string]$svc.url } else { '{0}://{1}:{2}' -f $scheme, $svc.host, $svc.port }
    $base = $base.TrimEnd('/')
    if (-not $PathSuffix) { return $base }
    $norm = if ($PathSuffix.StartsWith('/')) { $PathSuffix } else { '/' + $PathSuffix }
    return ($base + $norm)
}

function Get-FleetBindHost {
    param(
        [Parameter(Mandatory = $true)][string]$ServiceId,
        [string]$EnvOverride = '',
        [string]$CustomMapPath = ''
    )
    if ($EnvOverride -and $EnvOverride.Trim()) {
        return $EnvOverride.Trim()
    }
    $svc = Get-FleetService -ServiceId $ServiceId -CustomMapPath $CustomMapPath
    return [string]$svc.bind
}

function Get-FleetEndpoint {
    param(
        [string]$ServiceId = '',
        [string]$NodeId = '',
        [string]$PathSuffix = '',
        [string]$SelectField = 'Url',
        [string]$CustomMapPath = ''
    )
    if ($NodeId) {
        $n = Get-FleetNode -NodeId $NodeId -CustomMapPath $CustomMapPath
        switch ($SelectField) {
            'Ip'   { return [string]$n.ip }
            'Host' { return [string]$n.host }
            'Json' { return ($n | ConvertTo-Json -Compress) }
            default { return [string]$n.ip }
        }
    }
    if ($ServiceId) {
        $s = Get-FleetService -ServiceId $ServiceId -CustomMapPath $CustomMapPath
        switch ($SelectField) {
            'Url'      { return (Get-FleetServiceUrl -ServiceId $ServiceId -PathSuffix $PathSuffix -CustomMapPath $CustomMapPath) }
            'Host'     { return [string]$s.host }
            'Ip'       { return [string]$s.host }
            'Port'     { return [int]$s.port }
            'Bind'     { return [string]$s.bind }
            'Scope'    { return [string]$s.scope }
            'TokenEnv' { return [string]$s.tokenEnv }
            'Json'     { return ($s | ConvertTo-Json -Compress) }
        }
    }
    throw 'Specify -Service or -Node.'
}

if ($MyInvocation.InvocationName -ne '.') {
    if ($Service -or $Node) {
        Write-Output (Get-FleetEndpoint -ServiceId $Service -NodeId $Node -PathSuffix $Path -SelectField $Field -CustomMapPath $MapPath)
    }
}
