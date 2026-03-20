[CmdletBinding()]
param(
    [string]$RepoRoot,
    [string]$WorkspaceRoot,
    [string]$UsbRoot = "I:\ANTIGRAVITY_BACKUPS\codex-continuity",
    [string]$OneDriveRoot = "$env:USERPROFILE\OneDrive\Documents\ANTIGRAVITY_BACKUPS\codex-continuity",
    [switch]$SkipUsb,
    [switch]$SkipOneDrive,
    [switch]$IncludeSecrets,
    [string]$SecretPassphrase,
    [string]$SecretPassphraseFile
)

$ErrorActionPreference = "Stop"

if (-not $RepoRoot) {
    $RepoRoot = Split-Path -Parent $PSScriptRoot
}
if (-not $WorkspaceRoot) {
    $WorkspaceRoot = Join-Path $RepoRoot "CodeX"
}
if (-not $SecretPassphraseFile) {
    $SecretPassphraseFile = Join-Path $RepoRoot "memory\private\continuity-passphrase.txt"
}

function Write-Step {
    param(
        [string]$Label,
        [string]$Message,
        [ConsoleColor]$Color = [ConsoleColor]::Cyan
    )

    Write-Host ("[{0}] {1}" -f $Label, $Message) -ForegroundColor $Color
}

function Ensure-Directory {
    param([Parameter(Mandatory = $true)][string]$Path)

    if (-not (Test-Path -LiteralPath $Path)) {
        New-Item -ItemType Directory -Path $Path -Force | Out-Null
    }
}

function Reset-Directory {
    param([Parameter(Mandatory = $true)][string]$Path)

    if (Test-Path -LiteralPath $Path) {
        Remove-Item -LiteralPath $Path -Recurse -Force
    }

    New-Item -ItemType Directory -Path $Path -Force | Out-Null
}

function Copy-Entry {
    param(
        [Parameter(Mandatory = $true)][string]$Source,
        [Parameter(Mandatory = $true)][string]$DestinationRoot,
        [Parameter(Mandatory = $true)][string]$RelativePath
    )

    if (-not (Test-Path -LiteralPath $Source)) {
        return $false
    }

    $destination = Join-Path $DestinationRoot $RelativePath
    $parent = Split-Path -Path $destination -Parent
    Ensure-Directory -Path $parent

    $item = Get-Item -LiteralPath $Source
    if ($item.PSIsContainer) {
        Copy-Item -LiteralPath $Source -Destination $destination -Recurse -Force
    } else {
        Copy-Item -LiteralPath $Source -Destination $destination -Force
    }

    return $true
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

function Protect-FileAes {
    param(
        [Parameter(Mandatory = $true)][string]$InputPath,
        [Parameter(Mandatory = $true)][string]$OutputPath,
        [Parameter(Mandatory = $true)][string]$Passphrase
    )

    $plainBytes = [System.IO.File]::ReadAllBytes($InputPath)
    $salt = New-Object byte[] 32
    $iv = New-Object byte[] 16
    [System.Security.Cryptography.RandomNumberGenerator]::Fill($salt)
    [System.Security.Cryptography.RandomNumberGenerator]::Fill($iv)

    $kdf = [System.Security.Cryptography.Rfc2898DeriveBytes]::new($Passphrase, $salt, 200000, [System.Security.Cryptography.HashAlgorithmName]::SHA256)
    $aes = [System.Security.Cryptography.Aes]::Create()
    $aes.Mode = [System.Security.Cryptography.CipherMode]::CBC
    $aes.Padding = [System.Security.Cryptography.PaddingMode]::PKCS7
    $aes.Key = $kdf.GetBytes(32)
    $aes.IV = $iv

    $memory = New-Object System.IO.MemoryStream
    try {
        $header = [System.Text.Encoding]::ASCII.GetBytes("CODEXCT1")
        $memory.Write($header, 0, $header.Length)
        $memory.Write($salt, 0, $salt.Length)
        $memory.Write($iv, 0, $iv.Length)

        $crypto = New-Object System.Security.Cryptography.CryptoStream($memory, $aes.CreateEncryptor(), [System.Security.Cryptography.CryptoStreamMode]::Write)
        try {
            $crypto.Write($plainBytes, 0, $plainBytes.Length)
            $crypto.FlushFinalBlock()
        } finally {
            $crypto.Dispose()
        }

        [System.IO.File]::WriteAllBytes($OutputPath, $memory.ToArray())
    } finally {
        $memory.Dispose()
        $aes.Dispose()
        $kdf.Dispose()
    }
}

function Test-TcpPortQuick {
    param(
        [Parameter(Mandatory = $true)][string]$HostName,
        [Parameter(Mandatory = $true)][int]$Port
    )

    $client = New-Object System.Net.Sockets.TcpClient
    try {
        $async = $client.BeginConnect($HostName, $Port, $null, $null)
        if (-not $async.AsyncWaitHandle.WaitOne(1500, $false)) {
            return $false
        }

        $client.EndConnect($async)
        return $true
    } catch {
        return $false
    } finally {
        $client.Dispose()
    }
}

function Get-GitRef {
    param(
        [Parameter(Mandatory = $true)][string]$Repository,
        [Parameter(Mandatory = $true)][string]$Ref
    )

    if (-not (Test-Path -LiteralPath (Join-Path $Repository ".git"))) {
        return $null
    }

    $value = (& git -C $Repository rev-parse $Ref 2>$null | Out-String).Trim()
    if ([string]::IsNullOrWhiteSpace($value)) {
        return $null
    }

    return $value
}

function Start-OneDriveIfInstalled {
    $candidatePaths = @(
        (Join-Path $env:LOCALAPPDATA "Microsoft\OneDrive\OneDrive.exe"),
        (Join-Path ${env:ProgramFiles} "Microsoft OneDrive\OneDrive.exe"),
        (Join-Path ${env:ProgramFiles(x86)} "Microsoft OneDrive\OneDrive.exe")
    ) | Where-Object { -not [string]::IsNullOrWhiteSpace($_) }

    foreach ($path in $candidatePaths) {
        if (Test-Path -LiteralPath $path) {
            if (-not (Get-Process OneDrive -ErrorAction SilentlyContinue)) {
                Start-Process -FilePath $path | Out-Null
                Start-Sleep -Seconds 3
            }

            return $path
        }
    }

    return $null
}

$timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
$repoHead = Get-GitRef -Repository $RepoRoot -Ref "HEAD"
$originMain = Get-GitRef -Repository $RepoRoot -Ref "origin/main"
$cDriveHead = Get-GitRef -Repository "C:\ANTIGRAVITY" -Ref "HEAD"
$oneDriveExecutable = $null

$tempRoot = Join-Path ([System.IO.Path]::GetTempPath()) "codex-continuity-$timestamp"
$publicStage = Join-Path $tempRoot "public-state"
$secretStage = Join-Path $tempRoot "private-state"
$secretZip = Join-Path $tempRoot "private-state.zip"
$secretEncrypted = Join-Path $tempRoot "private-state.aes"

Ensure-Directory -Path $tempRoot
Reset-Directory -Path $publicStage
Reset-Directory -Path $secretStage

$publicEntries = @(
    @{ Source = (Join-Path $RepoRoot "README.md"); Relative = "repo\README.md" },
    @{ Source = (Join-Path $RepoRoot "AGENTS.md"); Relative = "repo\AGENTS.md" },
    @{ Source = (Join-Path $RepoRoot ".gitignore"); Relative = "repo\.gitignore" },
    @{ Source = (Join-Path $RepoRoot ".mcp.json"); Relative = "repo\.mcp.json" },
    @{ Source = (Join-Path $WorkspaceRoot ".mcp.json"); Relative = "workspace\.mcp.json" },
    @{ Source = (Join-Path $RepoRoot "memory\README.md"); Relative = "memory\README.md" },
    @{ Source = (Join-Path $RepoRoot "memory\activeContext.md"); Relative = "memory\activeContext.md" },
    @{ Source = (Join-Path $RepoRoot "memory\sessionHandoff.md"); Relative = "memory\sessionHandoff.md" },
    @{ Source = (Join-Path $RepoRoot "memory\decisions.md"); Relative = "memory\decisions.md" },
    @{ Source = (Join-Path $RepoRoot "memory\identity.md"); Relative = "memory\identity.md" },
    @{ Source = (Join-Path $RepoRoot "memory\projectState.md"); Relative = "memory\projectState.md" },
    @{ Source = (Join-Path $RepoRoot "memory\techStack.md"); Relative = "memory\techStack.md" },
    @{ Source = (Join-Path $RepoRoot "memory\CONSOLIDATED_USER_PREFERENCES.md"); Relative = "memory\CONSOLIDATED_USER_PREFERENCES.md" },
    @{ Source = (Join-Path $RepoRoot "memory\MISSION_CONTINUITY.md"); Relative = "memory\MISSION_CONTINUITY.md" },
    @{ Source = (Join-Path $RepoRoot "memory\KRAKKEN-SYNC.ps1"); Relative = "memory\KRAKKEN-SYNC.ps1" },
    @{ Source = (Join-Path $RepoRoot "memory\sync-memory.ps1"); Relative = "memory\sync-memory.ps1" },
    @{ Source = (Join-Path $RepoRoot "scripts\codex-doctor.ps1"); Relative = "scripts\codex-doctor.ps1" },
    @{ Source = (Join-Path $RepoRoot "scripts\cleanup-sabretooth-admin.ps1"); Relative = "scripts\cleanup-sabretooth-admin.ps1" },
    @{ Source = (Join-Path $RepoRoot "scripts\cleanup-sabretooth-user-space.ps1"); Relative = "scripts\cleanup-sabretooth-user-space.ps1" },
    @{ Source = (Join-Path $RepoRoot "scripts\deploy\Setup-MCPs.ps1"); Relative = "scripts\deploy\Setup-MCPs.ps1" },
    @{ Source = (Join-Path $RepoRoot "scripts\deploy\mcp-config-template.json"); Relative = "scripts\deploy\mcp-config-template.json" },
    @{ Source = (Join-Path $RepoRoot "scripts\export-codex-continuity.ps1"); Relative = "scripts\export-codex-continuity.ps1" },
    @{ Source = (Join-Path $RepoRoot "scripts\finalize-codex-home-to-c-admin.ps1"); Relative = "scripts\finalize-codex-home-to-c-admin.ps1" },
    @{ Source = (Join-Path $RepoRoot "scripts\init-continuity-passphrase.ps1"); Relative = "scripts\init-continuity-passphrase.ps1" },
    @{ Source = (Join-Path $RepoRoot "scripts\restore-codex-continuity.ps1"); Relative = "scripts\restore-codex-continuity.ps1" },
    @{ Source = (Join-Path $RepoRoot "scripts\test-codex-continuity.ps1"); Relative = "scripts\test-codex-continuity.ps1" },
    @{ Source = (Join-Path $RepoRoot "scripts\run-onlinerecycle-revenue-worker.ps1"); Relative = "scripts\run-onlinerecycle-revenue-worker.ps1" },
    @{ Source = (Join-Path $RepoRoot "scripts\Run-OnlineRecycle-LocalWorker.ps1"); Relative = "scripts\Run-OnlineRecycle-LocalWorker.ps1" },
    @{ Source = (Join-Path $RepoRoot "scripts\onlinerecycle-local-worker.js"); Relative = "scripts\onlinerecycle-local-worker.js" },
    @{ Source = (Join-Path $RepoRoot "briefings\CODEX-CONTINUITY-RUNBOOK.md"); Relative = "briefings\CODEX-CONTINUITY-RUNBOOK.md" },
    @{ Source = (Join-Path $WorkspaceRoot "README.txt"); Relative = "workspace\README.txt" },
    @{ Source = (Join-Path $WorkspaceRoot "CodeXSabretoothStatus.MD"); Relative = "workspace\CodeXSabretoothStatus.MD" }
)

$secretEntries = @(
    @{ Source = (Join-Path $WorkspaceRoot "env"); Relative = "workspace\env" },
    @{ Source = (Join-Path $RepoRoot "memory\local"); Relative = "repo-memory\local" },
    @{ Source = (Join-Path $RepoRoot "memory\private"); Relative = "repo-memory\private" },
    @{ Source = (Join-Path $RepoRoot "data\local"); Relative = "repo-data\local" },
    @{ Source = (Join-Path $RepoRoot "data\private"); Relative = "repo-data\private" },
    @{ Source = (Join-Path $env:USERPROFILE ".ssh\config"); Relative = "user\.ssh\config" },
    @{ Source = (Join-Path $env:USERPROFILE ".ssh\krakken_ed25519"); Relative = "user\.ssh\krakken_ed25519" },
    @{ Source = (Join-Path $env:USERPROFILE ".ssh\krakken_ed25519.pub"); Relative = "user\.ssh\krakken_ed25519.pub" },
    @{ Source = (Join-Path $env:USERPROFILE ".ssh\id_ed25519"); Relative = "user\.ssh\id_ed25519" },
    @{ Source = (Join-Path $env:USERPROFILE ".ssh\id_ed25519.pub"); Relative = "user\.ssh\id_ed25519.pub" },
    @{ Source = (Join-Path $env:USERPROFILE ".codex\config.toml"); Relative = "user\.codex\config.toml" },
    @{ Source = (Join-Path $env:USERPROFILE ".gemini\antigravity\mcp_config.json"); Relative = "user\.gemini\antigravity\mcp_config.json" },
    @{ Source = (Join-Path $RepoRoot "scripts\fix-ssh-admin-keys.ps1"); Relative = "repo\scripts\fix-ssh-admin-keys.ps1" }
)

Write-Step -Label "START" -Message "Preparing Codex continuity export ($timestamp)"

$publicCopied = @()
foreach ($entry in $publicEntries) {
    if (Copy-Entry -Source $entry.Source -DestinationRoot $publicStage -RelativePath $entry.Relative) {
        $publicCopied += $entry.Relative
    }
}

$secretCopied = @()
if ($IncludeSecrets) {
    foreach ($entry in $secretEntries) {
        if (Copy-Entry -Source $entry.Source -DestinationRoot $secretStage -RelativePath $entry.Relative) {
            $secretCopied += $entry.Relative
        }
    }
}

$manifest = [ordered]@{
    generated_at = (Get-Date -Format "yyyy-MM-dd HH:mm:ss zzz")
    host = $env:COMPUTERNAME
    repo_root = $RepoRoot
    workspace_root = $WorkspaceRoot
    repo_head = $repoHead
    origin_main = $originMain
    c_drive_head = $cDriveHead
    ssh = [ordered]@{
        config = Test-Path -LiteralPath (Join-Path $env:USERPROFILE ".ssh\config")
        krakken_key = Test-Path -LiteralPath (Join-Path $env:USERPROFILE ".ssh\krakken_ed25519")
    }
    mcp = [ordered]@{
        repo = Test-Path -LiteralPath (Join-Path $RepoRoot ".mcp.json")
        workspace = Test-Path -LiteralPath (Join-Path $WorkspaceRoot ".mcp.json")
        gemini = Test-Path -LiteralPath (Join-Path $env:USERPROFILE ".gemini\antigravity\mcp_config.json")
    }
    services = [ordered]@{
        qdrant_6333 = Test-TcpPortQuick -HostName "127.0.0.1" -Port 6333
        redis_6379 = Test-TcpPortQuick -HostName "127.0.0.1" -Port 6379
    }
    public_entries = $publicCopied
    secret_entries = $secretCopied
    include_secrets = [bool]$IncludeSecrets
}

$manifestPath = Join-Path $publicStage "continuity-manifest.json"
$manifest | ConvertTo-Json -Depth 6 | Set-Content -LiteralPath $manifestPath -Encoding utf8

$passphrase = Get-SecretPassphraseValue -InlineValue $SecretPassphrase -FilePath $SecretPassphraseFile
$secretMode = "skipped"
if ($IncludeSecrets -and $secretCopied.Count -gt 0) {
    if (-not [string]::IsNullOrWhiteSpace($passphrase)) {
        if (Test-Path -LiteralPath $secretZip) {
            Remove-Item -LiteralPath $secretZip -Force
        }

        Compress-Archive -Path (Join-Path $secretStage "*") -DestinationPath $secretZip -CompressionLevel Optimal -Force
        Protect-FileAes -InputPath $secretZip -OutputPath $secretEncrypted -Passphrase $passphrase
        $secretMode = "encrypted"
    } else {
        $secretMode = "plaintext-usb-only"
    }
}

$destinations = @()
if (-not $SkipUsb -and (Test-Path -LiteralPath (Split-Path -Path $UsbRoot -Qualifier))) {
    $destinations += [pscustomobject]@{ Name = "USB"; Root = $UsbRoot }
}

if (-not $SkipOneDrive -and (Test-Path -LiteralPath (Split-Path -Path $OneDriveRoot -Qualifier))) {
    $oneDriveExecutable = Start-OneDriveIfInstalled
    $destinations += [pscustomobject]@{ Name = "OneDrive"; Root = $OneDriveRoot }
}

foreach ($destination in $destinations) {
    $latestPublic = Join-Path $destination.Root "latest\public-state"
    $historyPublic = Join-Path $destination.Root "history\$timestamp\public-state"

    Reset-Directory -Path $latestPublic
    Ensure-Directory -Path $historyPublic

    Copy-Item -Path (Join-Path $publicStage "*") -Destination $latestPublic -Recurse -Force
    Copy-Item -Path (Join-Path $publicStage "*") -Destination $historyPublic -Recurse -Force

    if ($IncludeSecrets -and $secretCopied.Count -gt 0) {
        if ($secretMode -eq "encrypted") {
            $latestSecret = Join-Path $destination.Root "latest\private-state.aes"
            $historySecret = Join-Path $destination.Root "history\$timestamp\private-state.aes"
            Ensure-Directory -Path (Split-Path -Path $latestSecret -Parent)
            Ensure-Directory -Path (Split-Path -Path $historySecret -Parent)
            Copy-Item -LiteralPath $secretEncrypted -Destination $latestSecret -Force
            Copy-Item -LiteralPath $secretEncrypted -Destination $historySecret -Force
        } elseif ($secretMode -eq "plaintext-usb-only" -and $destination.Name -eq "USB") {
            $latestSecret = Join-Path $destination.Root "latest\private-state"
            $historySecret = Join-Path $destination.Root "history\$timestamp\private-state"
            Reset-Directory -Path $latestSecret
            Ensure-Directory -Path $historySecret
            Copy-Item -Path (Join-Path $secretStage "*") -Destination $latestSecret -Recurse -Force
            Copy-Item -Path (Join-Path $secretStage "*") -Destination $historySecret -Recurse -Force
        }
    }
}

$status = [ordered]@{
    generated_at = (Get-Date -Format "yyyy-MM-dd HH:mm:ss zzz")
    timestamp = $timestamp
    public_backup_targets = @($destinations.Name)
    secret_mode = $secretMode
    one_drive_started = [bool]$oneDriveExecutable
    usb_available = (Test-Path -LiteralPath (Split-Path -Path $UsbRoot -Qualifier))
    one_drive_available = (Test-Path -LiteralPath (Split-Path -Path $OneDriveRoot -Qualifier))
}

$statusPath = Join-Path $RepoRoot "data\private\codex-continuity\latest-status.json"
Ensure-Directory -Path (Split-Path -Path $statusPath -Parent)
$status | ConvertTo-Json -Depth 4 | Set-Content -LiteralPath $statusPath -Encoding utf8

Write-Step -Label "DONE" -Message ("Public continuity exported to: {0}" -f (($destinations.Name -join ", "))) -Color Green
Write-Step -Label "SECRET" -Message ("Secret continuity mode: {0}" -f $secretMode) -Color Yellow
Write-Step -Label "STATUS" -Message ("Status written to {0}" -f $statusPath) -Color Green
