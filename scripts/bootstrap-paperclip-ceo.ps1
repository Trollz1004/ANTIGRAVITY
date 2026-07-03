param(
  [switch]$StartupMode
)

$ErrorActionPreference = 'Stop'

$RepoRoot = 'c:\antigravity'
$LogDir = 'c:\antigravity\logs'
$LogFile = Join-Path $LogDir 'paperclip-ceo-bootstrap.log'
$PaperclipLog = Join-Path $LogDir 'paperclip.log'
$PaperclipTunnelLog = Join-Path $LogDir 'paperclip-tunnel.log'
$PowerShellExe = 'C:\Windows\System32\WindowsPowerShell\v1.0\powershell.exe'
$DockerComposeExe = 'C:\Program Files\Docker\Docker\resources\bin\docker-compose.exe'
$DockerExe = 'C:\Program Files\Docker\Docker\resources\bin\docker.exe'
$CloudflaredExe = 'C:\Program Files (x86)\cloudflared\cloudflared.exe'
$PaperclipTunnelConfig = 'c:\antigravity\infra\cloudflare\paperclip-hq.yml'
$StartPaperclipScript = 'c:\antigravity\scripts\start-paperclip.ps1'
$HermesWrapper = 'c:\antigravity\paperclip-adapters\hermes.cmd'
$WslHermesLauncher = 'c:\antigravity\scripts\launch-hermes-paperclip-ceo-wsl.cmd'
$ChromeExe = 'C:\Program Files\Google\Chrome\Application\chrome.exe'
$BootstrapUrls = @(
  'http://localhost:3110',
  'http://127.0.0.1:3000',
  'http://127.0.0.1:9119',
  'http://127.0.0.1:8082/admin',
  'https://paperclip-hq.youandinotai.com',
  'https://mcp.youandinotai.com'
)

function Log($Message) {
  $line = "[{0}] {1}" -f (Get-Date -Format 'yyyy-MM-dd HH:mm:ss'), $Message
  Write-Host $line
  Add-Content -Path $LogFile -Value $line
}

function Wait-DockerReady {
  Log 'Waiting for Docker daemon...'
  $maxWait = 180
  $waited = 0
  while ($waited -lt $maxWait) {
    & $DockerExe info *> $null
    if ($LASTEXITCODE -eq 0) {
      Log "Docker ready after ${waited}s."
      return
    }
    Start-Sleep -Seconds 3
    $waited += 3
  }
  throw "Docker not ready after ${maxWait}s."
}

function MainStackIsAvailable {
  return (Test-Path 'C:\openclaw') -and (Test-Path 'C:\openclaw\.env') -and (Test-Path 'C:\openclaw\Dockerfile')
}

function Ensure-MainStack {
  if (-not (MainStackIsAvailable)) {
    Log 'Main docker stack skipped because C:\openclaw or C:\openclaw\.env is missing.'
    return
  }

  Log 'Starting main docker stack...'
  & $DockerComposeExe -f 'c:\antigravity\docker-compose.yml' up -d 2>&1 | ForEach-Object { Log $_ }
  if ($LASTEXITCODE -ne 0) {
    throw "Main docker stack failed with exit code $LASTEXITCODE."
  }
}

function Ensure-LiteLLMRunning {
  $inspect = & $DockerExe inspect litellm-proxy 2>$null
  if ($LASTEXITCODE -eq 0) {
    $status = & $DockerExe inspect -f '{{.State.Status}}' litellm-proxy 2>$null
    if ($LASTEXITCODE -eq 0 -and $status -eq 'running') {
      Log 'LiteLLM proxy already running.'
      return
    }

    Log 'Starting existing LiteLLM container...'
    & $DockerExe start litellm-proxy 2>&1 | ForEach-Object { Log $_ }
    if ($LASTEXITCODE -ne 0) {
      throw 'Existing LiteLLM container failed to start.'
    }
    return
  }

  Log 'Starting LiteLLM proxy...'
  & $DockerComposeExe -f 'c:\antigravity\docker-compose.litellm.yml' up -d 2>&1 | ForEach-Object { Log $_ }
  if ($LASTEXITCODE -ne 0) {
    throw "LiteLLM proxy failed with exit code $LASTEXITCODE."
  }
}

function Ensure-PaperclipPortAvailable {
  try {
    $healthResponse = Invoke-WebRequest -Uri 'http://127.0.0.1:3110/api/health' -TimeoutSec 2 -UseBasicParsing
    if ($healthResponse.StatusCode -ge 200 -and $healthResponse.StatusCode -lt 500) {
      Log 'Existing canonical Paperclip listener is already healthy.'
      return $false
    }
  }
  catch {
  }

  $listener = Get-NetTCPConnection -LocalPort 3110 -State Listen -ErrorAction SilentlyContinue | Select-Object -First 1
  if ($null -eq $listener) {
    return $true
  }

  $processInfo = Get-CimInstance Win32_Process -Filter ("ProcessId = {0}" -f $listener.OwningProcess) -ErrorAction SilentlyContinue
  if ($null -eq $processInfo) {
    return $true
  }

  $commandLine = [string]$processInfo.CommandLine
  if ($commandLine -like '*c:\antigravity*') {
    Log 'Existing Paperclip listener already belongs to ANTIGRAVITY.'
    return $false
  }

  Log ("Stopping stale Paperclip listener on port 3100: PID {0}" -f $processInfo.ProcessId)
  Stop-Process -Id $processInfo.ProcessId -Force
  Start-Sleep -Seconds 2
  return $true
}

function Ensure-PaperclipRunning {
  if (-not (Ensure-PaperclipPortAvailable)) {
    return
  }

  Log 'Starting Paperclip HQ...'
  Start-Process -FilePath $PowerShellExe -ArgumentList @(
    '-NoExit',
    '-ExecutionPolicy', 'Bypass',
    '-File', $StartPaperclipScript
  ) -WorkingDirectory $RepoRoot -WindowStyle Minimized | Out-Null
}

function Start-PaperclipWithRetry {
  param(
    [int]$Attempts = 2
  )

  for ($attempt = 1; $attempt -le $Attempts; $attempt++) {
    Log ("Paperclip startup attempt {0}/{1}..." -f $attempt, $Attempts)
    Ensure-PaperclipRunning

    for ($i = 0; $i -lt 20; $i++) {
      try {
        $response = Invoke-WebRequest -Uri 'http://127.0.0.1:3110/api/health' -TimeoutSec 3 -UseBasicParsing
        if ($response.StatusCode -ge 200 -and $response.StatusCode -lt 500) {
          Log 'Paperclip is responding.'
          return
        }
      } catch {
      }
      Start-Sleep -Seconds 2
    }

    Log 'Paperclip did not respond during this attempt.'
  }

  Log 'Paperclip did not respond after retry window. Continuing anyway.'
}

function Ensure-PaperclipTunnelRunning {
  $existingTunnel = Get-CimInstance Win32_Process -ErrorAction SilentlyContinue |
    Where-Object { [string]$_.CommandLine -like "*$PaperclipTunnelConfig*" } |
    Select-Object -First 1

  if ($null -ne $existingTunnel) {
    Log 'Paperclip Cloudflare tunnel already running.'
    return
  }

  Log 'Starting Paperclip Cloudflare tunnel...'
  $paperclipTunnelCommand = "& '$CloudflaredExe' tunnel --config '$PaperclipTunnelConfig' run *>> '$PaperclipTunnelLog' 2>&1"
  Start-Process -FilePath $PowerShellExe -ArgumentList @(
    '-NoProfile',
    '-WindowStyle', 'Hidden',
    '-Command', $paperclipTunnelCommand
  ) | Out-Null

  Start-Sleep -Seconds 3
  $existingTunnel = Get-CimInstance Win32_Process -ErrorAction SilentlyContinue |
    Where-Object { [string]$_.CommandLine -like "*$PaperclipTunnelConfig*" } |
    Select-Object -First 1

  if ($null -eq $existingTunnel) {
    Log 'Paperclip Cloudflare tunnel did not stay up on first start attempt.'
  } else {
    Log 'Paperclip Cloudflare tunnel is running.'
  }
}

function Wait-ForPaperclip {
  Log 'Waiting for Paperclip to answer on http://127.0.0.1:3110/api/health...'
  for ($i = 0; $i -lt 30; $i++) {
    try {
      $response = Invoke-WebRequest -Uri 'http://127.0.0.1:3110/api/health' -TimeoutSec 3 -UseBasicParsing
      if ($response.StatusCode -ge 200 -and $response.StatusCode -lt 500) {
        Log 'Paperclip is responding.'
        return
      }
    } catch {
    }
    Start-Sleep -Seconds 2
  }
  Log 'Paperclip did not respond in time. Continuing anyway.'
}

function Start-WSLOrchestration {
  Log 'Opening WSL-first Hermes CEO orchestration window...'
  if (Test-Path $WslHermesLauncher) {
    Start-Process -FilePath 'cmd.exe' -ArgumentList '/k', ('"{0}"' -f $WslHermesLauncher) -WorkingDirectory $RepoRoot | Out-Null
    return
  }

  Log 'WSL launcher missing, falling back to Windows Hermes chat.'
  $command = 'title Hermes Paperclip CEO && cd /d c:\antigravity && "c:\antigravity\paperclip-adapters\hermes.cmd" chat'
  Start-Process -FilePath 'cmd.exe' -ArgumentList '/k', $command -WorkingDirectory $RepoRoot | Out-Null
}

function Open-BrowserTabs {
  Log 'Opening Paperclip URLs in browser...'
  if (Test-Path $ChromeExe) {
    Start-Process -FilePath $ChromeExe -ArgumentList $BootstrapUrls | Out-Null
    return
  }

  foreach ($url in $BootstrapUrls) {
    Start-Process $url | Out-Null
  }
}

New-Item -ItemType Directory -Force -Path $LogDir | Out-Null

try {
  Log '=== Paperclip CEO bootstrap triggered ==='
  Start-PaperclipWithRetry
  Ensure-PaperclipTunnelRunning
  Wait-ForPaperclip
  try {
    Wait-DockerReady
    Ensure-MainStack
    Ensure-LiteLLMRunning
  }
  catch {
    Log "Docker/LiteLLM optional startup skipped: $($_.Exception.Message)"
  }
  & (Join-Path $RepoRoot 'scripts\start-paperclip-hermes.ps1')
  Start-WSLOrchestration
  Open-BrowserTabs
  Log '=== Paperclip CEO bootstrap complete ==='
  Log '  Hermes chat: opens in a new terminal window'
  Log '  Paperclip:   http://localhost:3110'
  Log '  Hermes UI:   http://localhost:3000'
  Log '  Hermes old:  http://localhost:9119 -> :3000'
  Log '  FCC admin:   http://localhost:8082/admin'
  Log '  Public HQ:   https://paperclip-hq.youandinotai.com'
  Log '  MCP:         https://mcp.youandinotai.com'
  Log '  LiteLLM:     http://localhost:11436'
  Log '  Hermes Rtr:  http://localhost:11435'
  Log '  Log file:    c:\antigravity\logs\paperclip-ceo-bootstrap.log'
  exit 0
} catch {
  Log "ERROR: $($_.Exception.Message)"
  exit 1
}

