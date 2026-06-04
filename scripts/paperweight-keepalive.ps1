# Paperweight (OPUShasHands mission dashboard) keepalive — 24/7, headless, auto-restart.
# Launched at logon by the Startup-folder shortcut (paperweight-dashboard.cmd). Non-admin.
# Loops forever: if :4200 is not answering, relaunch Paperweight windowless (pythonw = no
# console, no focus-steal). Restarts within ~30s of any crash. "Doors stay unlocked."
$ErrorActionPreference = 'SilentlyContinue'
$pyw = 'C:\Python314\pythonw.exe'
if (-not (Test-Path $pyw)) { $pyw = (Get-Command python).Source }
$dir = 'C:\Antigravity\apps\paperweight'
# Loopback bind is correct: the Cloudflare tunnel reaches it on 127.0.0.1:4200.
$env:PAPERWEIGHT_HOST = '127.0.0.1'
$env:PAPERWEIGHT_PORT = '4200'
while ($true) {
    $up = $false
    try { $up = (Invoke-WebRequest -UseBasicParsing 'http://127.0.0.1:4200/api/health' -TimeoutSec 3).StatusCode -eq 200 } catch {}
    if (-not $up) {
        Start-Process -FilePath $pyw -ArgumentList 'paperweight.py' -WorkingDirectory $dir -WindowStyle Hidden
    }
    Start-Sleep -Seconds 30
}
