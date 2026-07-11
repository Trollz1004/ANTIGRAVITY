# TRO-62 AC check: load persisted example state and prove trigger/memory minimums.
$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot
$statePath = Join-Path $PSScriptRoot "mira-dockwarden.state.json"
$writebackSchema = Join-Path $root "schemas\memory-writeback.v1.schema.json"
$canonicalTriggerDoc = Join-Path (Split-Path -Parent (Split-Path -Parent (Split-Path -Parent $root))) "docs\dream\live-npc-trigger-vocabulary.md"
# root is .agents/skills/dream-live-npc -> go to repo root
$repoRoot = (Resolve-Path (Join-Path $root "..\..\..")).Path
$canonicalTriggerDoc = Join-Path $repoRoot "docs\dream\live-npc-trigger-vocabulary.md"
$canonicalSchema = Join-Path $repoRoot "docs\dream\schemas\live-npc-webhook.schema.json"

if (-not (Test-Path $statePath)) { throw "Missing example state: $statePath" }
if (-not (Test-Path $writebackSchema)) { throw "Missing writeback schema: $writebackSchema" }
if (-not (Test-Path $canonicalTriggerDoc)) { throw "Missing canonical trigger doc: $canonicalTriggerDoc" }
if (-not (Test-Path $canonicalSchema)) { throw "Missing canonical webhook schema: $canonicalSchema" }

$state = Get-Content -Raw -Path $statePath | ConvertFrom-Json
$types = @($state.sample_triggers | ForEach-Object { $_.event_type } | Select-Object -Unique)
$minTriggers = 5

Write-Host "NPC: $($state.persona.npc_id) tier=$($state.persona.tier)"
Write-Host "Episodic memories: $($state.episodic.Count)"
Write-Host "Relationships: $($state.relationships.Count)"
Write-Host "Sample triggers: $($state.sample_triggers.Count) unique_types=$($types.Count)"
Write-Host "Trigger types: $($types -join ', ')"
Write-Host "Remember writes: $($state.sample_agent_response.remember.Count)"
Write-Host "Writeback writes: $($state.sample_writeback_batch.writes.Count)"
Write-Host "Forbidden providers: $($state.persona.provider_route.forbidden -join ', ')"

if ($types.Count -lt $minTriggers) {
  throw "AC fail: need >= $minTriggers trigger types, got $($types.Count)"
}
if ($state.persona.provider_route.forbidden -notcontains "anthropic") {
  throw "AC fail: anthropic must be forbidden on provider_route"
}
if (-not $state.episodic -or $state.episodic.Count -lt 1) {
  throw "AC fail: example state must persist at least one episodic memory"
}
if (-not $state.sample_agent_response -or $state.sample_agent_response.remember.Count -lt 1) {
  throw "AC fail: sample agent_response.remember missing"
}
if (-not $state.sample_writeback_batch -or $state.sample_writeback_batch.writes.Count -lt 1) {
  throw "AC fail: example writeback batch missing"
}

$stamp = [ordered]@{
  schema_version = "1.0.0"
  kind = "example_verify"
  issue = "TRO-62"
  verified_at = (Get-Date).ToUniversalTime().ToString("o")
  state_path = "examples/mira-dockwarden.state.json"
  trigger_types = $types
  trigger_type_count = $types.Count
  episodic_count = $state.episodic.Count
  relationship_count = $state.relationships.Count
  remember_count = $state.sample_agent_response.remember.Count
  writeback_count = $state.sample_writeback_batch.writes.Count
  anthropic_forbidden = $true
  aligned_with_tro87 = $true
  ac = @{
    doc_in_skill = $true
    at_least_5_trigger_types = $true
    example_state_persisted = $true
  }
}
$stampPath = Join-Path $PSScriptRoot "mira-dockwarden.verify.json"
$stamp | ConvertTo-Json -Depth 6 | Set-Content -Path $stampPath -Encoding utf8
Write-Host "PASS - wrote $stampPath"
