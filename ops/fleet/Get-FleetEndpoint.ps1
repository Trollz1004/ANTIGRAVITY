<#
.SYNOPSIS
Loads nodes, services, URLs, and bind hosts from ops/fleet/fleet-map.json.
Supports both keyed-object and array schemas for services, both 'this machine only'
and 'local-only' machine-local scopes, and both tokenEnv and authTokenEnv fields.
Can be dot-sourced for helper functions or invoked directly from CLI.
#>
param(
    [string]$Service = '',
    [string]$Node = '',
    [string]$Path = '',
    [ValidateSet('Url', 'Host', 'Ip', 'Port', 'Bind', 'Scope', 'TokenEnv', 'AuthTokenEnv', 'Json')]
    [string]$Field = 'Url',
    [string]$MapPath = ''
)

$script:DefaultFleetMapPath = Join-Path $PSScriptRoot 'fleet-map.json'

$script:FleetServiceAliases = @{
    'postgres'                = @('t5500-postgres')
    't5500-postgres'          = @('postgres')
    'redis'                   = @('t5500-redis')
    't5500-redis'             = @('redis')
    'dateapp-frontend'        = @('date-app-web')
    'date-app-web'            = @('dateapp-frontend')
    'dateapp-api'             = @('date-app-api')
    'date-app-api'            = @('dateapp-api')
    'hermes-gateway'          = @('hermes-api')
    'hermes-api'              = @('hermes-gateway')
    'hermes-dashboard'        = @('t5500-hermes-dashboard')
    't5500-hermes-dashboard'  = @('hermes-dashboard')
    'ollama-t5500'            = @('t5500-ollama')
    't5500-ollama'            = @('ollama-t5500')
    'obsidian-t5500'          = @('t5500-obsidian-rest')
    't5500-obsidian-rest'     = @('obsidian-t5500')
    'leadgen-desk'            = @('hermes-leadgen')
    'hermes-leadgen'          = @('leadgen-desk')
    'npc-lab'                 = @('live-npc-lab')
    'live-npc-lab'            = @('npc-lab')
    'ollama-alienware'        = @('alienware-ollama')
    'alienware-ollama'        = @('ollama-alienware')
    'obsidian-alienware'      = @('alienware-obsidian-rest', 'obsidian-rest')
    'alienware-obsidian-rest' = @('obsidian-alienware', 'obsidian-rest')
    'obsidian-rest'           = @('obsidian-alienware', 'alienware-obsidian-rest')
    'governance'              = @('official-vote', 'official-vote-service')
    'official-vote'           = @('governance', 'official-vote-service')
    'official-vote-service'   = @('governance', 'official-vote')
}

# ANTIGRAVITY repo-auxiliary services not tracked in canonical fleet-map.json.
# Used ONLY in Get-FleetService when absent from fleet-map.json; never injected into Get-FleetServices.
$script:RepoFallbackServices = @{
    'odysseus' = @{
        id         = 'odysseus'
        name       = 'Odysseus Workspace UI'
        node       = 't5500'
        port       = 7011
        protocol   = 'http'
        scope      = 'lan-guarded'
        bind       = '0.0.0.0'
        tokenEnv   = 'MISSION_OS_TOKEN'
        healthPath = '/'
    }
    'governance' = @{
        id         = 'governance'
        name       = 'Official Vote Service'
        node       = 't5500'
        port       = 9134
        protocol   = 'http'
        scope      = 'lan-guarded'
        bind       = '0.0.0.0'
        tokenEnv   = 'OFFICIAL_VOTE_TOKEN'
        healthPath = '/health'
    }
    'mission-mcp' = @{
        id         = 'mission-mcp'
        name       = 'Mission MCP'
        node       = 't5500'
        port       = 3901
        protocol   = 'http'
        scope      = 'lan-guarded'
        bind       = '0.0.0.0'
        tokenEnv   = 'MISSION_MCP_TOKEN'
        healthPath = '/health'
    }
    'onemin-shim' = @{
        id         = 'onemin-shim'
        name       = '1min.ai OpenAI Shim'
        node       = 't5500'
        port       = 20130
        protocol   = 'http'
        scope      = 'lan-guarded'
        bind       = '0.0.0.0'
        tokenEnv   = 'ONEMIN_SHIM_TOKEN'
        healthPath = '/health'
    }
}

function Test-FleetMachineLocalScope {
    param([AllowEmptyString()][string]$Scope = '')
    $s = ([string]$Scope).Trim().ToLowerInvariant()
    return ($s -in @('this machine only', 'local-only'))
}

function Get-FleetServiceTokenEnv {
    param([Parameter(Mandatory = $true)][object]$ServiceObj)
    if ($ServiceObj.PSObject.Properties['tokenEnv'] -and $null -ne $ServiceObj.tokenEnv -and ([string]$ServiceObj.tokenEnv).Trim()) {
        return ([string]$ServiceObj.tokenEnv).Trim()
    }
    if ($ServiceObj.PSObject.Properties['authTokenEnv'] -and $null -ne $ServiceObj.authTokenEnv -and ([string]$ServiceObj.authTokenEnv).Trim()) {
        return ([string]$ServiceObj.authTokenEnv).Trim()
    }
    return ''
}

function ConvertTo-NormalizedFleetNode {
    param(
        [Parameter(Mandatory = $true)][object]$NodeObj,
        [string]$FallbackId = ''
    )
    $ht = [ordered]@{}
    foreach ($p in $NodeObj.PSObject.Properties) {
        $ht[$p.Name] = $p.Value
    }
    $nid = if ($ht.Contains('id') -and $ht['id']) { ([string]$ht['id']).Trim() } else { $FallbackId.Trim() }
    $nip = if ($ht.Contains('ip') -and $ht['ip']) { ([string]$ht['ip']).Trim() } elseif ($ht.Contains('host') -and $ht['host']) { ([string]$ht['host']).Trim() } else { '' }
    $nhost = if ($ht.Contains('host') -and $ht['host']) { ([string]$ht['host']).Trim() } else { $nip }
    $ht['id'] = $nid
    $ht['ip'] = $nip
    $ht['host'] = $nhost
    return ([pscustomobject]$ht)
}

function ConvertTo-NormalizedFleetService {
    param(
        [Parameter(Mandatory = $true)][object]$ServiceObj,
        [string]$FallbackId = ''
    )
    $ht = [ordered]@{}
    foreach ($p in $ServiceObj.PSObject.Properties) {
        $ht[$p.Name] = $p.Value
    }
    $sid = if ($ht.Contains('id') -and $ht['id']) { ([string]$ht['id']).Trim() } else { $FallbackId.Trim() }
    $scope = if ($ht.Contains('scope') -and $null -ne $ht['scope']) { ([string]$ht['scope']).Trim() } else { '' }
    $isLocal = Test-FleetMachineLocalScope -Scope $scope
    $shost = if ($ht.Contains('host') -and $ht['host']) { ([string]$ht['host']).Trim() } elseif ($isLocal) { '127.0.0.1' } else { '' }
    $sbind = if ($isLocal) { '127.0.0.1' } elseif ($ht.Contains('bind') -and $ht['bind']) { ([string]$ht['bind']).Trim() } else { '0.0.0.0' }
    $tok = Get-FleetServiceTokenEnv -ServiceObj $ServiceObj
    $tokOrNull = if ($tok) { $tok } else { $null }

    $ht['id'] = $sid
    $ht['host'] = $shost
    $ht['bind'] = $sbind
    $ht['tokenEnv'] = $tokOrNull
    $ht['authTokenEnv'] = $tok
    return ([pscustomobject]$ht)
}

function Get-FleetMap {
    param([string]$CustomMapPath = '')
    $resolved = if ($CustomMapPath) { $CustomMapPath } else { $script:DefaultFleetMapPath }
    if (-not (Test-Path -LiteralPath $resolved)) {
        throw "Fleet map not found at $resolved"
    }
    $raw = Get-Content -LiteralPath $resolved -Raw -Encoding UTF8
    return ($raw | ConvertFrom-Json)
}

function Get-FleetNodes {
    param(
        [object]$FleetMap = $null,
        [string]$CustomMapPath = ''
    )
    $map = if ($null -ne $FleetMap) { $FleetMap } else { Get-FleetMap -CustomMapPath $CustomMapPath }
    if ($null -eq $map -or -not $map.PSObject.Properties['nodes'] -or $null -eq $map.nodes) {
        return @()
    }
    if ($map.nodes -is [System.Array]) {
        foreach ($item in $map.nodes) {
            if ($null -ne $item) {
                ConvertTo-NormalizedFleetNode -NodeObj $item
            }
        }
        return
    }
    foreach ($prop in $map.nodes.PSObject.Properties) {
        if ($null -ne $prop.Value) {
            ConvertTo-NormalizedFleetNode -NodeObj $prop.Value -FallbackId $prop.Name
        }
    }
}

function Get-FleetServices {
    param(
        [object]$FleetMap = $null,
        [string]$CustomMapPath = ''
    )
    $map = if ($null -ne $FleetMap) { $FleetMap } else { Get-FleetMap -CustomMapPath $CustomMapPath }
    if ($null -eq $map -or -not $map.PSObject.Properties['services'] -or $null -eq $map.services) {
        return @()
    }
    if ($map.services -is [System.Array]) {
        $idx = 0
        foreach ($item in $map.services) {
            if ($null -ne $item) {
                ConvertTo-NormalizedFleetService -ServiceObj $item -FallbackId "service-$idx"
            }
            $idx++
        }
        return
    }
    foreach ($prop in $map.services.PSObject.Properties) {
        if ($null -ne $prop.Value) {
            ConvertTo-NormalizedFleetService -ServiceObj $prop.Value -FallbackId $prop.Name
        }
    }
}

function Get-FleetNode {
    param(
        [Parameter(Mandatory = $true)][string]$NodeId,
        [string]$CustomMapPath = '',
        [object]$FleetMap = $null
    )
    $nodes = Get-FleetNodes -FleetMap $FleetMap -CustomMapPath $CustomMapPath
    $key = $NodeId.Trim().ToLowerInvariant()
    foreach ($n in $nodes) {
        if (([string]$n.id).Trim().ToLowerInvariant() -eq $key) {
            return $n
        }
    }
    throw "Unknown fleet node '$NodeId'"
}

function Resolve-FleetFallbackService {
    param(
        [Parameter(Mandatory = $true)][string]$Candidate,
        [Parameter(Mandatory = $true)][object]$FleetMap,
        [string]$CustomMapPath = ''
    )
    if (-not $script:RepoFallbackServices.ContainsKey($Candidate)) {
        return $null
    }
    $fb = $script:RepoFallbackServices[$Candidate]
    $isLocal = Test-FleetMachineLocalScope -Scope ([string]$fb['scope'])
    $resolvedHost = if ($isLocal) { '127.0.0.1' } else { [string](Get-FleetNode -NodeId ([string]$fb['node']) -FleetMap $FleetMap -CustomMapPath $CustomMapPath).ip }
    $copy = [ordered]@{}
    foreach ($k in $fb.Keys) {
        $copy[$k] = $fb[$k]
    }
    $copy['host'] = $resolvedHost
    return (ConvertTo-NormalizedFleetService -ServiceObj ([pscustomobject]$copy) -FallbackId ([string]$fb['id']))
}

function Get-FleetService {
    param(
        [Parameter(Mandatory = $true)][string]$ServiceId,
        [string]$CustomMapPath = ''
    )
    $map = Get-FleetMap -CustomMapPath $CustomMapPath
    $services = @(Get-FleetServices -FleetMap $map)
    $key = $ServiceId.Trim().ToLowerInvariant()
    $candidates = New-Object System.Collections.Generic.List[string]
    $candidates.Add($key)
    if ($script:FleetServiceAliases.ContainsKey($key)) {
        foreach ($alias in $script:FleetServiceAliases[$key]) {
            $candidates.Add($alias)
        }
    }
    foreach ($candidate in $candidates) {
        foreach ($svc in $services) {
            if (([string]$svc.id).Trim().ToLowerInvariant() -eq $candidate) {
                return $svc
            }
        }
    }
    foreach ($candidate in $candidates) {
        $fallback = Resolve-FleetFallbackService -Candidate $candidate -FleetMap $map -CustomMapPath $CustomMapPath
        if ($null -ne $fallback) {
            return $fallback
        }
    }
    throw "Unknown fleet service '$ServiceId'"
}

function Get-FleetServiceUrl {
    param(
        [Parameter(Mandatory = $true)][string]$ServiceId,
        [string]$PathSuffix = '',
        [string]$CustomMapPath = ''
    )
    $svc = Get-FleetService -ServiceId $ServiceId -CustomMapPath $CustomMapPath
    $protocol = if ($svc.PSObject.Properties['protocol'] -and $svc.protocol) { [string]$svc.protocol } else { 'http' }
    $scheme = if ($protocol -in @('http', 'https', 'ws', 'wss')) { $protocol } else { 'http' }
    $targetHost = if (Test-FleetMachineLocalScope -Scope ([string]$svc.scope)) { '127.0.0.1' } else { [string]$svc.host }
    $base = if ($svc.PSObject.Properties['url'] -and $svc.url) { [string]$svc.url } else { '{0}://{1}:{2}' -f $scheme, $targetHost, $svc.port }
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
    if (Test-FleetMachineLocalScope -Scope ([string]$svc.scope)) {
        return '127.0.0.1'
    }
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
            'Url'          { return (Get-FleetServiceUrl -ServiceId $ServiceId -PathSuffix $PathSuffix -CustomMapPath $CustomMapPath) }
            'Host'         { return [string]$s.host }
            'Ip'           { return [string]$s.host }
            'Port'         { return [int]$s.port }
            'Bind'         { return [string]$s.bind }
            'Scope'        { return [string]$s.scope }
            'TokenEnv'     { return (Get-FleetServiceTokenEnv -ServiceObj $s) }
            'AuthTokenEnv' { return (Get-FleetServiceTokenEnv -ServiceObj $s) }
            'Json'         { return ($s | ConvertTo-Json -Compress) }
        }
    }
    throw 'Specify -Service or -Node.'
}

if ($MyInvocation.InvocationName -ne '.') {
    if ($Service -or $Node) {
        Write-Output (Get-FleetEndpoint -ServiceId $Service -NodeId $Node -PathSuffix $Path -SelectField $Field -CustomMapPath $MapPath)
    }
}
