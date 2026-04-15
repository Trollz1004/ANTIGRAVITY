# Removes the final legacy Paperclip drift after reboot/logon clears stale file handles.

$ErrorActionPreference = 'Stop'

$LogDir = 'C:\ANTIGRAVITY\logs'
$LogFile = Join-Path $LogDir 'paperclip-drift-cleanup.log'
$LegacyPath = 'E:\trollz-sandbox\paperclip-antigravity'

New-Item -ItemType Directory -Force -Path $LogDir | Out-Null

function Log($Message) {
    $line = "[{0}] {1}" -f (Get-Date -Format 'yyyy-MM-dd HH:mm:ss'), $Message
    Write-Host $line
    Add-Content -Path $LogFile -Value $line
}

try {
    Log 'Starting Paperclip drift cleanup.'

    if (Test-Path -LiteralPath $LegacyPath) {
        Remove-Item -LiteralPath $LegacyPath -Recurse -Force -ErrorAction Stop
        Log "Removed $LegacyPath"
    } else {
        Log "Legacy path already absent: $LegacyPath"
    }

    Log 'Paperclip drift cleanup complete.'
    exit 0
} catch {
    Log "ERROR: $($_.Exception.Message)"
    exit 1
}
