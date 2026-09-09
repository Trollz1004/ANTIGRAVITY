[CmdletBinding()]
param(
    [string]$LocalPassphraseFile,
    [string]$VaultPassphraseFile = "C:\Users\joshl\OneDrive\Personal Vault\codex-continuity-passphrase.txt"
)

$ErrorActionPreference = "Stop"

if (-not $LocalPassphraseFile) {
    $LocalPassphraseFile = Join-Path (Split-Path -Parent $PSScriptRoot) "memory\private\continuity-passphrase.txt"
}

$bytes = New-Object byte[] 32
[System.Security.Cryptography.RandomNumberGenerator]::Fill($bytes)
$phrase = [Convert]::ToHexString($bytes)

$localParent = Split-Path -Path $LocalPassphraseFile -Parent
if (-not (Test-Path -LiteralPath $localParent)) {
    New-Item -ItemType Directory -Path $localParent -Force | Out-Null
}

Set-Content -LiteralPath $LocalPassphraseFile -Value $phrase -Encoding ascii

$vaultParent = Split-Path -Path $VaultPassphraseFile -Parent
if (-not (Test-Path -LiteralPath $vaultParent)) {
    throw "Personal Vault path is not available: $vaultParent"
}

Set-Content -LiteralPath $VaultPassphraseFile -Value $phrase -Encoding ascii

$probe = Join-Path $vaultParent "codex-probe.txt"
if (Test-Path -LiteralPath $probe) {
    Remove-Item -LiteralPath $probe -Force
}

Write-Host "Local continuity passphrase file: $LocalPassphraseFile" -ForegroundColor Green
Write-Host "Vault continuity passphrase file: $VaultPassphraseFile" -ForegroundColor Green
Write-Host "Passphrase length: $($phrase.Length)" -ForegroundColor Cyan
