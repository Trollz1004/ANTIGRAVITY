[CmdletBinding()]
param(
    [string]$ModelId = "qwen2.5:7b",
    [string]$OllamaHost = "127.0.0.1:11434",
    [bool]$EnsureModel = $true,
    [bool]$RestartGateway = $true
)

$ErrorActionPreference = "Stop"

function Ensure-Map {
    param(
        [hashtable]$Map,
        [string]$Key,
        [object]$Default
    )

    if (-not $Map.ContainsKey($Key) -or $null -eq $Map[$Key]) {
        $Map[$Key] = $Default
    }

    return $Map[$Key]
}

function ConvertTo-Map {
    param([object]$Value)

    if ($null -eq $Value) {
        return $null
    }

    if ($Value -is [System.Collections.IDictionary]) {
        $map = @{}
        foreach ($key in $Value.Keys) {
            $map[$key] = ConvertTo-Map -Value $Value[$key]
        }
        return $map
    }

    if ($Value -is [System.Collections.IEnumerable] -and $Value -isnot [string]) {
        $items = @()
        foreach ($item in $Value) {
            $items += ,(ConvertTo-Map -Value $item)
        }
        return $items
    }

    if ($Value -is [pscustomobject] -or ($Value.PSObject -and $Value.PSObject.Properties.Count -gt 0 -and $Value -isnot [string])) {
        $map = @{}
        foreach ($prop in $Value.PSObject.Properties) {
            $map[$prop.Name] = ConvertTo-Map -Value $prop.Value
        }
        return $map
    }

    return $Value
}

function Wait-Ollama {
    param(
        [string]$HostPort,
        [int]$TimeoutSeconds = 30
    )

    $deadline = (Get-Date).AddSeconds($TimeoutSeconds)
    while ((Get-Date) -lt $deadline) {
        try {
            $null = Invoke-RestMethod -Uri ("http://{0}/api/tags" -f $HostPort) -TimeoutSec 3
            return $true
        } catch {
            Start-Sleep -Milliseconds 750
        }
    }

    return $false
}

function Get-ListenerLines {
    param([int]$Port)

    $lines = cmd /c ("netstat -ano | findstr {0}" -f $Port)
    if ($LASTEXITCODE -eq 0 -and $lines) {
        return @($lines -split "`r?`n" | Where-Object { $_.Trim() })
    }

    return @()
}

function Stop-PortListeners {
    param([int]$Port)

    $pids = Get-ListenerLines -Port $Port |
        ForEach-Object { ($_ -split "\s+")[-1] } |
        Where-Object { $_ -match "^\d+$" } |
        Select-Object -Unique

    foreach ($targetPid in $pids) {
        try {
            Stop-Process -Id ([int]$targetPid) -Force -ErrorAction Stop
        } catch {
        }
    }
}

function Stop-OllamaServices {
    $services = Get-CimInstance Win32_Service | Where-Object {
        $_.Name -like "*Ollama*" -or $_.DisplayName -like "*Ollama*"
    }

    foreach ($service in $services) {
        try {
            if ($service.State -eq "Running") {
                Stop-Service -Name $service.Name -Force -ErrorAction Stop
            }
        } catch {
        }

        try {
            Set-Service -Name $service.Name -StartupType Manual -ErrorAction Stop
        } catch {
        }
    }
}

function Wait-PortClear {
    param(
        [int]$Port,
        [int]$TimeoutSeconds = 15
    )

    $deadline = (Get-Date).AddSeconds($TimeoutSeconds)
    while ((Get-Date) -lt $deadline) {
        if ((Get-ListenerLines -Port $Port).Count -eq 0) {
            return $true
        }

        Start-Sleep -Milliseconds 500
    }

    return ((Get-ListenerLines -Port $Port).Count -eq 0)
}

function Get-OllamaProcessIds {
    $candidates = Get-Process -ErrorAction SilentlyContinue | Where-Object {
        $_.Path -and $_.Path -like "*\Programs\Ollama\*"
    }

    return @($candidates | Select-Object -ExpandProperty Id -Unique)
}

function Stop-OllamaProcesses {
    foreach ($targetPid in (Get-OllamaProcessIds)) {
        try {
            Stop-Process -Id $targetPid -Force -ErrorAction Stop
        } catch {
        }
    }
}

function Start-OllamaServe {
    param(
        [string]$ExePath,
        [string]$HostPort
    )

    $quotedExe = '"' + $ExePath + '"'
    $command = "set OLLAMA_HOST=$HostPort && $quotedExe serve"
    Start-Process cmd.exe -WindowStyle Hidden -ArgumentList "/d", "/c", $command | Out-Null
}

function Get-ListeningEndpoints {
    param([int]$Port)

    return @(Get-ListenerLines -Port $Port | Where-Object { $_ -match "LISTENING" })
}

function Test-LoopbackOnly {
    param([int]$Port)

    $listeners = Get-ListeningEndpoints -Port $Port
    if ($listeners.Count -eq 0) {
        return $false
    }

    foreach ($listener in $listeners) {
        if ($listener -match "0\.0\.0\.0:$Port" -or $listener -match "\[::\]:$Port") {
            return $false
        }
    }

    return $true
}

function Ensure-OllamaLoopback {
    param(
        [string]$ExePath,
        [string]$HostPort
    )

    $port = [int]($HostPort.Split(":")[-1])

    for ($attempt = 1; $attempt -le 2; $attempt++) {
        Stop-OllamaServices
        Stop-OllamaProcesses
        Stop-PortListeners -Port $port
        $null = Wait-PortClear -Port $port -TimeoutSeconds 20
        Start-Sleep -Seconds 1
        Start-OllamaServe -ExePath $ExePath -HostPort $HostPort

        if (-not (Wait-Ollama -HostPort $HostPort -TimeoutSeconds 30)) {
            continue
        }

        Start-Sleep -Seconds 2
        if (Test-LoopbackOnly -Port $port) {
            return
        }
    }

    throw "Ollama is not loopback-only on $HostPort"
}

function Update-OpenClawJson {
    param(
        [string]$Path,
        [string]$ModelRef,
        [hashtable]$ProviderDef
    )

    if (-not (Test-Path $Path)) {
        return
    }

    $json = ConvertTo-Map -Value (Get-Content $Path -Raw | ConvertFrom-Json)

    $models = Ensure-Map -Map $json -Key "models" -Default @{}
    $models["mode"] = "merge"
    $providers = Ensure-Map -Map $models -Key "providers" -Default @{}
    $providers["ollama"] = $ProviderDef

    $agents = Ensure-Map -Map $json -Key "agents" -Default @{}
    $defaults = Ensure-Map -Map $agents -Key "defaults" -Default @{}
    $defaultModel = Ensure-Map -Map $defaults -Key "model" -Default @{}
    $defaultModel["primary"] = $ModelRef

    $subagents = Ensure-Map -Map $defaults -Key "subagents" -Default @{}
    $subagentModel = Ensure-Map -Map $subagents -Key "model" -Default @{}
    $subagentModel["primary"] = $ModelRef

    $aliases = Ensure-Map -Map $defaults -Key "models" -Default @{}
    $aliases[$ModelRef] = @{ alias = "Local qwen2.5:7b" }

    if ($agents.ContainsKey("list") -and $agents["list"]) {
        foreach ($agent in $agents["list"]) {
            if ($agent -isnot [hashtable]) {
                continue
            }

            $agentModel = Ensure-Map -Map $agent -Key "model" -Default @{}
            $agentModel["primary"] = $ModelRef
        }
    }

    ($json | ConvertTo-Json -Depth 100) | Set-Content $Path -Encoding UTF8
}

function Update-ModelsJson {
    param(
        [string]$Path,
        [hashtable]$ProviderDef
    )

    if (-not (Test-Path $Path)) {
        return
    }

    $json = ConvertTo-Map -Value (Get-Content $Path -Raw | ConvertFrom-Json)
    $providers = Ensure-Map -Map $json -Key "providers" -Default @{}
    $providers["ollama"] = $ProviderDef
    ($json | ConvertTo-Json -Depth 100) | Set-Content $Path -Encoding UTF8
}

$modelRef = "ollama/$ModelId"
$providerDef = @{
    baseUrl = "http://$OllamaHost/v1"
    apiKey = "ollama-local"
    api = "openai-completions"
    models = @(
        @{
            id = $ModelId
            name = $ModelId
            reasoning = $false
            input = @("text")
            cost = @{
                input = 0
                output = 0
                cacheRead = 0
                cacheWrite = 0
            }
            contextWindow = 128000
            maxTokens = 8192
        }
    )
}

[System.Environment]::SetEnvironmentVariable("OLLAMA_HOST", $OllamaHost, "User")
$env:OLLAMA_HOST = $OllamaHost

$ollamaExe = Join-Path $env:LOCALAPPDATA "Programs\Ollama\ollama.exe"
if (-not (Test-Path $ollamaExe)) {
    throw "Ollama executable not found at $ollamaExe"
}

Ensure-OllamaLoopback -ExePath $ollamaExe -HostPort $OllamaHost

if ($EnsureModel) {
    $modelList = & $ollamaExe list | Out-String
    if ($modelList -notmatch ("(?m)^{0}\s" -f [regex]::Escape($ModelId))) {
        & $ollamaExe pull $ModelId
        $modelList = & $ollamaExe list | Out-String
        if ($modelList -notmatch ("(?m)^{0}\s" -f [regex]::Escape($ModelId))) {
            throw "Ollama model $ModelId is still missing after pull"
        }
    }
}

$openclawRoot = Join-Path $env:USERPROFILE ".openclaw"
$jsonTool = Join-Path $PSScriptRoot "normalize-openclaw-ollama-json.js"
& node $jsonTool (Join-Path $openclawRoot "openclaw.json") openclaw $modelRef $ModelId $OllamaHost
Get-ChildItem (Join-Path $openclawRoot "agents") -Recurse -Filter "models.json" -File -ErrorAction SilentlyContinue |
    ForEach-Object { & node $jsonTool $_.FullName models $modelRef $ModelId $OllamaHost }

if ($RestartGateway) {
    Stop-PortListeners -Port 18789
    Start-Sleep -Seconds 1
    Start-Process powershell -WindowStyle Hidden -ArgumentList "-NoProfile", "-Command", "openclaw gateway --port 18789" | Out-Null
    Start-Sleep -Seconds 4
}

$ollamaListeners = Get-ListenerLines -Port 11434
$gatewayListeners = Get-ListenerLines -Port 18789
$defaultModel = & openclaw config get agents.defaults.model.primary

Write-Output ("HOSTNAME: {0}" -f $env:COMPUTERNAME)
Write-Output ("OLLAMA_HOST: {0}" -f $OllamaHost)
if ($ollamaListeners.Count -gt 0) {
    Write-Output "OLLAMA_LISTENER:"
    $ollamaListeners | ForEach-Object { Write-Output $_ }
} else {
    Write-Output "OLLAMA_LISTENER: NONE"
}
Write-Output ("OPENCLAW_DEFAULT: {0}" -f ($defaultModel | Out-String).Trim())
if ($gatewayListeners.Count -gt 0) {
    Write-Output "GATEWAY_LISTENER:"
    $gatewayListeners | ForEach-Object { Write-Output $_ }
} else {
    Write-Output "GATEWAY_LISTENER: NONE"
}
