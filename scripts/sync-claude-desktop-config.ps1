# sync-claude-desktop-config.ps1
# Merges the canonical mcpServers block from the repo into %APPDATA%\Claude\claude_desktop_config.json
# on whichever node runs this. Preserves the per-node `preferences` block.
#
# Run on each node after `git pull`:
#   pwsh c:\antigravity\scripts\sync-claude-desktop-config.ps1
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

if (-not (Test-Path $canonicalPath)) {
    throw "Canonical config not found at $canonicalPath. Run 'git pull' first."
}

# Locate Claude Desktop's live config — supports BOTH install modes:
#   1) Standard installer:        %APPDATA%\Claude\claude_desktop_config.json
#   2) Microsoft Store package:   %LOCALAPPDATA%\Packages\Claude_<pfn-hash>\LocalCache\Roaming\Claude\claude_desktop_config.json
# Prefer whichever has an existing config; fall back to the standard dir if neither exists yet.
$standardDir = Join-Path $env:APPDATA 'Claude'
$standardPath = Join-Path $standardDir 'claude_desktop_config.json'

$storePackagesRoot = Join-Path $env:LOCALAPPDATA 'Packages'
$storePackageDir = $null
if (Test-Path $storePackagesRoot) {
    $storePackageDir = Get-ChildItem -Path $storePackagesRoot -Filter 'Claude_*' -Directory -ErrorAction SilentlyContinue |
        Select-Object -First 1 -ExpandProperty FullName
}
$storeDir = if ($storePackageDir) { Join-Path $storePackageDir 'LocalCache\Roaming\Claude' } else { $null }
$storePath = if ($storeDir) { Join-Path $storeDir 'claude_desktop_config.json' } else { $null }

if ($storePath -and (Test-Path $storePath)) {
    $liveDir = $storeDir
    $livePath = $storePath
    Write-Host "[detect] Microsoft Store install: $liveDir" -ForegroundColor DarkGray
} elseif (Test-Path $standardPath) {
    $liveDir = $standardDir
    $livePath = $standardPath
    Write-Host "[detect] Standard install: $liveDir" -ForegroundColor DarkGray
} elseif (Test-Path $standardDir) {
    # Standard dir exists but no config yet — create one there
    $liveDir = $standardDir
    $livePath = $standardPath
    Write-Host "[detect] Standard install (empty config): $liveDir" -ForegroundColor DarkGray
} elseif ($storeDir -and (Test-Path $storeDir)) {
    # Store dir exists but no config yet
    $liveDir = $storeDir
    $livePath = $storePath
    Write-Host "[detect] Microsoft Store install (empty config): $liveDir" -ForegroundColor DarkGray
} else {
    throw "Claude Desktop config dir not found. Looked in:`n  - $standardDir`n  - $storeDir`nIs Claude Desktop installed on this node?"
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
