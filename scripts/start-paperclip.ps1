# Start Paperclip HQ using its local trusted embedded Postgres runtime.
# The active instance lives under C:\Users\joshl\.paperclip\instances\default.

$ErrorActionPreference = 'Continue'
$LogDir = 'C:\ANTIGRAVITY\logs'
$LogFile = "$LogDir\paperclip.log"

New-Item -ItemType Directory -Force -Path $LogDir | Out-Null

function Log($msg) {
    $line = "[$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')] $msg"
    Add-Content -Path $LogFile -Value $line -ErrorAction SilentlyContinue
}

Log 'Starting Paperclip HQ (embedded Postgres) on port 3100...'

try {
    & 'C:\Users\joshl\AppData\Roaming\npm\paperclipai.cmd' run *>> $LogFile 2>&1
} catch {
    Log "ERROR: $($_.Exception.Message)"
    exit 1
}
