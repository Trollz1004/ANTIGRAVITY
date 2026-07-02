# OpenClaw Paperclip agent watchdog
# Reads the Paperclip API key from a private local env file, queries only local Paperclip,
# and writes sanitized status. Never prints adapterConfig, headers, tokens, PEM, or env values.

param(
  [string]$BaseUrl = 'http://127.0.0.1:3110',
  [string]$EnvFile = "$env:USERPROFILE\.paperclip\openclaw-ant-support.env",
  [string]$CompanyId = '2f0dfd0a-1dc6-4f25-a93d-55a9b9d5f77c',
  [string]$OutFile = 'C:\antigravity\paperclip-tro\agents\ant-support\agent-watchdog-status.json'
)

$ErrorActionPreference = 'Stop'

function Read-PaperclipKey {
  param([string]$Path)
  if (!(Test-Path -LiteralPath $Path)) { throw "Missing Paperclip env file: $Path" }
  $line = Get-Content -LiteralPath $Path | Where-Object { $_ -match '^PAPERCLIP_API_KEY=' } | Select-Object -First 1
  if (!$line) { throw "PAPERCLIP_API_KEY is not set in $Path" }
  return ($line -replace '^PAPERCLIP_API_KEY=', '').Trim()
}

function Invoke-PaperclipJson {
  param([string]$Uri, [hashtable]$Headers)
  Invoke-RestMethod -Method Get -Uri $Uri -Headers $Headers -TimeoutSec 15
}

$key = Read-PaperclipKey -Path $EnvFile
$headers = @{ Authorization = "Bearer $key" }

$health = Invoke-PaperclipJson -Uri "$BaseUrl/api/health" -Headers $headers
$me = Invoke-PaperclipJson -Uri "$BaseUrl/api/agents/me" -Headers $headers
$dashboard = Invoke-PaperclipJson -Uri "$BaseUrl/api/companies/$CompanyId/dashboard" -Headers $headers
$agentsRaw = Invoke-PaperclipJson -Uri "$BaseUrl/api/companies/$CompanyId/agents" -Headers $headers

$agents = @($agentsRaw) | ForEach-Object {
  [pscustomobject]@{
    id = $_.id
    name = $_.name
    role = $_.role
    title = $_.title
    status = $_.status
    urlKey = $_.urlKey
    lastHeartbeatAt = $_.lastHeartbeatAt
    reportsTo = $_.reportsTo
    heartbeatEnabled = [bool]($_.runtimeConfig -and $_.runtimeConfig.heartbeat -and $_.runtimeConfig.heartbeat.enabled)
  }
}

$staleCutoff = (Get-Date).ToUniversalTime().AddMinutes(-30)
$problemAgents = $agents | Where-Object {
  $_.status -in @('error','paused') -or
  ($_.heartbeatEnabled -and (!$_.lastHeartbeatAt -or ([datetime]$_.lastHeartbeatAt).ToUniversalTime() -lt $staleCutoff))
}

$result = [pscustomobject]@{
  checkedAt = (Get-Date).ToUniversalTime().ToString('o')
  health = @{ ok = $health.ok; status = $health.status }
  me = @{ id = $me.id; name = $me.name; role = $me.role; status = $me.status }
  dashboard = @{
    agents = $dashboard.agents
    tasks = $dashboard.tasks
    pendingApprovals = $dashboard.pendingApprovals
  }
  problemAgents = @($problemAgents | Select-Object id,name,role,title,status,urlKey,lastHeartbeatAt,heartbeatEnabled)
  recommendations = @(
    if ($problemAgents) { 'Review error/paused/stale agents in Paperclip HQ; switch providers or wake agents when safe.' }
    if ($dashboard.tasks.open -gt 0 -and $dashboard.tasks.inProgress -eq 0) { 'There is open work and no in-progress work; OpenClaw should pick/triage or delegate the next safe task.' }
    if ($dashboard.tasks.blocked -gt 0) { 'Blocked tasks exist; inspect blockers and route unblock decisions to CEO/board when needed.' }
  )
}

$dir = Split-Path -Parent $OutFile
if (!(Test-Path -LiteralPath $dir)) { New-Item -ItemType Directory -Force -Path $dir | Out-Null }
$result | ConvertTo-Json -Depth 8 | Set-Content -LiteralPath $OutFile -Encoding UTF8
$result | ConvertTo-Json -Depth 8
