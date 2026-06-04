$ErrorActionPreference = 'Continue'

$files = @(
  'C:\ANTIGRAVITY\.env',
  'C:\ANTIGRAVITY\.env.opencode',
  'C:\ANTIGRAVITY\paperclip-runtime\.env',
  'C:\ANTIGRAVITY\briefings\MASTER-UNIVERSAL-ENV-TROLLZ1004.env'
)

$patterns = 'CLOUDFLARE|CF_|TUNNEL|WRANGLER'
Write-Output '=== Cloudflare-related env keys only ==='
foreach ($file in $files) {
  Write-Output "--- $file ---"
  if (-not (Test-Path $file)) {
    Write-Output 'missing'
    continue
  }
  Get-Content $file -ErrorAction SilentlyContinue |
    ForEach-Object {
      $line = $_.Trim()
      if (-not $line -or $line.StartsWith('#') -or $line -notmatch '=') { return }
      $key = ($line -split '=', 2)[0].Trim()
      if ($key -match $patterns) { Write-Output $key }
    }
}
