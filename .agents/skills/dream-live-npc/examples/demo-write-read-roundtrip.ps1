#Requires -Version 5.1
<#
.SYNOPSIS
  TRO-126 AC demo: one write + one read against the file-backed NPC memory store.
#>
$ErrorActionPreference = "Stop"
$storeScript = Join-Path (Split-Path -Parent $PSScriptRoot) "store\Npc-memory-store.ps1"
. $storeScript

$npcId = "npc.mira.dockwarden"
$ts = (Get-Date).ToUniversalTime().ToString("o")
$memory = @{
  memory_id      = "mem_tro126_demo"
  wake_id        = "wk_tro126_demo"
  event_id       = "e_tro126_write_read"
  ts             = $ts
  event          = "tro126_artifact_store_roundtrip"
  actors         = @("agent.grok")
  location_id    = "zone.harbor.pier"
  salience       = 0.2
  decay_class    = "ephemeral"
  tags           = @("tro-126", "artifact_store", "demo")
  embedding_text = "TRO-126 write then read persona artifact store demo"
}

$result = Invoke-NpcMemoryRoundtrip -NpcId $npcId -Memory $memory

Write-Host "PASS - write+read roundtrip"
Write-Host "  store: $($result.write.path)"
Write-Host "  memory_id: $($result.write.memory_id) written=$($result.write.written) idempotent=$($result.write.idempotent_hit)"
Write-Host "  episodic_count: $($result.episodic_count)"
Write-Host "  proof: $($result.proof_path)"
exit 0
