# sync-claude-desktop-config.ps1
# Merges the canonical mcpServers block from the repo into %APPDATA%\Claude\claude_desktop_config.json
# on whichever node runs this. Preserves the per-node `preferences` block.
#
# Run on each node after `git pull`:
#   pwsh C:\ANTIGRAVITY\scripts\sync-claude-desktop-config.ps1
#
# Single source of truth: infra/claude-desktop/claude_desktop_config.json
# Per-node preferences: stay in %APPDATA%\Claude\claude_desktop_config.json untouched.

[CmdletBinding()]
param(
    [switch]$DryRun
)

$ErrorActionPreference = 'Stop'

$repoRoot = Split-Path -Parent $PSScriptRoot
$canonicalPath = Join-Path $repoRoot 'infra\claude-desktop\claude_desktop_config.json'
$liveDir = Join-Path $env:APPDATA 'Claude'
$livePath = Join-Path $liveDir 'claude_desktop_config.json'

if (-not (Test-Path $canonicalPath)) {
    throw "Canonical config not found at $canonicalPath. Run 'git pull' first."
}

if (-not (Test-Path $liveDir)) {
    throw "Claude Desktop config dir not found at $liveDir. Is Claude Desktop installed on this node?"
}

# Load canonical (source of truth for mcpServers)
$canonical = Get-Content $canonicalPath -Raw | ConvertFrom-Json

# Load live (source of truth for per-node preferences), or start fresh
if (Test-Path $livePath) {
    $live = Get-Content $livePath -Raw | ConvertFrom-Json
    $timestamp = Get-Date -Format 'yyyy-MM-ddTHHmmZ'
    $backupPath = Join-Path $liveDir "claude_desktop_config.backup-$timestamp.json"
    if (-not $DryRun) {
        Copy-Item $livePath $backupPath -Force
        Write-Host "[backup] $backupPath" -ForegroundColor DarkGray
    }
} else {
    $live = [pscustomobject]@{}
}

# Replace mcpServers (drop any underscore-prefixed metadata keys from canonical)
$merged = [ordered]@{}
$merged['mcpServers'] = $canonical.mcpServers

# Preserve preferences if present on this node
if ($live.PSObject.Properties.Name -contains 'preferences') {
    $merged['preferences'] = $live.preferences
}

# Preserve any other top-level keys this node had that aren't canonical and aren't mcpServers
foreach ($prop in $live.PSObject.Properties) {
    if ($prop.Name -in @('mcpServers', 'preferences')) { continue }
    if ($prop.Name.StartsWith('_')) { continue }
    $merged[$prop.Name] = $prop.Value
}

$json = ($merged | ConvertTo-Json -Depth 100)

if ($DryRun) {
    Write-Host "[dry-run] Would write to $livePath" -ForegroundColor Yellow
    Write-Host $json
    return
}

Set-Content -Path $livePath -Value $json -Encoding UTF8
$mcpCount = @($canonical.mcpServers.PSObject.Properties).Count
Write-Host "[ok] Synced $mcpCount MCP servers -> $livePath" -ForegroundColor Green
Write-Host "[next] Restart Claude Desktop for changes to take effect." -ForegroundColor Cyan
