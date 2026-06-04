[CmdletBinding()]
param()

$ErrorActionPreference = "Stop"

function Get-AllowedAgentIds {
    $configPath = Join-Path $env:USERPROFILE ".openclaw\openclaw.json"
    if (-not (Test-Path $configPath)) {
        return @()
    }

    $json = Get-Content $configPath -Raw | ConvertFrom-Json
    if (-not $json.agents -or -not $json.agents.list) {
        return @()
    }

    $list = $json.agents.list
    if ($list -isnot [System.Collections.IEnumerable] -or $list -is [string]) {
        $list = @($list)
    }

    return @($list | ForEach-Object { $_.id } | Where-Object { $_ })
}

function Remove-PathIfExists {
    param([string]$Path)

    if (Test-Path $Path) {
        Remove-Item $Path -Recurse -Force
        Write-Output ("REMOVED: {0}" -f $Path)
    }
}

$allowedAgentIds = Get-AllowedAgentIds
$agentsRoot = Join-Path $env:USERPROFILE ".openclaw\agents"

if (Test-Path $agentsRoot) {
    Get-ChildItem $agentsRoot -Directory | ForEach-Object {
        if ($allowedAgentIds -notcontains $_.Name) {
            Remove-Item $_.FullName -Recurse -Force
            Write-Output ("REMOVED_AGENT_STORE: {0}" -f $_.FullName)
        }
    }
}

$legacyRoots = @(
    "E:\.openclaw",
    "E:\openclaw",
    "E:\OpenClaw",
    "E:\Users\joshl\.openclaw",
    (Join-Path $env:USERPROFILE "Normalize-OpenClaw-Ollama.ps1"),
    (Join-Path $env:USERPROFILE "normalize-openclaw-ollama-json.js"),
    (Join-Path $env:USERPROFILE "Cleanup-OpenClaw-Legacy.ps1"),
    (Join-Path $env:USERPROFILE "Reset-OpenClaw-SessionStores.ps1")
)

foreach ($path in $legacyRoots) {
    Remove-PathIfExists -Path $path
}
