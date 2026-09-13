<#
.SYNOPSIS
  Self-healing supervisor for the DREAM stack on the Alienware node.

.DESCRIPTION
  Starts and watches every local service (JARVIS HUD :9150, Hermes dashboard :9119, Ollama :11434,
  Live NPC Lab :9127, DreamOps Bridge :9133), probes the Sabertooth services (OmniRoute, Sentry,
  Mission Control), restarts what dies (five restarts per ten minutes, then back-off), writes each
  service's output to %LOCALAPPDATA%\dream-stack\logs, and never exits on an error. Every probe is an
  identity check, not a port check.

  Run it from a plain shell, never from inside a Claude Code terminal:
    .\scripts\dream-stack.ps1            # supervise forever (Ctrl+C stops it)
    .\scripts\dream-stack.ps1 -Once      # one health pass, print the table
    .\scripts\dream-stack.ps1 -Install   # logon Scheduled Task "DREAM Stack" (console stays open)
    .\scripts\dream-stack.ps1 -Uninstall

.NOTES
  Paths come from the repo location and environment variables (DREAM_ROOT, LOCALAPPDATA); nothing
  personal is hard-coded. Tests: Invoke-Pester -Path .\scripts\dream-stack.Tests.ps1
#>
[CmdletBinding()]
param(
  [switch]$Once,
  [switch]$Status,
  [int]$Interval = 30,
  [switch]$Install,
  [switch]$Uninstall,
  [switch]$NoMain
)

$script:RestartCap = 5
$script:RestartWindowSeconds = 600
$script:ProbeTimeoutSeconds = 4
$script:TaskName = 'DREAM Stack'

function Get-StackRoot { Split-Path -Parent (Split-Path -Parent $PSCommandPath) }

function Get-DreamRoot {
  if ($env:DREAM_ROOT -and (Test-Path $env:DREAM_ROOT)) { return $env:DREAM_ROOT }
  Join-Path (Split-Path -Parent (Get-StackRoot)) 'dream-online'
}

function Get-LogDir {
  $d = Join-Path $env:LOCALAPPDATA 'dream-stack\logs'
  if (-not (Test-Path $d)) { New-Item -ItemType Directory -Force -Path $d | Out-Null }
  $d
}

function Write-StackLog([string]$Message) {
  $line = "{0} {1}" -f (Get-Date -Format 'yyyy-MM-dd HH:mm:ss'), $Message
  Write-Host $line
  try { Add-Content -Path (Join-Path (Get-LogDir) 'dream-stack.log') -Value $line } catch {}
}

function Get-StackServices {
  $repo = Get-StackRoot
  $dream = Get-DreamRoot
  $hermes = Join-Path $env:LOCALAPPDATA 'hermes\bin\hermes.exe'
  $ollama = Join-Path $env:LOCALAPPDATA 'Programs\Ollama\ollama.exe'
  $node = 'node'
  $S = '192.168.0.8'
  @(
    [pscustomobject]@{ Name = 'jarvis'; Label = 'JARVIS HUD'; Url = 'http://127.0.0.1:9150/health'; Managed = $true
      Start = @{ File = $node; Args = 'server.mjs'; Cwd = (Join-Path $repo 'dashboard\jarvis') }
      Identity = { param($s, $b) $s -eq 200 -and $b -match '"service"\s*:\s*"airi-dashboard"' } }
    [pscustomobject]@{ Name = 'hermes-dashboard'; Label = 'Hermes dashboard'; Url = 'http://127.0.0.1:9119/api/health'; Managed = $true
      Start = @{ File = $hermes; Args = 'dashboard --no-open --skip-build'; Cwd = (Join-Path $env:LOCALAPPDATA 'hermes') }
      Identity = { param($s, $b) $s -eq 200 -and $b -match '"ok"\s*:\s*true' } }
    [pscustomobject]@{ Name = 'ollama'; Label = 'Ollama (Vulkan)'; Url = 'http://127.0.0.1:11434/api/tags'; Managed = $true
      Start = @{ File = $ollama; Args = 'serve'; Cwd = $env:LOCALAPPDATA }
      Identity = { param($s, $b) $s -eq 200 -and $b -match '"models"\s*:\s*\[' } }
    [pscustomobject]@{ Name = 'live-npc-lab'; Label = 'Dream Live NPC Lab'; Url = 'http://127.0.0.1:9127/health'; Managed = $true
      Start = @{ File = $node; Args = 'src/server.js'; Cwd = (Join-Path $dream 'game\server\live-npc-lab') }
      Identity = { param($s, $b) $s -eq 200 -and $b -match 'npc' } }
    [pscustomobject]@{ Name = 'dreamops'; Label = 'DreamOps Bridge'; Url = 'http://127.0.0.1:9133/health'; Managed = $true
      Start = @{ File = $node; Args = 'src/server.js'; Cwd = (Join-Path $dream 'game\server\dreamops-bridge') }
      Identity = { param($s, $b) $s -eq 200 -and $b.Trim().StartsWith('{') } }
    [pscustomobject]@{ Name = 'omniroute'; Label = 'OmniRoute (Sabertooth)'; Url = "http://$S`:20128/v1/models"; Managed = $false; Start = $null
      Identity = { param($s, $b) $s -eq 401 -or $s -eq 403 -or ($s -eq 200 -and $b -match '"data"\s*:\s*\[') } }
    [pscustomobject]@{ Name = 'sentry'; Label = "Fable's Sentry (Sabertooth)"; Url = "http://$S`:9140/api/status"; Managed = $false; Start = $null
      Identity = { param($s, $b) $s -eq 200 -and $b.Trim().StartsWith('{') } }
    [pscustomobject]@{ Name = 'mission-control'; Label = 'Mission Control (Sabertooth)'; Url = "http://$S`:3151/"; Managed = $false; Start = $null
      Identity = { param($s, $b) $s -eq 200 -and $b.Length -gt 0 } }
  )
}

# Default probe: status code + body, with a short timeout; an HTTP error still yields its status code.
function Invoke-StackFetch([string]$Url) {
  try {
    $r = Invoke-WebRequest -UseBasicParsing -Uri $Url -TimeoutSec $script:ProbeTimeoutSeconds -Headers @{ Accept = 'application/json, text/html' }
    return @{ Status = [int]$r.StatusCode; Body = [string]$r.Content }
  } catch {
    $resp = $_.Exception.Response
    if ($resp -and $resp.StatusCode) { return @{ Status = [int]$resp.StatusCode; Body = '' } }
    throw
  }
}

function Test-ServiceHealth {
  param([Parameter(Mandatory)]$Service, [scriptblock]$Fetch = { param($u) Invoke-StackFetch $u })
  $sw = [Diagnostics.Stopwatch]::StartNew()
  try {
    $r = & $Fetch $Service.Url
    $sw.Stop()
    $ok = [bool](& $Service.Identity ([int]$r.Status) ([string]$r.Body))
    $state = if ($ok) { 'UP' } elseif ([int]$r.Status -ge 500) { 'DOWN' } else { 'WRONG SERVICE' }
    $detail = if ($ok) { 'identity ok' } else { "HTTP $($r.Status) answered but the identity check failed" }
    return [pscustomobject]@{ Name = $Service.Name; Label = $Service.Label; State = $state; Detail = $detail; LatencyMs = [int]$sw.ElapsedMilliseconds; Managed = $Service.Managed }
  } catch {
    $sw.Stop()
    return [pscustomobject]@{ Name = $Service.Name; Label = $Service.Label; State = 'DOWN'; Detail = [string]$_.Exception.Message; LatencyMs = [int]$sw.ElapsedMilliseconds; Managed = $Service.Managed }
  }
}

function Get-HealAction {
  param([string]$State, [bool]$Managed, [int]$RecentRestarts)
  if ($State -eq 'UP') { return 'none' }
  if (-not $Managed) { return 'report' }
  if ($RecentRestarts -ge $script:RestartCap) { return 'backoff' }
  'start'
}

$script:Restarts = @{}   # name -> list of restart timestamps
$script:Children = @{}   # name -> process

function Get-RecentRestartCount([string]$Name) {
  $cutoff = (Get-Date).AddSeconds(-$script:RestartWindowSeconds)
  $list = @($script:Restarts[$Name] | Where-Object { $_ -gt $cutoff })
  $script:Restarts[$Name] = $list
  $list.Count
}

function Start-StackService($Service) {
  $st = $Service.Start
  if (-not $st) { return $false }
  if (-not (Test-Path $st.Cwd)) { Write-StackLog "[$($Service.Name)] cannot start: folder missing $($st.Cwd)"; return $false }
  $file = $st.File
  if ($file -ne 'node' -and -not (Test-Path $file)) { Write-StackLog "[$($Service.Name)] cannot start: binary missing $file"; return $false }
  $logs = Get-LogDir
  # Children must not inherit a Claude Code terminal's nested-launch guard.
  Remove-Item Env:CLAUDECODE -ErrorAction SilentlyContinue
  Remove-Item Env:CLAUDE_CODE_ENTRYPOINT -ErrorAction SilentlyContinue
  $p = Start-Process -FilePath $file -ArgumentList $st.Args -WorkingDirectory $st.Cwd -WindowStyle Hidden -PassThru `
        -RedirectStandardOutput (Join-Path $logs "$($Service.Name).out.log") -RedirectStandardError (Join-Path $logs "$($Service.Name).err.log")
  $script:Children[$Service.Name] = $p
  $script:Restarts[$Service.Name] = @($script:Restarts[$Service.Name]) + (Get-Date)
  Write-StackLog "[$($Service.Name)] started pid $($p.Id): $file $($st.Args) (cwd $($st.Cwd))"
  $true
}

function Invoke-HealPass([switch]$NoHeal) {
  $results = @()
  foreach ($svc in Get-StackServices) {
    $h = Test-ServiceHealth -Service $svc
    $action = if ($NoHeal) { 'none' } else { Get-HealAction -State $h.State -Managed $svc.Managed -RecentRestarts (Get-RecentRestartCount $svc.Name) }
    if ($action -eq 'start') { [void](Start-StackService $svc) }
    elseif ($action -eq 'backoff') { Write-StackLog "[$($svc.Name)] DOWN and restarted $script:RestartCap times in $($script:RestartWindowSeconds)s; backing off" }
    $results += [pscustomobject]@{ Service = $h.Label; State = $h.State; Ms = $h.LatencyMs; Action = $action; Detail = $h.Detail }
  }
  $results
}

function Show-HealPass($results) {
  $stamp = Get-Date -Format 'HH:mm:ss'
  Write-Host "`n== DREAM stack health $stamp ==" -ForegroundColor Cyan
  foreach ($r in $results) {
    $color = switch ($r.State) { 'UP' { 'Green' } 'WRONG SERVICE' { 'Yellow' } default { 'Red' } }
    Write-Host ("  {0,-30} " -f $r.Service) -NoNewline
    Write-Host ("{0,-14}" -f $r.State) -ForegroundColor $color -NoNewline
    Write-Host ("{0,6} ms  {1,-8} {2}" -f $r.Ms, $r.Action, $r.Detail)
  }
  $up = @($results | Where-Object State -eq 'UP').Count
  Write-Host ("  {0}/{1} up" -f $up, $results.Count)
}

function Install-StackTask {
  $cmd = Join-Path (Get-StackRoot) 'scripts\dream-stack.cmd'
  $action = New-ScheduledTaskAction -Execute 'cmd.exe' -Argument "/k `"$cmd`""
  $trigger = New-ScheduledTaskTrigger -AtLogOn -User $env:USERNAME
  $settings = New-ScheduledTaskSettingsSet -ExecutionTimeLimit ([TimeSpan]::Zero) -RestartCount 99 -RestartInterval (New-TimeSpan -Minutes 1) -StartWhenAvailable -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries
  Register-ScheduledTask -TaskName $script:TaskName -Action $action -Trigger $trigger -Settings $settings -Force | Out-Null
  Write-StackLog "Scheduled Task '$($script:TaskName)' registered: at logon, cmd /k $cmd (console stays open)"
}

function Uninstall-StackTask {
  Unregister-ScheduledTask -TaskName $script:TaskName -Confirm:$false -ErrorAction SilentlyContinue
  Write-StackLog "Scheduled Task '$($script:TaskName)' removed"
}

function Invoke-StackMain {
  if ($Install) { Install-StackTask; return }
  if ($Uninstall) { Uninstall-StackTask; return }
  if ($Once -or $Status) { Show-HealPass (Invoke-HealPass); return }
  Write-StackLog "DREAM stack supervisor started (interval ${Interval}s, logs in $(Get-LogDir)). Ctrl+C stops it."
  while ($true) {
    try { Show-HealPass (Invoke-HealPass) }
    catch { Write-StackLog "heal pass error (supervisor keeps running): $($_.Exception.Message)" }
    Start-Sleep -Seconds $Interval
  }
}

if (-not $NoMain) { Invoke-StackMain }
