[CmdletBinding()]
param(
    [string]$RepoRoot = "c:\antigravity",
    [string]$SabretoothHost = "192.168.0.8",
    [string]$VaultRoot = "$env:USERPROFILE\OneDrive\Personal Vault\ANTIGRAVITY-Codex-Critical",
    [switch]$ForceTakeover
)

$ErrorActionPreference = "Stop"

function Write-Step {
    param(
        [string]$Message,
        [ConsoleColor]$Color = [ConsoleColor]::Cyan
    )

    Write-Host $Message -ForegroundColor $Color
}

function Ensure-Directory {
    param([string]$Path)

    if (-not (Test-Path -LiteralPath $Path)) {
        New-Item -ItemType Directory -Path $Path -Force | Out-Null
    }
}

Write-Host ""
Write-Host "ANTIGRAVITY Fail-Soft Recovery" -ForegroundColor Cyan
Write-Host "This is not a simulation." -ForegroundColor Yellow
Write-Host "Work done here must protect the mission, users, and provider terms of service." -ForegroundColor Yellow
Write-Host "Joshua values the mission more than urgency or profit." -ForegroundColor Yellow
Write-Host ""

if (-not (Test-Path -LiteralPath $RepoRoot)) {
    throw "Repo root not found: $RepoRoot"
}

Set-Location $RepoRoot

$sabretoothReachable = $false
try {
    $sabretoothReachable = Test-Connection -ComputerName $SabretoothHost -Count 1 -Quiet -ErrorAction Stop
} catch {
    $sabretoothReachable = $false
}

if ($sabretoothReachable -and -not $ForceTakeover) {
    throw "Sabretooth ($SabretoothHost) still responds. Refusing takeover without -ForceTakeover."
}

$timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
$runtimeRoot = Join-Path $RepoRoot "CodeX\state\runtime\9020-failover-$timestamp"
$vaultStage = Join-Path $VaultRoot "9020-failover-$timestamp"
$bundlePath = Join-Path $runtimeRoot "antigravity-main-$timestamp.bundle"
$notePath = Join-Path $runtimeRoot "FAILOVER-STATUS.md"
$vaultNotePath = Join-Path $vaultStage "FAILOVER-STATUS.md"

Ensure-Directory -Path $runtimeRoot
Ensure-Directory -Path $vaultStage

$branch = (& git -C $RepoRoot branch --show-current).Trim()
$head = (& git -C $RepoRoot rev-parse HEAD).Trim()
$originMain = (& git -C $RepoRoot rev-parse origin/main 2>$null | Out-String).Trim()
$status = (& git -C $RepoRoot status --short --branch | Out-String).Trim()

Write-Step "Creating git relay bundle..."
& git -C $RepoRoot bundle create $bundlePath main | Out-Null

$trackedCopies = @(
    "AGENTS.md",
    "memory\CODEX-QUICK-MEMORY.md",
    "memory\activeContext.md",
    "memory\sessionHandoff.md",
    "briefings\HISTORICAL-ONCHAIN-STATUS.md"
)

foreach ($relativePath in $trackedCopies) {
    $source = Join-Path $RepoRoot $relativePath
    if (-not (Test-Path -LiteralPath $source)) {
        continue
    }

    $runtimeTarget = Join-Path $runtimeRoot $relativePath
    $vaultTarget = Join-Path $vaultStage $relativePath
    Ensure-Directory -Path (Split-Path -Parent $runtimeTarget)
    Ensure-Directory -Path (Split-Path -Parent $vaultTarget)
    Copy-Item -LiteralPath $source -Destination $runtimeTarget -Force
    Copy-Item -LiteralPath $source -Destination $vaultTarget -Force
}

$note = @"
# 9020 Temporary Failover Status

- Timestamp ET: $(Get-Date -Format "yyyy-MM-dd HH:mm:ss zzz")
- Host: $env:COMPUTERNAME
- Sabretooth reachable: $sabretoothReachable
- Repo root: $RepoRoot
- Branch: $branch
- HEAD: $head
- origin/main: $originMain
- Git status:

```text
$status
```

## Actions Taken

1. Created a portable git bundle relay:
   - `$bundlePath`
2. Copied continuity files into:
   - `$runtimeRoot`
   - `$vaultStage`

## Operator Notes

- 9020 does not replace Sabretooth as canonical truth; it only preserves continuity and relay artifacts until Sabretooth returns.
- Do not rewrite history during failover.
- Reconcile back to `origin/main` on Sabretooth before treating any new state as canonical.
"@

Set-Content -LiteralPath $notePath -Value $note -Encoding UTF8
Set-Content -LiteralPath $vaultNotePath -Value $note -Encoding UTF8

Write-Step "Failover bundle: $bundlePath" Green
Write-Step "Runtime note: $notePath" Green
Write-Step "Vault sync: $vaultStage" Green
