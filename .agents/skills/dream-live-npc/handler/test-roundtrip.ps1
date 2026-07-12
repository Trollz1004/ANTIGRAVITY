#Requires -Version 5.1
<#
.SYNOPSIS
  End-to-end test: trigger → wake handler → response + memory writeback.
  Proves TRO-48/TRO-93 acceptance: one NPC, one trigger, <2s, memory persisted.
#>
$ErrorActionPreference = "Stop"

Write-Host "=== DREAM Live NPC Webhook Roundtrip Test ===" -ForegroundColor Cyan
Write-Host "  Branch: feat/tro-48-live-npc-webhook-roundtrip"
Write-Host "  NPC: Mira Dockwarden (T1)"
Write-Host "  Trigger: npc.spoken_to"
Write-Host ""

$handler = Join-Path $PSScriptRoot "Invoke-NpcWake.ps1"
$sampleWake = Join-Path (Split-Path -Parent $PSScriptRoot) "schemas\samples\agent_wake.json"

# Use Mira's NPC ID for the test
$wakePayload = Get-Content -LiteralPath $sampleWake -Raw | ConvertFrom-Json
$wakePayload.npc_id = "npc.mira.dockwarden"
$tempWake = Join-Path $env:TEMP "npc-wake-test.json"
$wakePayload | ConvertTo-Json -Depth 10 | Set-Content -LiteralPath $tempWake -Encoding UTF8

# Run the handler
$sw = [System.Diagnostics.Stopwatch]::StartNew()
$output = & $handler -WakeJson $tempWake
$elapsed = $sw.ElapsedMilliseconds

Write-Host "--- Response ---" -ForegroundColor Green
$output | ForEach-Object { Write-Host $_ }
Write-Host ""

# Parse and verify
$resp = ($output -join "`n") | ConvertFrom-Json

$checks = @(
  @{ name = "ok=true"; pass = $resp.ok -eq $true }
  @{ name = "npc_id matches"; pass = $resp.npc_id -eq "npc.mira.dockwarden" }
  @{ name = "wake_id matches"; pass = $resp.wake_id -eq $wakePayload.wake_id }
  @{ name = "has say text"; pass = $resp.say.Length -gt 0 }
  @{ name = "has remember[]"; pass = $resp.remember.Count -gt 0 }
  @{ name = "latency <2000ms"; pass = $resp.latency_ms -lt 2000 }
  @{ name = "wall-clock <2000ms"; pass = $elapsed -lt 2000 }
  @{ name = "fallback_used=false"; pass = $resp.fallback_used -eq $false }
)

Write-Host "--- Checks ---" -ForegroundColor Yellow
$allPass = $true
foreach ($c in $checks) {
  $icon = if ($c.pass) { "PASS" } else { "FAIL"; $allPass = $false }
  Write-Host "  [$icon] $($c.name)"
}

# Verify memory was written
$storeScript = Join-Path (Split-Path -Parent $PSScriptRoot) "store\Npc-memory-store.ps1"
. $storeScript
$loaded = Read-NpcMemory -NpcId "npc.mira.dockwarden"
$latestMem = $loaded.state.episodic | Sort-Object { $_.ts } | Select-Object -Last 1
$memWritten = $latestMem -and ($latestMem.tags -contains "tro-93")
$icon = if ($memWritten) { "PASS" } else { "FAIL"; $allPass = $false }
Write-Host "  [$icon] memory writeback persisted (tag:tro-93)"

Write-Host ""
if ($allPass) {
  Write-Host "ALL CHECKS PASSED — roundtrip complete in ${elapsed}ms" -ForegroundColor Green
  exit 0
} else {
  Write-Host "SOME CHECKS FAILED" -ForegroundColor Red
  exit 1
}
