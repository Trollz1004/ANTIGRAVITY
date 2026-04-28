$ErrorActionPreference = 'Continue'

$urls = @(
  'http://127.0.0.1:3100/api/health',
  'http://127.0.0.1:3100',
  'https://paperclip-hq.youandinotai.com/api/health',
  'https://paperclip-hq.youandinotai.com/'
)

foreach ($url in $urls) {
  Write-Output "=== $url ==="
  try {
    $response = Invoke-WebRequest -Uri $url -UseBasicParsing -TimeoutSec 20
    Write-Output "HTTP $($response.StatusCode)"
    $body = [string]$response.Content
    if ($body.Length -gt 500) { $body = $body.Substring(0, 500) }
    Write-Output $body
  } catch {
    Write-Output "ERROR $($_.Exception.Message)"
    if ($_.Exception.Response) {
      Write-Output "HTTP $([int]$_.Exception.Response.StatusCode)"
    }
  }
}
