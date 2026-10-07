# Root Directory Cleanup Script (T5500 Node)
# Archives and safely removes legacy root folders from past experiments.

$ErrorActionPreference = 'Stop'
$BackupDir = 'C:\ARCHIVE_BACKUPS'
$ZipFile = Join-Path $BackupDir 'root_debris_2026-10-06.zip'
$LogFile = Join-Path $BackupDir 'cleanup.log'

function Write-Log($msg) {
    $line = "[{0}] {1}" -f (Get-Date -Format 'yyyy-MM-dd HH:mm:ss'), $msg
    Write-Host $line
    Add-Content -Path $LogFile -Value $line
}

if (-not (Test-Path $BackupDir)) {
    New-Item -ItemType Directory -Force -Path $BackupDir | Out-Null
}

$targets = @(
    'C:\c',
    'C:\gitaudit',
    'C:\HTML Files',
    'C:\marketing image videos',
    'C:\tmp',
    'C:\Ai-Solutions.store',
    'C:\Videos - Shortcut.lnk'
)

$existingTargets = @()
foreach ($t in $targets) {
    if (Test-Path $t) {
        $existingTargets += $t
    }
}

if ($existingTargets.Count -eq 0) {
    Write-Log "No root cleanup targets found. Nothing to do."
    exit 0
}

Write-Log ("Found {0} root targets to archive: {1}" -f $existingTargets.Count, ($existingTargets -join ', '))

# Use tar.exe to create the zip archive
Write-Log "Creating zip archive: $ZipFile"
$tarArgs = @('-a', '-c', '-f', $ZipFile) + $existingTargets
& tar.exe @tarArgs

if (-not (Test-Path $ZipFile) -or (Get-Item $ZipFile).Length -eq 0) {
    Write-Log "ERROR: Archive creation failed or resulting zip is empty. Aborting deletion."
    exit 1
}

$zipSizeMB = [math]::Round((Get-Item $ZipFile).Length / 1MB, 2)
Write-Log "Archive verified successfully: $ZipFile ($zipSizeMB MB)"

# Safely remove the original targets
foreach ($t in $existingTargets) {
    try {
        Write-Log "Removing original: $t"
        Remove-Item -Path $t -Recurse -Force -ErrorAction Stop
        Write-Log "Removed: $t"
    } catch {
        Write-Log "WARNING: Could not remove $($t): $_"
    }
}

Write-Log "Root cleanup completed successfully."
