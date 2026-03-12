[CmdletBinding()]
param(
    [string]$RepoRoot,
    [switch]$SkipCloudflare,
    [switch]$SkipPublicCopyAudit,
    [switch]$NoSms
)

$ErrorActionPreference = "Stop"

if (-not $RepoRoot) {
    $RepoRoot = Split-Path -Parent $PSScriptRoot
}

function Resolve-PythonCommand {
    if (Get-Command uv -ErrorAction SilentlyContinue) {
        return @("uv", "run", "python")
    }

    if (Get-Command python -ErrorAction SilentlyContinue) {
        $pythonCommand = Get-Command python -ErrorAction SilentlyContinue
        if ($pythonCommand.Source -and $pythonCommand.Source -notlike "*WindowsApps*") {
            return @($pythonCommand.Source)
        }
    }

    if (Get-Command py -ErrorAction SilentlyContinue) {
        return @("py", "-3")
    }

    throw "Python 3 was not found in PATH."
}

$watcherScript = Join-Path $RepoRoot "scripts\codex-fleet-watcher.py"
if (-not (Test-Path -LiteralPath $watcherScript)) {
    throw "Missing watcher script: $watcherScript"
}

$arguments = @()
if ($SkipCloudflare) {
    $arguments += "--skip-cloudflare"
}
if ($SkipPublicCopyAudit) {
    $arguments += "--skip-public-copy-audit"
}
if ($NoSms) {
    $arguments += "--no-sms"
}

$python = @(Resolve-PythonCommand)
if ($python.Length -gt 1) {
    & $python[0] $python[1..($python.Length - 1)] $watcherScript @arguments
} else {
    & $python[0] $watcherScript @arguments
}

exit $LASTEXITCODE
