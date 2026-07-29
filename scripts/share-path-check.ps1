<#
Fast share-path checks. No labels.
#>
$ErrorActionPreference='SilentlyContinue'
try {
  $p=Invoke-WebRequest -Uri 'http://127.0.0.1:3120/' -UseBasicParsing -TimeoutSec 4
  Write-Host ('paperclip='+$p.StatusCode)
} catch {
  Write-Host ('paperclip_local_failed='+$_.Exception.Message)
}
try {
  $q=Invoke-WebRequest -Uri 'http://192.168.0.15:3110/' -UseBasicParsing -TimeoutSec 4
  Write-Host ('proxy='+$q.StatusCode)
} catch {
  Write-Host ('proxy_failed='+$_.Exception.Message)
}
$ports='3110','3120','8787','3200','8000','11434','20128','18789','5432','54329','5678'
foreach ($port in $ports) {
  $listening = Get-NetTCPConnection -State Listen -ErrorAction SilentlyContinue | Where-Object { $_.LocalPort -eq [int]$port }
  if ($listening) { Write-Host ("port ${port}=open") } else { Write-Host ("port ${port}=closed") }
}
