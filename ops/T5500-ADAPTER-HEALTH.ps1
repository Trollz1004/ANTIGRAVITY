$ErrorActionPreference = 'Continue'

$ports = @(3120, 9119, 18789, 20128)

'== T5500 port owners =='
foreach ($port in $ports) {
  $listeners = Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue
  if (-not $listeners) {
    "port ${port}: no listener"
    continue
  }

  foreach ($listener in $listeners) {
    $proc = Get-CimInstance Win32_Process -Filter "ProcessId=$($listener.OwningProcess)"
    [PSCustomObject]@{
      Port = $port
      PID = $proc.ProcessId
      Name = $proc.Name
      Path = $proc.ExecutablePath
      CommandLine = $proc.CommandLine
    } | Format-List
  }
}

'== HTTP health =='
$checks = @(
  'https://paperclip-clean.youandinotai.com/api/health',
  'http://192.168.0.15:20128/api/v1/models'
)

foreach ($url in $checks) {
  try {
    $headers = @{}
    if ($url -like '*20128*' -and $env:OMNIROUTE_API_KEY) {
      $headers.Authorization = "Bearer $env:OMNIROUTE_API_KEY"
    }
    $response = Invoke-WebRequest -Uri $url -Headers $headers -UseBasicParsing -TimeoutSec 8
    "$url HTTP $($response.StatusCode)"
  } catch {
    "${url} FAILED: $($_.Exception.Message)"
  }
}

'== Expected ownership =='
'3120  Paperclip clean origin'
'9119  Hermes dashboard GUI only'
'18789 OpenClaw gateway only'
'20128 OmniRoute API for Paperclip OpenCode agents'

'== Do not do =='
'Do not bind OpenClaw to 9119.'
'Do not point Paperclip OpenClaw adapter URLs at 9119.'
'Do not route Claude Code through OmniRoute.'
