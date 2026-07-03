# push-cert.ps1 — runs on T5500 to receive the cert.pem from Sabretooth via base64 stdin
$ErrorActionPreference = 'Stop'

# Read base64 from stdin
$b64 = [Console]::In.ReadToEnd().Trim()
$bytes = [Convert]::FromBase64String($b64)

$destDir = 'C:\Users\joshl\.cloudflared'
$destFile = Join-Path $destDir 'cert.pem'

New-Item -ItemType Directory -Force -Path $destDir | Out-Null
[IO.File]::WriteAllBytes($destFile, $bytes)
Write-Host ("wrote {0} bytes -> {1}" -f $bytes.Length, $destFile)

# Quick sanity check
$firstLine = (Get-Content $destFile -TotalCount 1)
if ($firstLine -match 'BEGIN CERTIFICATE') {
  Write-Host 'cert header OK'
} else {
  Write-Host 'cert header WRONG'
  exit 1
}
