<#
.SYNOPSIS
    Register a compute node + its Hermes endpoint into the Mission Control dashboard.
    SECRET-FREE: stores only name / address / port / role — never credentials.

.DESCRIPTION
    Upserts a node into apps/mission-control/nodes.json. The cockpit's "Hermes Fleet"
    panel reads that file, so the node + a link to its Hermes (/healthz) appears on the
    dashboard. Use this to bring idle nodes online as compute demand grows.

.EXAMPLE
    .\scripts\add-node.ps1 -Name RIG07 -Address 192.168.0.42
    .\scripts\add-node.ps1 -Name MINI-ASUS -Address 192.168.0.30 -HermesPort 11435 -Role "marketing render"
#>
param(
    [Parameter(Mandatory = $true)][string]$Name,
    [Parameter(Mandatory = $true)][string]$Address,
    [int]$HermesPort = 11435,
    [string]$Role = "compute node",
    [string]$Drive = "C:"
)
$ErrorActionPreference = 'Stop'

$reg = Join-Path $PSScriptRoot '..\apps\mission-control\nodes.json'
if (-not (Test-Path $reg)) {
    '{ "_comment": "node + Hermes registry (secret-free)", "nodes": [] }' | Set-Content -Path $reg -Encoding utf8
}

$data = Get-Content $reg -Raw | ConvertFrom-Json
if (-not $data.PSObject.Properties.Name -contains 'nodes' -or $null -eq $data.nodes) {
    $data | Add-Member -NotePropertyName nodes -NotePropertyValue @() -Force
}

$node = [pscustomobject]@{
    name = $Name; address = $Address; hermesPort = $HermesPort; role = $Role; drive = $Drive
}
$others = @($data.nodes | Where-Object { $_.name -ne $Name })
$verb = if (@($data.nodes | Where-Object { $_.name -eq $Name }).Count) { 'Updated' } else { 'Added' }
$data.nodes = @($others + $node)
$data | Add-Member -NotePropertyName updated -NotePropertyValue (Get-Date -Format 'yyyy-MM-dd') -Force

$data | ConvertTo-Json -Depth 6 | Set-Content -Path $reg -Encoding utf8

Write-Host "$verb node '$Name' -> $Address`:$HermesPort ($Role)"
Write-Host "Hermes health: http://$Address`:$HermesPort/healthz"
Write-Host "Now visible on the Mission Control cockpit 'Hermes Fleet' panel."
Write-Host "Confirm Hermes is actually reachable on that node before relying on it for compute."
