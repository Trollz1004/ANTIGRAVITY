# start-opushashands.ps1
# Serves the OpusHasHands hub on http://127.0.0.1:4200
# Cloudflare tunnel ingress routes opushashands.youandinotai.com -> this port.
# Tunnel config: C:\Users\joshl\.cloudflared\config.yml  (repo mirror: infra/cloudflare/paperclip-hq.yml)
#
# Usage:
#   pwsh C:\Antigravity\tools\scripts\start-opushashands.ps1
#
# To keep this alive across reboots, wrap in NSSM:
#   nssm install OpusHasHands "C:\Program Files\PowerShell\7\pwsh.exe" `
#     "-NoProfile -ExecutionPolicy Bypass -File C:\Antigravity\tools\scripts\start-opushashands.ps1"
#   nssm start OpusHasHands

$ErrorActionPreference = "Stop"

# Prefer the design-package staged copy if the integration PR hasn't landed yet.
$staged = "C:\Antigravity\_handoff-staging-2026-05-26\_deploy\opushashands"
$final  = "C:\Antigravity\_deploy\opushashands"

if (Test-Path "$final\index.html") {
    $serveDir = $final
} elseif (Test-Path "$staged\index.html") {
    $serveDir = $staged
} else {
    Write-Error "Neither $final\index.html nor $staged\index.html exists. Run the Hermes integration dispatch first."
    exit 1
}

Write-Host "[start-opushashands] serving directory: $serveDir"
Write-Host "[start-opushashands] port: 4200"
Write-Host "[start-opushashands] tunnel: opushashands.youandinotai.com -> http://127.0.0.1:4200"

Set-Location -Path $serveDir

# Use python's http.server if available, otherwise fall back to .NET HttpListener.
$python = (Get-Command python -ErrorAction SilentlyContinue) `
    ?? (Get-Command python3 -ErrorAction SilentlyContinue) `
    ?? (Get-Command py -ErrorAction SilentlyContinue)

if ($python) {
    Write-Host "[start-opushashands] using $($python.Source) -m http.server 4200"
    & $python.Source -m http.server 4200 --bind 127.0.0.1
    exit $LASTEXITCODE
}

# .NET fallback (no python on PATH).
Write-Host "[start-opushashands] python not found; using .NET HttpListener fallback"

Add-Type -AssemblyName System.Net.HttpListener

$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add("http://127.0.0.1:4200/")
$listener.Start()
Write-Host "[start-opushashands] listening on http://127.0.0.1:4200/"

try {
    while ($listener.IsListening) {
        $ctx = $listener.GetContext()
        $reqPath = $ctx.Request.Url.AbsolutePath.TrimStart('/')
        if ([string]::IsNullOrEmpty($reqPath)) { $reqPath = "index.html" }
        $diskPath = Join-Path $serveDir $reqPath

        if (Test-Path $diskPath -PathType Leaf) {
            $bytes = [System.IO.File]::ReadAllBytes($diskPath)
            $ctype = switch -wildcard ($diskPath) {
                "*.html" { "text/html; charset=utf-8" }
                "*.css"  { "text/css; charset=utf-8" }
                "*.js"   { "application/javascript; charset=utf-8" }
                "*.jsx"  { "application/javascript; charset=utf-8" }
                "*.json" { "application/json; charset=utf-8" }
                "*.svg"  { "image/svg+xml" }
                "*.png"  { "image/png" }
                "*.jpg"  { "image/jpeg" }
                "*.webp" { "image/webp" }
                "*.ico"  { "image/x-icon" }
                default  { "application/octet-stream" }
            }
            $ctx.Response.ContentType = $ctype
            $ctx.Response.ContentLength64 = $bytes.Length
            $ctx.Response.OutputStream.Write($bytes, 0, $bytes.Length)
            $ctx.Response.StatusCode = 200
        } else {
            $msg = [System.Text.Encoding]::UTF8.GetBytes("404 Not Found: $reqPath")
            $ctx.Response.StatusCode = 404
            $ctx.Response.OutputStream.Write($msg, 0, $msg.Length)
        }
        $ctx.Response.Close()
    }
} finally {
    $listener.Stop()
    $listener.Close()
}
