param(
  [string]$Root = 'C:\antigravity-paperclip-dateapp-ops',
  [string]$CompanyId = '02b444c8-cdb7-40e5-b623-230d22c50f1c',
  [string]$ApiBase = 'http://127.0.0.1:3100'
)
$ErrorActionPreference = 'Stop'
$loader = Join-Path $Root 'scripts\load-fcc-provider-env.ps1'
if (Test-Path -LiteralPath $loader) { & $loader -Quiet | Out-Null }
$manifestPath = Join-Path $Root 'paperclip\agents.json'
if (-not (Test-Path -LiteralPath $manifestPath)) { throw "agents manifest missing: $manifestPath" }
$manifest = Get-Content -Raw -LiteralPath $manifestPath | ConvertFrom-Json
$agentUrl = "$ApiBase/api/companies/$CompanyId/agents"
$logDir = Join-Path $Root 'logs'
New-Item -ItemType Directory -Force -Path $logDir | Out-Null
$log = Join-Path $logDir 'paperclip-provider-agent-sync.log'
function Write-SyncLog([string]$Message) {
  "[$(Get-Date -Format o)] $Message" | Add-Content -LiteralPath $log -Encoding utf8
}
function Get-Role([string]$Role, [string]$Id) {
  switch ($Id) {
    'date-app-ux' { return 'designer' }
    default {}
  }
  switch ($Role) {
    'designer' { 'designer' }
    'support' { 'general' }
    'reviewer' { 'general' }
    'operator' { 'general' }
    'memory' { 'general' }
    'auth' { 'general' }
    'researcher' { 'general' }
    'worker' { 'general' }
    'ceo' { 'devops' }
    default { 'general' }
  }
}
function Get-CurrentAgents {
  try {
    $result = Invoke-RestMethod -Uri $agentUrl -Method GET -TimeoutSec 12
    if ($null -eq $result) { return @() }
    return @($result)
  } catch {
    Write-SyncLog "failed to list agents: $($_.Exception.Message)"
    throw
  }
}
$current = Get-CurrentAgents
$codexCeo = $current | Where-Object { $_.name -eq 'Codex CEO' } | Select-Object -First 1
if (-not $codexCeo) {
  $codexManifest = $manifest | Where-Object { $_.id -eq 'codex-ceo' } | Select-Object -First 1
  $body = [ordered]@{
    name = 'Codex CEO'
    role = 'devops'
    title = 'Codex CEO'
    capabilities = $codexManifest.scope
    adapterType = 'codex_local'
    adapterConfig = [ordered]@{ mode = ''; model = ''; cwd = $Root; instructionsEntryFile = 'agents/codex-ceo/SOUL.md'; instructionsBundleMode = 'managed' }
    runtimeConfig = [ordered]@{ heartbeat = [ordered]@{ enabled = $true; wakeOnDemand = $true } }
  }
  $created = Invoke-RestMethod -Uri $agentUrl -Method POST -ContentType 'application/json' -Body ($body | ConvertTo-Json -Depth 12) -TimeoutSec 20
  Write-SyncLog "created Codex CEO: $($created.id)"
  $current = Get-CurrentAgents
  $codexCeo = $current | Where-Object { $_.name -eq 'Codex CEO' } | Select-Object -First 1
}
$reportsTo = if ($codexCeo) { $codexCeo.id } else { $null }
$createdCount = 0
$skippedCount = 0
foreach ($agent in $manifest) {
  $existing = $current | Where-Object { $_.name -eq $agent.name } | Select-Object -First 1
  if ($existing) {
    Write-SyncLog "skip existing: $($agent.name) id=$($existing.id)"
    $skippedCount++
    continue
  }
  $model = ''
  if ($agent.model) { $model = [string]$agent.model }
  if ([string]$agent.adapter -eq 'process' -and $model) {
    $adapterConfig = [ordered]@{
      tools = @('opencode','fcc-provider-env','heartbeat')
      command = 'opencode'
      args = @('run','-m',$model)
      model = $model
      cwd = $Root
      envLoader = 'C:\antigravity-paperclip-dateapp-ops\scripts\load-fcc-provider-env.ps1'
      envPath = 'C:\Users\joshl\.fcc\.env'
      instructionRoot = "agents/$($agent.id)"
      instructionsEntryFile = "agents/$($agent.id)/SOUL.md"
      instructionsBundleMode = 'managed'
    }
  } else {
    $adapterConfig = [ordered]@{
      mode = ''
      model = $model
      cwd = $Root
      instructionsEntryFile = "agents/$($agent.id)/SOUL.md"
      instructionsBundleMode = 'managed'
    }
  }
  if ($agent.display_model) { $adapterConfig.displayModel = [string]$agent.display_model }
  $body = [ordered]@{
    name = [string]$agent.name
    role = (Get-Role ([string]$agent.role) ([string]$agent.id))
    title = [string]$agent.name
    capabilities = [string]$agent.scope
    adapterType = [string]$agent.adapter
    adapterConfig = $adapterConfig
    runtimeConfig = [ordered]@{ heartbeat = [ordered]@{ enabled = $true; wakeOnDemand = $true; logPath = [string]$agent.heartbeat_log } }
    metadata = [ordered]@{ manifestId = [string]$agent.id; decisionAuthority = [string]$agent.decision_authority; memory = [string]$agent.memory; displayModel = [string]$agent.display_model }
  }
  if ($agent.id -ne 'codex-ceo' -and $reportsTo) { $body.reportsTo = $reportsTo }
  try {
    $created = Invoke-RestMethod -Uri $agentUrl -Method POST -ContentType 'application/json' -Body ($body | ConvertTo-Json -Depth 12) -TimeoutSec 20
    Write-SyncLog "created: $($agent.name) id=$($created.id) adapter=$($agent.adapter) model=$model"
    $createdCount++
  } catch {
    Write-SyncLog "create failed: $($agent.name): $($_.Exception.Message)"
    if ($_.ErrorDetails.Message) { Write-SyncLog "details: $($_.ErrorDetails.Message)" }
  }
}
Write-Output "created=$createdCount skipped=$skippedCount log=$log"

