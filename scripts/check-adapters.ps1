$ErrorActionPreference='SilentlyContinue'
$urls = @(
  'http://127.0.0.1:20128/health'
  'http://127.0.0.1:20128/v1/models'
  'http://127.0.0.1:20128/dashboard/providers'
  'http://127.0.0.1:11434/api/tags'
  'http://127.0.0.1:18789/'
  'http://127.0.0.1:3120/'
)
foreach ($u in $urls) {
  try {
    $r=Invoke-WebRequest -Uri $u -UseBasicParsing -TimeoutSec 4
    $preview = $r.Content.Substring(0, [Math]::Min(120, $r.Content.Length))
    Write-Host ($u + ' => ' + $r.StatusCode + ' | ' + $preview)
  } catch {
    Write-Host ($u + ' => FAILED | ' + $_.Exception.Message)
  }
}
