[CmdletBinding()]
param(
    [ValidateSet("9020-content", "t5500-audit", "t5500-revenue-pack", "sabretooth-control")]
    [string]$Profile = "9020-content",
    [string]$RepoRoot
)

$ErrorActionPreference = "Stop"

if (-not $RepoRoot) {
    $RepoRoot = Split-Path -Parent $PSScriptRoot
}

$stateDir = Join-Path $RepoRoot "CodeX\state\marketing"
New-Item -ItemType Directory -Force -Path $stateDir | Out-Null

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

function Invoke-PythonScript {
    param(
        [string]$ScriptPath,
        [string[]]$Arguments = @()
    )

    $python = Resolve-PythonCommand
    if ($python.Length -gt 1) {
        & $python[0] $python[1..($python.Length - 1)] $ScriptPath @Arguments
    } else {
        & $python[0] $ScriptPath @Arguments
    }
    if ($LASTEXITCODE -ne 0) {
        throw "Python script failed: $ScriptPath"
    }
}

function Invoke-NodeScript {
    param(
        [string]$ScriptPath,
        [string[]]$Arguments = @()
    )

    if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
        throw "Node.js was not found in PATH."
    }

    & node $ScriptPath @Arguments
    if ($LASTEXITCODE -ne 0) {
        throw "Node script failed: $ScriptPath"
    }
}

$draftScript = Join-Path $RepoRoot "scripts\generate-safe-marketing-drafts.py"
$auditScript = Join-Path $RepoRoot "scripts\ewaste-intake-live-ok-audit.js"
$localWorker = Join-Path $RepoRoot "scripts\Run-OnlineRecycle-LocalWorker.ps1"

switch ($Profile) {
    "9020-content" {
        Invoke-PythonScript -ScriptPath $draftScript -Arguments @("--profile", "9020-content")
    }
    "t5500-audit" {
        Invoke-PythonScript -ScriptPath $draftScript -Arguments @("--profile", "t5500-audit")
        if (Test-Path $auditScript) {
            Invoke-NodeScript -ScriptPath $auditScript
        }
    }
    "t5500-revenue-pack" {
        if (-not (Test-Path $localWorker)) {
            throw "Missing worker script: $localWorker"
        }

        & pwsh -NoProfile -ExecutionPolicy Bypass -File $localWorker -Mode marketing-pack
        if ($LASTEXITCODE -ne 0) {
            throw "OnlineRecycle local worker failed."
        }
    }
    "sabretooth-control" {
        Invoke-PythonScript -ScriptPath $draftScript -Arguments @("--profile", "sabretooth-control")
    }
}

Write-Host ""
Write-Host "Safe node automation complete." -ForegroundColor Green
Write-Host "Profile: $Profile"
Write-Host "Output dir: $stateDir"
