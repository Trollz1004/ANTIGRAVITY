$ErrorActionPreference = 'Stop'

$configPath = 'E:\clean\.paperclip-laptop\instances\default\config.json'
$paperclipCmd = 'C:\Users\joshl\AppData\Roaming\npm\paperclipai.cmd'

'== Paperclip clean restart on T5500 =='

if (-not (Test-Path -LiteralPath $configPath)) {
  throw "Missing Paperclip config: $configPath"
}

$listeners = Get-NetTCPConnection -LocalPort 3120 -State Listen -ErrorAction SilentlyContinue
if ($listeners) {
  'Existing Paperclip listener(s) on 3120:'
  foreach ($listener in $listeners) {
    $proc = Get-CimInstance Win32_Process -Filter "ProcessId=$($listener.OwningProcess)"
    [PSCustomObject]@{
      PID = $proc.ProcessId
      Name = $proc.Name
      Path = $proc.ExecutablePath
      CommandLine = $proc.CommandLine
    } | Format-List
  }
  'Not starting another Paperclip because 3120 is already listening.'
} else {
  if (Test-Path -LiteralPath $paperclipCmd) {
    Start-Process -FilePath $paperclipCmd -ArgumentList @('run', '--config', $configPath) -WorkingDirectory 'E:\clean'
  } else {
    Start-Process -FilePath 'paperclipai' -ArgumentList @('run', '--config', $configPath) -WorkingDirectory 'E:\clean'
  }
  Start-Sleep -Seconds 8
}

'== Local origin health =='
try {
  $local = Invoke-WebRequest -Uri 'http://127.0.0.1:3120/api/health' -UseBasicParsing -TimeoutSec 10
  "local 3120 HTTP $($local.StatusCode)"
  $local.Content
} catch {
  "local 3120 FAILED: $($_.Exception.Message)"
}

'== Public tunnel health =='
try {
  $public = Invoke-WebRequest -Uri 'https://paperclip-clean.youandinotai.com/api/health' -UseBasicParsing -TimeoutSec 15
  "public HTTP $($public.StatusCode)"
  $public.Content
} catch {
  "public health FAILED: $($_.Exception.Message)"
}

'== Port contract reminder =='
'3120 Paperclip clean origin'
'20128 OmniRoute API'
'9119 Hermes dashboard only'
'18789 OpenClaw gateway only'
