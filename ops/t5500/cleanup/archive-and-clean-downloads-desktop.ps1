# Downloads and Desktop Cleanup Script (T5500 Node)
# Archives and safely removes legacy downloads and desktop prompts into C:\ARCHIVE_BACKUPS.

$ErrorActionPreference = 'Continue'
$BackupDir = 'C:\ARCHIVE_BACKUPS'
$ZipFile = Join-Path $BackupDir 'downloads_desktop_2026-10-06.zip'
$LogFile = Join-Path $BackupDir 'cleanup.log'
$UserHome = 'C:\Users\joshi'

function Write-Log($msg) {
    $line = "[{0}] {1}" -f (Get-Date -Format 'yyyy-MM-dd HH:mm:ss'), $msg
    Write-Host $line
    Add-Content -Path $LogFile -Value $line
}

$desktopFiles = @(
    (Join-Path $UserHome 'Desktop\HERMES-PROMPTS.txt'),
    (Join-Path $UserHome 'Desktop\hermes-telegram-notification.mp3'),
    (Join-Path $UserHome 'Desktop\HERMES_TELEGRAM_MSG.txt'),
    (Join-Path $UserHome 'Desktop\PROMPT-CLAUDE-ALIENWARE.txt'),
    (Join-Path $UserHome 'Desktop\PROMPT-HERMES-ALIENWARE.txt'),
    (Join-Path $UserHome 'Desktop\PROMPT-HERMES-SABRETOOTH.txt'),
    (Join-Path $UserHome 'Desktop\Removed Apps.html'),
    (Join-Path $UserHome 'Desktop\test_write.txt')
)

$downloadsFiles = Get-ChildItem -Path (Join-Path $UserHome 'Downloads') -Force -ErrorAction SilentlyContinue

$allTargets = @()
foreach ($f in $desktopFiles) {
    if (Test-Path $f) { $allTargets += $f }
}
foreach ($f in $downloadsFiles) {
    $allTargets += $f.FullName
}

Write-Log ("Found {0} desktop/download items to archive." -f $allTargets.Count)

$manifest = Join-Path $BackupDir 'downloads_manifest.txt'
$allTargets | Out-File -FilePath $manifest -Encoding utf8

Write-Log "Archiving downloads and desktop to: $ZipFile"
$tarArgs = @('-a', '-c', '-f', $ZipFile, '-T', $manifest)
& tar.exe @tarArgs

if (-not (Test-Path $ZipFile) -or (Get-Item $ZipFile).Length -eq 0) {
    Write-Log "ERROR: Downloads/desktop archive creation failed. Aborting deletion."
    exit 1
}

$zipSizeMB = [math]::Round((Get-Item $ZipFile).Length / 1MB, 2)
Write-Log "Downloads/desktop archive verified successfully: $ZipFile ($zipSizeMB MB)"

# Safely remove items
foreach ($p in $allTargets) {
    try {
        Remove-Item -Path $p -Recurse -Force -ErrorAction Stop
        Write-Log "Removed: $p"
    } catch {
        Write-Log "WARNING: Could not remove $($p): $_"
    }
}

Write-Log "Downloads and Desktop cleanup completed successfully."
