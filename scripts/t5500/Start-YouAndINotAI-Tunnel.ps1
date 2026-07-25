# Runs the T5500 Cloudflare named tunnel in the foreground.
# This script is intended to be owned by a Scheduled Task so the connector
# remains active instead of being spawned as a child process that exits.

$ErrorActionPreference = "Stop"

$LogDir = "E:\ANTIGRAVITY\logs"
$Cloudflared = "C:\Program Files (x86)\cloudflared\cloudflared.exe"
$TunnelTokenPath = "C:\Users\joshl\.cloudflared\t5500-dateapp.token"
$TunnelOut = Join-Path $LogDir "t5500-dateapp-tunnel.log"
$TunnelErr = Join-Path $LogDir "t5500-dateapp-tunnel.err.log"
$WrapperLog = Join-Path $LogDir "t5500-dateapp-tunnel-task.log"

New-Item -ItemType Directory -Force -Path $LogDir | Out-Null

function Write-TunnelLog {
    param([string]$Message)
    Add-Content -LiteralPath $WrapperLog -Value "$(Get-Date -Format s) $Message"
}

if (-not (Test-Path $Cloudflared)) {
    throw "cloudflared not found at $Cloudflared"
}
if (-not (Test-Path $TunnelTokenPath)) {
    throw "tunnel token not found at $TunnelTokenPath"
}

$token = (Get-Content -LiteralPath $TunnelTokenPath -Raw).Trim()
Write-TunnelLog "starting cloudflared foreground"
try {
    $ErrorActionPreference = "Continue"
    & $Cloudflared tunnel --no-autoupdate run --token $token >> $TunnelOut 2>> $TunnelErr
parent of 22d51cba (chore: clean business-only public surfaces)
    $code = $LASTEXITCODE
} catch {
    $code = 1
    Write-TunnelLog "cloudflared threw $($_.Exception.Message)"
}
Write-TunnelLog "cloudflared exited code=$code"
exit $code
