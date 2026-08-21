$ErrorActionPreference='SilentlyContinue'
try {
  $r=Invoke-WebRequest -Uri 'http://192.168.0.8:3110/status' -UseBasicParsing -TimeoutSec 4
  Write-Host ('proxy_status='+$r.Content)
} catch {
  Write-Host ('proxy_status_failed='+$_.Exception.Message)
}
try {
  $p=Invoke-WebRequest -Uri 'http://127.0.0.1:3120/' -UseBasicParsing -TimeoutSec 4
  Write-Host ('paperclip='+$p.StatusCode+' bodylen='+$p.Content.Length)
} catch {
  Write-Host ('paperclip_failed='+$_.Exception.Message)
}
