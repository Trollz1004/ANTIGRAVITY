[CmdletBinding()]
param(
    [string]$EncryptedPath,
    [string]$OutputDirectory,
    [string]$Passphrase,
    [string]$PassphraseFile
)

$ErrorActionPreference = "Stop"

if (-not $PassphraseFile) {
    $PassphraseFile = Join-Path (Split-Path -Parent $PSScriptRoot) "memory\private\continuity-passphrase.txt"
}

function Get-SecretPassphraseValue {
    param(
        [string]$InlineValue,
        [string]$FilePath
    )

    if (-not [string]::IsNullOrWhiteSpace($InlineValue)) {
        return $InlineValue
    }

    if (-not [string]::IsNullOrWhiteSpace($FilePath) -and (Test-Path -LiteralPath $FilePath)) {
        return (Get-Content -LiteralPath $FilePath -Raw).Trim()
    }

    if (-not [string]::IsNullOrWhiteSpace($env:CODEX_CONTINUITY_PASSPHRASE)) {
        return $env:CODEX_CONTINUITY_PASSPHRASE.Trim()
    }

    return $null
}

function Unprotect-FileAes {
    param(
        [Parameter(Mandatory = $true)][string]$InputPath,
        [Parameter(Mandatory = $true)][string]$OutputPath,
        [Parameter(Mandatory = $true)][string]$Passphrase
    )

    $allBytes = [System.IO.File]::ReadAllBytes($InputPath)
    $header = [System.Text.Encoding]::ASCII.GetString($allBytes, 0, 8)
    if ($header -ne "CODEXCT1") {
        throw "Unsupported continuity secret format."
    }

    $salt = $allBytes[8..39]
    $iv = $allBytes[40..55]
    $cipher = $allBytes[56..($allBytes.Length - 1)]

    $kdf = [System.Security.Cryptography.Rfc2898DeriveBytes]::new($Passphrase, $salt, 200000, [System.Security.Cryptography.HashAlgorithmName]::SHA256)
    $aes = [System.Security.Cryptography.Aes]::Create()
    $aes.Mode = [System.Security.Cryptography.CipherMode]::CBC
    $aes.Padding = [System.Security.Cryptography.PaddingMode]::PKCS7
    $aes.Key = $kdf.GetBytes(32)
    $aes.IV = $iv

    $memory = New-Object System.IO.MemoryStream
    try {
        $memory.Write($cipher, 0, $cipher.Length)
        $memory.Position = 0
        $crypto = New-Object System.Security.Cryptography.CryptoStream($memory, $aes.CreateDecryptor(), [System.Security.Cryptography.CryptoStreamMode]::Read)
        $out = New-Object System.IO.MemoryStream
        try {
            $crypto.CopyTo($out)
            [System.IO.File]::WriteAllBytes($OutputPath, $out.ToArray())
        } finally {
            $out.Dispose()
            $crypto.Dispose()
        }
    } finally {
        $memory.Dispose()
        $aes.Dispose()
        $kdf.Dispose()
    }
}

if ([string]::IsNullOrWhiteSpace($EncryptedPath)) {
    throw "Provide -EncryptedPath."
}

if ([string]::IsNullOrWhiteSpace($OutputDirectory)) {
    throw "Provide -OutputDirectory."
}

$secret = Get-SecretPassphraseValue -InlineValue $Passphrase -FilePath $PassphraseFile
if ([string]::IsNullOrWhiteSpace($secret)) {
    throw "No passphrase provided. Use -Passphrase, -PassphraseFile, or CODEX_CONTINUITY_PASSPHRASE."
}

if (-not (Test-Path -LiteralPath $EncryptedPath)) {
    throw "Encrypted continuity pack not found: $EncryptedPath"
}

if (-not (Test-Path -LiteralPath $OutputDirectory)) {
    New-Item -ItemType Directory -Path $OutputDirectory -Force | Out-Null
}

$zipPath = Join-Path $OutputDirectory "private-state.zip"
Unprotect-FileAes -InputPath $EncryptedPath -OutputPath $zipPath -Passphrase $secret
Expand-Archive -LiteralPath $zipPath -DestinationPath (Join-Path $OutputDirectory "private-state") -Force

Write-Host "Continuity secret pack restored to $(Join-Path $OutputDirectory 'private-state')" -ForegroundColor Green
