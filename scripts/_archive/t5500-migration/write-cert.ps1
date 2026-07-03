# write-cert.ps1 — receives a base64 cert from stdin and writes to disk
$ErrorActionPreference = 'Stop'
$b64 = [Console]::In.ReadToEnd().Trim()
if (-not $b64) { Write-Host 'empty input'; exit 1 }
try {
  $bytes = [Convert]::FromBase64String($b64)
} catch {
  Write-Host "base64 decode failed: $_"
  exit 1
}
$destDir  = 'C:\Users\joshl\.cloudflared'
$destFile = Join-Path $destDir 'cert.pem'
New-Item -ItemType Directory -Force -Path $destDir | Out-Null
[IO.File]::WriteAllBytes($destFile, $bytes)
Write-Host ("wrote {0} bytes -> {1}" -f $bytes.Length, $destFile)
$first = (Get-Content $destFile -TotalCount 1)
if ($first -match 'BEGIN CERTIFICATE') { Write-Host 'cert OK' } else { Write-Host "cert header WRONG: $first" ; exit 1 }
