# Start Paperclip HQ — SQLite mode (no external postgres dependency)
# paperclipai uses its own built-in storage by default.
# If you need external postgres: set DATABASE_URL here and ensure postgres is running.

$ErrorActionPreference = 'Continue'
$LogDir = 'C:\ANTIGRAVITY\logs'
$LogFile = "$LogDir\paperclip.log"

New-Item -ItemType Directory -Force -Path $LogDir | Out-Null

function Log($msg) {
    $line = "[$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')] $msg"
    Add-Content -Path $LogFile -Value $line -ErrorAction SilentlyContinue
}

Log 'Starting Paperclip HQ (SQLite mode) on port 3100...'

try {
    & 'C:\Users\joshl\AppData\Roaming\npm\paperclipai.cmd' run *>> $LogFile 2>&1
} catch {
    Log "ERROR: $($_.Exception.Message)"
    exit 1
}
