#Requires -Version 5.1
<#
.SYNOPSIS
  Minimal file-backed NPC memory artifact store (TRO-126).

.DESCRIPTION
  Persona state lives in one JSON artifact per NPC under a store root.
  Provides Write-NpcMemory (append/idempotent episodic) and Read-NpcMemory.
  Target production backends (Qdrant/Postgres) are out of scope; this is the
  prototype path called for by TRO-126 / WRITEBACK-CONTRACT "dev file snapshot".

.NOTES
  Schema aligns with MEMORY-SCHEMA.md and memory-writeback.v1.schema.json.
  No Anthropic. No real-world PII — game IDs only.
#>

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

function Get-NpcMemoryStoreRoot {
  param(
    [string]$StoreRoot
  )
  if ($StoreRoot) { return (Resolve-Path -LiteralPath $StoreRoot).Path }
  # Default: skill examples/ as bootstrap store for Mira demo
  $skillRoot = Split-Path -Parent $PSScriptRoot
  return (Join-Path $skillRoot "examples")
}

function Get-NpcMemoryArtifactPath {
  param(
    [Parameter(Mandatory)][string]$NpcId,
    [string]$StoreRoot
  )
  $root = Get-NpcMemoryStoreRoot -StoreRoot $StoreRoot
  # Prefer known bootstrap path for mira; otherwise derive safe filename
  $known = Join-Path $root "mira-dockwarden.state.json"
  if ($NpcId -eq "npc.mira.dockwarden" -and (Test-Path -LiteralPath $known)) {
    return $known
  }
  $safe = ($NpcId -replace '[^a-zA-Z0-9._-]', '_')
  $path = Join-Path $root "$safe.state.json"
  return $path
}

function Read-NpcMemory {
  <#
  .SYNOPSIS
    Read persona state artifact for an NPC.
  .OUTPUTS
    PSCustomObject state (persona, episodic, relationships, ...)
  #>
  param(
    [Parameter(Mandatory)][string]$NpcId,
    [string]$StoreRoot
  )
  $path = Get-NpcMemoryArtifactPath -NpcId $NpcId -StoreRoot $StoreRoot
  if (-not (Test-Path -LiteralPath $path)) {
    throw "NPC memory artifact not found for npc_id=$NpcId path=$path"
  }
  $raw = Get-Content -LiteralPath $path -Raw -Encoding UTF8
  $state = $raw | ConvertFrom-Json
  if ($state.persona -and $state.persona.npc_id -and $state.persona.npc_id -ne $NpcId) {
    throw "Artifact npc_id mismatch: expected=$NpcId got=$($state.persona.npc_id)"
  }
  return [pscustomobject]@{
    path  = $path
    state = $state
  }
}

function Write-NpcMemory {
  <#
  .SYNOPSIS
    Append an episodic memory row (idempotent by memory_id or event_id).
  .DESCRIPTION
    Expands a remember-style write into a durable episodic row and persists
    it into the NPC's JSON artifact. Replays of the same memory_id/event_id
    do not double-insert.
  #>
  param(
    [Parameter(Mandatory)][string]$NpcId,
    [Parameter(Mandatory)][hashtable]$Memory,
    [string]$StoreRoot
  )

  $loaded = Read-NpcMemory -NpcId $NpcId -StoreRoot $StoreRoot
  $path = $loaded.path
  $state = $loaded.state

  $now = (Get-Date).ToUniversalTime().ToString("o")
  $memoryId = if ($Memory.memory_id) { [string]$Memory.memory_id } else { "mem_" + [guid]::NewGuid().ToString("N").Substring(0, 12) }
  $eventId = if ($Memory.event_id) { [string]$Memory.event_id } else { [guid]::NewGuid().ToString() }
  $wakeId = if ($Memory.wake_id) { [string]$Memory.wake_id } else { "wk_" + [guid]::NewGuid().ToString("N").Substring(0, 8) }
  $event = if ($Memory.event) { [string]$Memory.event } else { throw "Memory.event is required" }
  $actors = if ($Memory.actors) { @($Memory.actors) } else { @() }
  $salience = if ($null -ne $Memory.salience) { [double]$Memory.salience } else { 0.3 }
  $decay = if ($Memory.decay_class) { [string]$Memory.decay_class } else { "normal" }
  $tags = if ($Memory.tags) { @($Memory.tags) } else { @() }
  $locationId = if ($Memory.location_id) { [string]$Memory.location_id } else { $null }
  $embeddingText = if ($Memory.embedding_text) { [string]$Memory.embedding_text } else { "$($state.persona.display_name): $event" }
  $ts = if ($Memory.ts) { [string]$Memory.ts } else { $now }

  # Ensure episodic array exists
  if (-not $state.episodic) {
    $state | Add-Member -NotePropertyName episodic -NotePropertyValue @() -Force
  }
  $episodic = @($state.episodic)

  $existing = $episodic | Where-Object {
    ($_.memory_id -eq $memoryId) -or ($_.event_id -eq $eventId)
  } | Select-Object -First 1

  $idempotentHit = $false
  if ($existing) {
    $idempotentHit = $true
    $row = $existing
  } else {
    $row = [ordered]@{
      schema_version = "1.0.0"
      kind           = "episodic"
      memory_id      = $memoryId
      npc_id         = $NpcId
      wake_id        = $wakeId
      event_id       = $eventId
      ts             = $ts
      event          = $event
      actors         = $actors
      location_id    = $locationId
      salience       = $salience
      decay_class    = $decay
      tags           = $tags
      embedding_text = $embeddingText
    }
    $episodic += [pscustomobject]$row
    $state.episodic = $episodic
    if ($state.PSObject.Properties.Name -contains "generated_at") {
      $state.generated_at = $now
    }
    $json = $state | ConvertTo-Json -Depth 12
    [System.IO.File]::WriteAllText($path, $json, [System.Text.UTF8Encoding]::new($false))
  }

  return [pscustomobject]@{
    path           = $path
    memory_id      = $memoryId
    event_id       = $eventId
    idempotent_hit = $idempotentHit
    written        = -not $idempotentHit
    row            = $row
  }
}

function Invoke-NpcMemoryRoundtrip {
  <#
  .SYNOPSIS
    One write then one read; asserts the memory is durable.
  #>
  param(
    [Parameter(Mandatory)][string]$NpcId,
    [Parameter(Mandatory)][hashtable]$Memory,
    [string]$StoreRoot,
    [string]$ProofPath
  )

  $writeResult = Write-NpcMemory -NpcId $NpcId -Memory $Memory -StoreRoot $StoreRoot
  $readResult = Read-NpcMemory -NpcId $NpcId -StoreRoot $StoreRoot
  $found = @($readResult.state.episodic) | Where-Object { $_.memory_id -eq $writeResult.memory_id } | Select-Object -First 1
  if (-not $found) {
    throw "ROUNDTRIP FAIL: wrote memory_id=$($writeResult.memory_id) but read-back missing"
  }

  $proof = [ordered]@{
    schema_version              = "1.0.0"
    kind                        = "artifact_store_roundtrip"
    issue                       = "TRO-126"
    verified_at                 = (Get-Date).ToUniversalTime().ToString("o")
    store_path                  = $writeResult.path
    npc_id                      = $NpcId
    write = [ordered]@{
      memory_id      = $writeResult.memory_id
      event_id       = $writeResult.event_id
      written        = $writeResult.written
      idempotent_hit = $writeResult.idempotent_hit
      event          = [string]$found.event
      salience       = [double]$found.salience
    }
    read = [ordered]@{
      persona_npc_id           = $readResult.state.persona.npc_id
      persona_display_name     = $readResult.state.persona.display_name
      episodic_count           = @($readResult.state.episodic).Count
      memory_found             = $true
      memory_id                = $found.memory_id
      embedding_text           = $found.embedding_text
    }
    ac = [ordered]@{
      write_then_read          = $true
      memory_persisted_on_disk = $true
      persona_loaded           = $true
    }
  }

  if (-not $ProofPath) {
    $root = Get-NpcMemoryStoreRoot -StoreRoot $StoreRoot
    $ProofPath = Join-Path $root "tro-126-write-read-demo.json"
  }
  $proofJson = $proof | ConvertTo-Json -Depth 8
  [System.IO.File]::WriteAllText($ProofPath, $proofJson, [System.Text.UTF8Encoding]::new($false))

  return [pscustomobject]@{
    ok         = $true
    proof_path = $ProofPath
    write      = $writeResult
    read_path  = $readResult.path
    episodic_count = @($readResult.state.episodic).Count
  }
}

# Export-style note for dot-sourcing:
#   . .\store\Npc-memory-store.ps1
#   Invoke-NpcMemoryRoundtrip -NpcId "npc.mira.dockwarden" -Memory @{ ... }
