[CmdletBinding()]
param(
    [string]$RepoRoot,
    [string]$UsbRoot = "I:\ANTIGRAVITY_BACKUPS\codex-continuity",
    [string]$OneDriveRoot = "$env:USERPROFILE\OneDrive\Documents\ANTIGRAVITY_BACKUPS\codex-continuity"
)

$ErrorActionPreference = "Continue"

if (-not $RepoRoot) {
    $RepoRoot = Split-Path -Parent $PSScriptRoot
}

function Write-Result {
    param(
        [Parameter(Mandatory = $true)][string]$Label,
        [Parameter(Mandatory = $true)][ValidateSet("PASS", "WARN", "FAIL")][string]$Status,
        [Parameter(Mandatory = $true)][string]$Detail
    )

    $color = switch ($Status) {
        "PASS" { "Green" }
        "WARN" { "DarkYellow" }
        default { "Red" }
    }

    Write-Host ("[{0}] {1} :: {2}" -f $Status, $Label, $Detail) -ForegroundColor $color
}

$oneDrivePublic = Join-Path $OneDriveRoot "latest\public-state\continuity-manifest.json"
$oneDriveSecretEnc = Join-Path $OneDriveRoot "latest\private-state.aes"
$statusPath = Join-Path $RepoRoot "data\private\codex-continuity\latest-status.json"

$usbDrive = Split-Path -Path $UsbRoot -Qualifier
$usbMounted = Test-Path -LiteralPath $usbDrive
$usbPublic = if ($usbMounted) { Join-Path $UsbRoot "latest\public-state\continuity-manifest.json" } else { $null }
$usbSecretPlain = if ($usbMounted) { Join-Path $UsbRoot "latest\private-state" } else { $null }
$usbSecretEnc = if ($usbMounted) { Join-Path $UsbRoot "latest\private-state.aes" } else { $null }
$usbPublicOk = $usbMounted -and (Test-Path -LiteralPath $usbPublic)
$oneDrivePublicOk = Test-Path -LiteralPath $oneDrivePublic
$usbSecretOk = $usbMounted -and ((Test-Path -LiteralPath $usbSecretPlain) -or (Test-Path -LiteralPath $usbSecretEnc))
$oneDriveSecretOk = Test-Path -LiteralPath $oneDriveSecretEnc
$oneDriveRunning = $null -ne (Get-Process OneDrive -ErrorAction SilentlyContinue)

Write-Host ""
Write-Host "=== Codex Continuity Status ===" -ForegroundColor Cyan
Write-Host ("Time: {0}" -f (Get-Date -Format "yyyy-MM-dd HH:mm:ss zzz"))

if (-not $usbMounted) {
    Write-Result -Label "USB Public" -Status "WARN" -Detail ("Backup drive not mounted: {0}" -f $usbDrive)
} elseif ($usbPublicOk) {
    Write-Result -Label "USB Public" -Status "PASS" -Detail $usbPublic
} else {
    Write-Result -Label "USB Public" -Status "FAIL" -Detail "No public continuity manifest on Kraken USB"
}

if ($oneDrivePublicOk) {
    Write-Result -Label "OneDrive Public" -Status "PASS" -Detail $oneDrivePublic
} else {
    Write-Result -Label "OneDrive Public" -Status "WARN" -Detail "No offsite public continuity manifest found"
}

if (-not $usbMounted) {
    Write-Result -Label "USB Secrets" -Status "WARN" -Detail ("Backup drive not mounted: {0}" -f $usbDrive)
} elseif ($usbSecretOk) {
    $detail = if (Test-Path -LiteralPath $usbSecretEnc) { $usbSecretEnc } else { $usbSecretPlain }
    Write-Result -Label "USB Secrets" -Status "PASS" -Detail $detail
} else {
    Write-Result -Label "USB Secrets" -Status "FAIL" -Detail "No secret continuity pack on Kraken USB"
}

if ($oneDriveSecretOk) {
    Write-Result -Label "OneDrive Secrets" -Status "PASS" -Detail $oneDriveSecretEnc
} else {
    Write-Result -Label "OneDrive Secrets" -Status "WARN" -Detail "No encrypted offsite secret continuity pack found"
}

if ($oneDriveRunning) {
    Write-Result -Label "OneDrive Process" -Status "PASS" -Detail "OneDrive sync process is running"
} else {
    Write-Result -Label "OneDrive Process" -Status "WARN" -Detail "OneDrive sync process not detected"
}

if (Test-Path -LiteralPath $statusPath) {
    Write-Result -Label "Latest Export Status" -Status "PASS" -Detail $statusPath
}

$overall = if ($oneDrivePublicOk -and $oneDriveSecretOk -and (($usbMounted -and $usbPublicOk -and $usbSecretOk) -or (-not $usbMounted))) {
    "GREEN"
} elseif (($usbMounted -and $usbPublicOk -and $usbSecretOk) -or $oneDrivePublicOk) {
    "YELLOW"
} else {
    "RED"
}

Write-Host ""
switch ($overall) {
    "GREEN" {
        Write-Host "OVERALL: GREEN — Code/state and secret continuity are backed up beyond local drives." -ForegroundColor Green
    }
    "YELLOW" {
        Write-Host "OVERALL: YELLOW — Code/state continuity is backed up, but offsite secret continuity is not fully in place." -ForegroundColor Yellow
    }
    default {
        Write-Host "OVERALL: RED — Disaster recovery is incomplete." -ForegroundColor Red
    }
}
