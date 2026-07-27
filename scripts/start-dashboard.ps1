$ErrorActionPreference='Continue'
$logDir='E:\ANTIGRAVITY\logs'; New-Item -ItemType Directory -Force -Path $logDir | Out-Null
$log=Join-Path $logDir 'dashboard.log'
function L($m){ Add-Content -Path $log -Value ("[{0}] {1}" -f (Get-Date -Format 'o'), $m) -Encoding utf8 }
L 'starting dashboard'
$node = Join-Path $env:ProgramFiles 'nodejs\node.exe'
if (-not (Test-Path $node)) { $node = 'node' }
Start-Process -FilePath $node -ArgumentList 'E:\ANTIGRAVITY\dashboard\server.js' -WindowStyle Hidden
for($i=0;$i -lt 30;$i++){ Start-Sleep -Seconds 2; try { $r=Invoke-WebRequest -Uri 'http://127.0.0.1:5678/' -TimeoutSec 3 -UseBasicParsing; if($r.StatusCode -ge 200){ L 'dashboard ready'; exit 0 } } catch {} }
L 'dashboard did not come up in time'; exit 1
