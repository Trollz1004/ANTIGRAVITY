#Requires -Version 5.1
<#
.SYNOPSIS
  Live NPC webhook handler stub — receives trigger, assembles context, generates
  response, writes memory back. The complete roundtrip for TRO-93 / TRO-48.

.DESCRIPTION
  Implements the POST /npc/{npc_id}/wake contract from SKILL.md:
  1. Parse incoming agent_wake envelope
  2. Load NPC persona + episodic memory from file store
  3. Generate response (T1: canned pool keyed on event_type + persona traits)
  4. Write memory back via Npc-memory-store.ps1
  5. Return agent_response JSON within budget (≤2s for T1)

  This is the STUB — production replaces step 3 with Ollama/OpenRouter call.
  No Anthropic API. No real-world PII.

.PARAMETER WakeJson
  Path to agent_wake JSON file, or raw JSON string.

.PARAMETER StoreRoot
  Override NPC memory store root (default: examples/).

.OUTPUTS
  agent_response JSON to stdout. Exit 0 on success, 1 on fallback/error.
#>
param(
  [Parameter(Mandatory)][string]$WakeJson,
  [string]$StoreRoot
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$startTime = [System.Diagnostics.Stopwatch]::StartNew()

# --- Load store module ---
$storeScript = Join-Path (Split-Path -Parent $PSScriptRoot) "store\Npc-memory-store.ps1"
. $storeScript

# --- Parse wake payload ---
if (Test-Path -LiteralPath $WakeJson -ErrorAction SilentlyContinue) {
  $wake = Get-Content -LiteralPath $WakeJson -Raw | ConvertFrom-Json
} else {
  $wake = $WakeJson | ConvertFrom-Json
}

$npcId = $wake.npc_id
$wakeId = $wake.wake_id
$tier = $wake.tier
$eventType = $wake.trigger.event_type
$budgetMs = if ($wake.budget.latency_ms) { $wake.budget.latency_ms } else { 2000 }

# --- Load persona state ---
$loaded = Read-NpcMemory -NpcId $npcId -StoreRoot $StoreRoot
$state = $loaded.state
$persona = $state.persona
$relationships = $state.relationships
$episodic = $state.episodic

# --- T1 canned response pool (keyed on event_type + persona traits) ---
$cannedPool = @{
  "npc.spoken_to" = @(
    "Hmm. You again.",
    "Make it quick — tide's turning.",
    "Talk's cheap. What do you need?",
    "I don't repeat myself. Listen the first time."
  )
  "npc.approached" = @(
    "*glances up*",
    "You looking for something?",
    "Don't block the gangway."
  )
  "npc.witnessed" = @(
    "*narrows eyes* Saw that.",
    "I'll remember this."
  )
  "npc.idle_heartbeat" = @(
    "*checks rope knots*",
    "*scans the horizon*"
  )
  "player.enter_zone" = @(
    "*watches from the pier*"
  )
}

# --- Generate response ---
$fallbackUsed = $false
$sayLines = $cannedPool[$eventType]
if (-not $sayLines) { $sayLines = @("...") ; $fallbackUsed = $true }

# Pick line based on relationship score (deterministic for stub)
$relScore = 0.0
if ($relationships) {
  $playerId = $wake.trigger.event_id  # simplified; real impl extracts from trigger payload
  $rel = $relationships | Where-Object { $_.player_id -eq "ply_1001" } | Select-Object -First 1
  if ($rel) { $relScore = [double]$rel.score }
}
$lineIndex = [int]([math]::Floor($relScore * 10)) % $sayLines.Count
$say = $sayLines[$lineIndex]

# Mood delta from event type
$moodDelta = switch ($eventType) {
  "npc.spoken_to" { 0.02 }
  "npc.approached" { 0.01 }
  "npc.witnessed" { -0.05 }
  "npc.affected" { 0.1 }
  default { 0.0 }
}

# --- Build remember entries ---
$rememberEntries = @(
  @{
    kind = "episodic"
    event = "${eventType}_handled"
    actors = @("ply_1001")
    salience = 0.3
    decay_class = "normal"
  }
)

# --- Write memory back ---
$ts = (Get-Date).ToUniversalTime().ToString("o")
$uniqueSuffix = [guid]::NewGuid().ToString("N").Substring(0, 8)
$memoryWrite = @{
  memory_id      = "mem_${wakeId}_${uniqueSuffix}"
  wake_id        = $wakeId
  event_id       = "wb_${uniqueSuffix}_$($wake.trigger.event_id)"
  ts             = $ts
  event          = "${eventType}_handled"
  actors         = @("ply_1001")
  location_id    = "zone.harbor.pier"
  salience       = 0.3
  decay_class    = "normal"
  tags           = @($eventType, "stub", "tro-93")
  embedding_text = "${npcId}: handled ${eventType} from player (stub roundtrip)"
}

$writeResult = Write-NpcMemory -NpcId $npcId -Memory $memoryWrite -StoreRoot $StoreRoot

$elapsed = $startTime.ElapsedMilliseconds

# --- Build agent_response ---
$response = @{
  schema_version = "1.0.0"
  wake_id        = $wakeId
  npc_id         = $npcId
  ok             = $true
  latency_ms     = [int]$elapsed
  say            = $say
  do             = @(@{ action = "emote"; name = "idle" })
  remember       = $rememberEntries
  mood_delta     = $moodDelta
  world_effects  = @()
  fallback_used  = $fallbackUsed
}

# Budget check
if ($elapsed -gt $budgetMs) {
  $response.fallback_used = $true
  Write-Warning "NPC wake exceeded budget: ${elapsed}ms > ${budgetMs}ms"
}

$response | ConvertTo-Json -Depth 10

if ($response.ok) { exit 0 } else { exit 1 }
