$repoRoot = Split-Path -Parent $PSScriptRoot
$installer = Join-Path $repoRoot "scripts\install-safe-node-automation-tasks.ps1"

if (-not (Test-Path $installer)) {
    throw "Missing installer: $installer"
}

pwsh -NoProfile -ExecutionPolicy Bypass -File $installer -NodeProfile 9020 -RepoRoot $repoRoot
