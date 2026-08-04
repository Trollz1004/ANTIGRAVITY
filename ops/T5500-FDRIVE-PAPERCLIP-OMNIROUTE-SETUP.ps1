$ErrorActionPreference = 'Continue'

$repoRoot = 'F:\ANTIGRAVITY'
$paperclipConfig = Join-Path $repoRoot '.paperclip-laptop\instances\default\config.json'
$paperclipCmd = 'C:\Users\joshl\AppData\Roaming\npm\paperclipai.cmd'

'== T5500 F-drive runtime setup =='
"Repo root: $repoRoot"

if (-not (Test-Path -LiteralPath $repoRoot)) {
  throw "Repo root missing: $repoRoot"
}

'== OmniRoute =='
'Canonical OmniRoute base URL for all agents: http://192.168.0.15:20128/api/v1'
try {
  $headers = @{}
  if ($env:OMNIROUTE_API_KEY) { $headers.Authorization = "Bearer $env:OMNIROUTE_API_KEY" }
  $r = Invoke-WebRequest -Uri 'http://192.168.0.15:20128/api/v1/models' -Headers $headers -UseBasicParsing -TimeoutSec 8
  "OmniRoute local models HTTP $($r.StatusCode)"
} catch {
  "OmniRoute local models check failed: $($_.Exception.Message)"
}

'== Paperclip origin =='
if (-not (Test-Path -LiteralPath $paperclipConfig)) {
  'Paperclip config not found under F:\ANTIGRAVITY. If moving from E:\clean, copy or regenerate .paperclip-laptop before starting Paperclip.'
  "Expected: $paperclipConfig"
} else {
  $listener = Get-NetTCPConnection -LocalPort 3120 -State Listen -ErrorAction SilentlyContinue
  if ($listener) {
    'Paperclip already listening on 3120.'
  } else {
    if (Test-Path -LiteralPath $paperclipCmd) {
      Start-Process -FilePath $paperclipCmd -ArgumentList @('run', '--config', $paperclipConfig) -WorkingDirectory $repoRoot
    } else {
      Start-Process -FilePath 'paperclipai' -ArgumentList @('run', '--config', $paperclipConfig) -WorkingDirectory $repoRoot
    }
    Start-Sleep -Seconds 8
  }
}

'== Port owners =='
foreach ($port in @(3120, 20128, 3151, 8082, 9119, 18789, 11434)) {
  $listeners = Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue
  if (-not $listeners) { "port ${port}: no listener"; continue }
  foreach ($listener in $listeners) {
    $proc = Get-CimInstance Win32_Process -Filter "ProcessId=$($listener.OwningProcess)"
    [PSCustomObject]@{ Port=$port; PID=$proc.ProcessId; Name=$proc.Name; CommandLine=$proc.CommandLine } | Format-List
  }
}

'== Health checks =='
foreach ($url in @(
  'http://127.0.0.1:3120/api/health',
  'https://paperclip-clean.youandinotai.com/api/health',
  'http://192.168.0.15:20128/home',
  'http://127.0.0.1:3151',
  'http://127.0.0.1:9119',
  'http://127.0.0.1:18789'
)) {
  try {
    $r = Invoke-WebRequest -Uri $url -UseBasicParsing -TimeoutSec 8
    "$url HTTP $($r.StatusCode)"
  } catch {
    "${url} FAILED: $($_.Exception.Message)"
  }
}

'== Rules =='
'Use Paperclip as canonical public/control surface if it is healthy: https://paperclip-clean.youandinotai.com'
'Mission Control :3151 is private LAN/local only; do not expose publicly without auth.'
'OpenClaw belongs on 18789, never 9119.'
'Hermes dashboard owns 9119.'
'Paperclip opencode_local adapters should use baseURL http://192.168.0.15:20128/api/v1.'
'Target model is ollama/ornith:9b after ollama pull ornith:9b; fallback is ollama/qwen2.5:7b.'
