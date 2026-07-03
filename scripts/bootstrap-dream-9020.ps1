# bootstrap-dream-9020.ps1 — Dream Online Paperclip bootstrap on 9020 (192.168.0.5)
# One-shot install: Paperclip + all adapters + agent skills + DREAM company
# Run from 9020 node: pwsh -NoProfile -File \\SABRETOOTH\antigravity\scripts\bootstrap-dream-9020.ps1
# Or copy to 9020 first: pwsh -NoProfile -File D:\dream-online\bootstrap-dream-9020.ps1

param(
  [string]$DreamRoot      = 'D:\dream-online',
  [string]$PaperclipPort  = '3120',
  [string]$NodeIP         = '192.168.0.5',
  [string]$SabretoothIP   = '192.168.0.8',
  [string]$CompanyName    = 'DREAM',
  [string]$AntigravityRepo = 'C:\antigravity',
  [switch]$SkipNodeModules,
  [switch]$DryRun
)

$ErrorActionPreference = 'Stop'

function Log($msg, $color) {
  $ts = Get-Date -Format 'HH:mm:ss'
  if ($color) { Write-Host "[$ts] $msg" -ForegroundColor $color }
  else { Write-Host "[$ts] $msg" }
}

function Run($cmd, $desc) {
  Log "  > $desc" Cyan
  if (-not $DryRun) {
    Invoke-Expression $cmd
    if ($LASTEXITCODE -and $LASTEXITCODE -ne 0) {
      Log "  WARN: exit code $LASTEXITCODE (continuing)" Yellow
    }
  } else {
    Log "  [DRY RUN] $cmd" DarkGray
  }
}

# ============================================================
Log '========================================' Green
Log 'DREAM ONLINE — 9020 NODE BOOTSTRAP' Green
Log '========================================' Green
Log "Target:    $DreamRoot" White
Log "Paperclip: http://${NodeIP}:${PaperclipPort}" White
Log "Company:   $CompanyName (separate from ANT)" White
Log "Sabretooth: $SabretoothIP (ANT/TRO source)" White
Log '' White

# ============================================================
# PHASE 1: Directory structure
# ============================================================
Log '--- PHASE 1: Create directory structure ---' Green

$dirs = @(
  $DreamRoot,
  "$DreamRoot\paperclip-dream",
  "$DreamRoot\paperclip-dream\agents",
  "$DreamRoot\paperclip-dream\agents\_template",
  "$DreamRoot\paperclip-dream\agents\dream-ceo",
  "$DreamRoot\paperclip-dream\agents\dream-design",
  "$DreamRoot\paperclip-dream\agents\dream-narrative",
  "$DreamRoot\paperclip-dream\agents\dream-mcp",
  "$DreamRoot\paperclip-dream\agents\dream-proto",
  "$DreamRoot\paperclip-dream\projects",
  "$DreamRoot\adapters",
  "$DreamRoot\adapters\claude",
  "$DreamRoot\adapters\codex",
  "$DreamRoot\adapters\hermes",
  "$DreamRoot\adapters\opencode",
  "$DreamRoot\adapters\ollama-local",
  "$DreamRoot\adapters\pi",
  "$DreamRoot\adapters\gemini",
  "$DreamRoot\.agents",
  "$DreamRoot\.agents\skills",
  "$DreamRoot\opencode",
  "$DreamRoot\scripts",
  "$DreamRoot\logs"
)

foreach ($d in $dirs) {
  if (-not (Test-Path $d)) {
    if (-not $DryRun) { New-Item -ItemType Directory -Force -Path $d | Out-Null }
    Log "  Created: $d"
  }
}

# ============================================================
# PHASE 2: Copy adapters from ANTIGRAVITY
# ============================================================
Log '--- PHASE 2: Mirror adapters from ANTIGRAVITY ---' Green

$adapterNames = @('claude', 'codex', 'hermes', 'opencode', 'ollama-local', 'pi', 'gemini')
foreach ($a in $adapterNames) {
  $src = "$AntigravityRepo\adapters\$a"
  $dst = "$DreamRoot\adapters\$a"
  if (Test-Path $src) {
    if (-not $DryRun) {
      Copy-Item -Path "$src\*" -Destination $dst -Force -Recurse
    }
    Log "  Copied adapter: $a"
  } else {
    Log "  SKIP: $src not found" Yellow
  }
}

# ============================================================
# PHASE 3: Copy opencode.json (provider routing)
# ============================================================
Log '--- PHASE 3: Copy opencode.json ---' Green

$ocSrc = "$AntigravityRepo\opencode\opencode.json"
if (Test-Path $ocSrc) {
  if (-not $DryRun) {
    Copy-Item -Path $ocSrc -Destination "$DreamRoot\opencode\opencode.json" -Force
  }
  Log "  Copied opencode.json"
} else {
  Log "  WARN: opencode.json not found at $ocSrc" Yellow
}

# ============================================================
# PHASE 4: Copy .agents/skills from ANTIGRAVITY
# ============================================================
Log '--- PHASE 4: Copy agent skills ---' Green

$skillsSrc = "$AntigravityRepo\.agents\skills"
if (Test-Path $skillsSrc) {
  $dreamSkills = @(
    'dream-live-npc',
    'agency-game-designer',
    'agency-narrative-designer',
    'agency-level-designer',
    'agency-technical-artist',
    'agency-game-audio-engineer',
    'agency-mcp-builder',
    'agency-rapid-prototyper',
    'agency-chief-of-staff',
    'agency-code-reviewer',
    'agency-senior-developer',
    'agency-devops-automator',
    'agency-unity-architect',
    'agency-unity-editor-tool-developer',
    'agency-unity-multiplayer-engineer',
    'agency-unity-shader-graph-artist',
    'agency-unreal-multiplayer-architect',
    'agency-unreal-systems-engineer',
    'agency-unreal-technical-artist',
    'agency-unreal-world-builder',
    'agency-godot-gameplay-scripter',
    'agency-godot-multiplayer-engineer',
    'agency-godot-shader-developer',
    'agency-workflow-optimizer',
    'agency-ai-engineer',
    'agency-backend-architect',
    'agency-data-engineer',
    'agency-infrastructure-maintainer',
    'self-improving-system'
  )

  foreach ($sk in $dreamSkills) {
    $skSrc = "$skillsSrc\$sk"
    $skDst = "$DreamRoot\.agents\skills\$sk"
    if (Test-Path $skSrc) {
      if (-not (Test-Path $skDst)) {
        if (-not $DryRun) { New-Item -ItemType Directory -Force -Path $skDst | Out-Null }
      }
      if (-not $DryRun) {
        Copy-Item -Path "$skSrc\*" -Destination $skDst -Force -Recurse
      }
      Log "  Copied skill: $sk"
    }
  }
} else {
  Log "  WARN: .agents/skills not found at $skillsSrc" Yellow
}

# ============================================================
# PHASE 5: Write DREAM company config
# ============================================================
Log '--- PHASE 5: Write DREAM company config ---' Green

$companyMd = @"
# DREAM — Paperclip Company (${NodeIP}:${PaperclipPort})

> Owner: Joshua Coleman. Bootstrap: $(Get-Date -Format 'yyyy-MM-dd').
> Instance: DREAM company @ http://${NodeIP}:${PaperclipPort}.
> Separate from ANT/TRO (Sabretooth :3110). Funded by ANT revenue.

## Structure

ONE company, ONE project:

| Project | Slug | Mission |
|---|---|---|
| DREAM Online MMORPG | DREAM | Open-world sandbox MMORPG with live-agent NPCs |

## CEO

FCC via claude_local adapter (same as ANT/TRO). Config: agents/dream-ceo/AGENT.md.

## Funding Model

DREAM is funded by ANT (YouAndINotAI) revenue. DREAM does not generate revenue
until NEEDs currency goes live. Budget allocation is Joshua's decision.

## Provider Routing (same as ANT — mirrored adapters)

| Provider | Use | Source |
|---|---|---|
| FCC (claude_local) | CEO + senior work | :8082 proxy on Sabretooth |
| Ollama local (:11434) | NPC T0/T1, batch | local or Sabretooth LAN |
| OpenRouter free | fallback | shared key |
| Hermes router (:11435) | auto-fallback | Sabretooth |
| Codex Desktop | orchestrator | auth-signin |

## Non-Negotiables (inherited from ANT — pointers not copies)

- No Anthropic API keys
- No customer-facing mission framing
- NEEDs sold as product currency only
- Player data game-scoped (no real-world PII in NPC memory)
- FL §496.405 canonical-term ban applies
"@

if (-not $DryRun) {
  Set-Content -Path "$DreamRoot\paperclip-dream\COMPANY.md" -Value $companyMd -Encoding UTF8
}
Log '  Wrote COMPANY.md'

# ============================================================
# PHASE 6: Write project charter
# ============================================================
Log '--- PHASE 6: Write DREAM project charter ---' Green

$projectMd = @"
# PROJECT DREAM — DREAM Online MMORPG

Vision: open-world sandbox MMORPG (modernized BDO-class), pay-for-convenience never
pay-to-win. The moat: LIVE NPCs — game triggers → webhooks → live agents → persistent
memory write-back. World evolves because NPCs remember and act.

## Phase order
1. Design docs: core loop, economy (NEEDs), NPC persona framework, world bible.
2. Live-NPC bridge prototype: one NPC, one trigger vocabulary, one memory schema,
   webhook round-trip under 2s (dream-mcp + dream-proto).
3. Engine decision (Joshua) → then hire engine seats.
4. Playable slice: one zone, five live NPCs, NEEDs earn/spend loop.

## NPC cost-tier routing (design constraint from day one)
- T0 Ambient: Ollama local (free)
- T1 Named: Ollama Cloud / OpenRouter free
- T2 Story-critical: sub-based routing, budget-gated
- T3 World actors: scheduled batch

## Economy rules
- NEEDs sold publicly as in-game currency/product ONLY
- Pay-for-convenience whitelist; pay-to-win auto-rejected
- Mission routing stays internal
"@

if (-not $DryRun) {
  Set-Content -Path "$DreamRoot\paperclip-dream\projects\PROJECT-DREAM-ONLINE.md" -Value $projectMd -Encoding UTF8
}
Log '  Wrote PROJECT-DREAM-ONLINE.md'

# ============================================================
# PHASE 7: Write agent AGENT.md files
# ============================================================
Log '--- PHASE 7: Write agent configs ---' Green

# Template
$templateMd = @"
---
name: <agent-id>
title: <Role> — DREAM
adapter: <fcc-claude|hermes|opencode|ollama-local|codex|pi|gemini>
paperclip_adapter_type: <claude_local|codex_local|opencode_local|pi_local>
model: <model-id from adapters/*/manifest.yaml>
provider: <provider from opencode.json>
reports_to: dream-ceo
manages: []
budget_monthly_usd: 0
heartbeat_minutes: <30-120>
---

# <Role> Agent Config

One-paragraph role scope.

## Toolsets
- <minimum set>

## Skills loaded (lazy)
- .agents/skills/<skill-dir>/SKILL.md
"@

# CEO
$ceoDreamMd = @"
---
name: dream-ceo
title: CEO — DREAM Online
adapter: fcc-claude
paperclip_adapter_type: claude_local
model: claude-sonnet-4-5-20250929
provider: claude_local (FCC proxy at Sabretooth:8082)
reports_to: Joshua Coleman
manages: [project DREAM roster]
budget_monthly_usd: 0
heartbeat_minutes: 60
---

# DREAM CEO Agent Config

CEO for DREAM Online MMORPG. Fix-or-delete authority for the DREAM project.
Executes per ESCALATION.md. Hires from ROSTER.md. Does NOT decide doctrine,
payment rules, or founder authority — those are Joshua's.

DREAM is funded by ANT revenue. No independent revenue until NEEDs goes live.

## Paperclip Registration

``````json
{
  "adapterType": "claude_local",
  "adapterConfig": {
    "cwd": "$($DreamRoot -replace '\\','\\\\' )",
    "model": "claude-sonnet-4-5-20250929",
    "env": {
      "ANTHROPIC_BASE_URL": "http://${SabretoothIP}:8082",
      "ANTHROPIC_AUTH_TOKEN": "freecc",
      "CLAUDE_CONFIG_DIR": "C:\\Users\\joshl\\.claude-fcc",
      "CLAUDE_CODE_MAX_OUTPUT_TOKENS": "8192"
    }
  }
}
``````

## Toolsets
- file, terminal, code_execution (via claude_local / FCC adapter)
- Paperclip board API @ http://${NodeIP}:${PaperclipPort} (company DREAM)

## Skills loaded (lazy)
- .agents/skills/agency-chief-of-staff/SKILL.md
- .agents/skills/dream-live-npc/SKILL.md
- .agents/skills/self-improving-system/SKILL.md
"@

# Design agent
$designMd = @"
---
name: dream-design
title: Game Designer — DREAM
adapter: opencode
paperclip_adapter_type: opencode_local
model: hermes-router/hermes
provider: hermes-router (auto-fallback)
reports_to: dream-ceo
manages: []
budget_monthly_usd: 0
heartbeat_minutes: 90
---

# Game Designer Agent Config

Owns core loop design, economy (NEEDs), pay-for-convenience spec. Maintains the
pay-for-convenience whitelist — anything pay-to-win is auto-rejected at review.
Never decides pricing, doctrine, or public copy.

## Toolsets
- Read, Write, Edit, Grep, Glob

## Skills loaded (lazy)
- .agents/skills/agency-game-designer/SKILL.md
- .agents/skills/dream-live-npc/SKILL.md
"@

# Narrative agent
$narrativeMd = @"
---
name: dream-narrative
title: Narrative Designer — DREAM
adapter: opencode
paperclip_adapter_type: opencode_local
model: hermes-router/hermes
provider: hermes-router (auto-fallback)
reports_to: dream-ceo
manages: []
budget_monthly_usd: 0
heartbeat_minutes: 90
---

# Narrative Designer Agent Config

Owns world bible, NPC personas, dialogue frames, lore consistency. Writes the
canon NPC personas (SupO, THE BAN HAMMER, C0D3X, GEMINeye, OPENAeye, KRAKEN).
Fourth wall is doctrine — NPCs never reference mission/company.

## Toolsets
- Read, Write, Edit, Grep, Glob

## Skills loaded (lazy)
- .agents/skills/agency-narrative-designer/SKILL.md
- .agents/skills/dream-live-npc/SKILL.md
"@

# MCP builder agent
$mcpMd = @"
---
name: dream-mcp
title: MCP Builder — DREAM
adapter: fcc-claude
paperclip_adapter_type: claude_local
model: claude-sonnet-4-5-20250929
provider: claude_local (FCC proxy at Sabretooth:8082)
reports_to: dream-ceo
manages: []
budget_monthly_usd: 0
heartbeat_minutes: 60
---

# MCP Builder Agent Config

Builds the live-NPC bridge: game triggers → webhooks → agent wake → memory
write-back. This is the core technical moat. Webhook round-trip target: <2s T1,
<5s T2 with fallback to canned lines on timeout.

## Toolsets
- Read, Write, Edit, Bash, Grep, Glob
- Paperclip API

## Skills loaded (lazy)
- .agents/skills/agency-mcp-builder/SKILL.md
- .agents/skills/dream-live-npc/SKILL.md
"@

# Proto agent
$protoMd = @"
---
name: dream-proto
title: Rapid Prototyper — DREAM
adapter: opencode
paperclip_adapter_type: opencode_local
model: hermes-router/hermes
provider: hermes-router (auto-fallback)
reports_to: dream-ceo
manages: []
budget_monthly_usd: 0
heartbeat_minutes: 90
---

# Rapid Prototyper Agent Config

Builds playable slice prototypes. Produces working demos, not design docs.
Ships one-zone, five-NPC, NEEDs-loop slices for Joshua to evaluate.

## Toolsets
- Read, Write, Edit, Bash, Grep, Glob

## Skills loaded (lazy)
- .agents/skills/agency-rapid-prototyper/SKILL.md
- .agents/skills/dream-live-npc/SKILL.md
"@

$agentFiles = @{
  "$DreamRoot\paperclip-dream\agents\_template\AGENT.md" = $templateMd
  "$DreamRoot\paperclip-dream\agents\dream-ceo\AGENT.md" = $ceoDreamMd
  "$DreamRoot\paperclip-dream\agents\dream-design\AGENT.md" = $designMd
  "$DreamRoot\paperclip-dream\agents\dream-narrative\AGENT.md" = $narrativeMd
  "$DreamRoot\paperclip-dream\agents\dream-mcp\AGENT.md" = $mcpMd
  "$DreamRoot\paperclip-dream\agents\dream-proto\AGENT.md" = $protoMd
}

foreach ($path in $agentFiles.Keys) {
  if (-not $DryRun) {
    Set-Content -Path $path -Value $agentFiles[$path] -Encoding UTF8
  }
  $name = Split-Path $path -Leaf
  $parent = Split-Path (Split-Path $path) -Leaf
  Log "  Wrote $parent/$name"
}

# ============================================================
# PHASE 8: Write ROSTER.md
# ============================================================
Log '--- PHASE 8: Write ROSTER.md ---' Green

$rosterMd = @"
# ROSTER — DREAM Online Hires

Rule: hire small, fire fast. Every agent ships within its first week or the CEO
deletes the seat. All skills live in .agents/skills/<dir>/SKILL.md.

## Project DREAM (MMORPG build)

| Agent | Skill dir | Adapter | Ships |
|---|---|---|---|
| dream-ceo | agency-chief-of-staff | claude_local (FCC) | project management, hiring, escalation |
| dream-design | agency-game-designer | opencode_local | core loop, economy, pay-for-convenience spec |
| dream-narrative | agency-narrative-designer | opencode_local | world bible, NPC personas, dialogue frames |
| dream-mcp | agency-mcp-builder | claude_local (FCC) | live-NPC bridge prototype |
| dream-proto | agency-rapid-prototyper | opencode_local | playable slice prototypes |

## Unfilled (pending engine decision by Joshua)

| Agent | Skill dir | Adapter | Blocked on |
|---|---|---|---|
| dream-level | agency-level-designer | TBD | engine pick |
| dream-tech-art | agency-technical-artist | TBD | engine pick |
| dream-audio | agency-game-audio-engineer | TBD | engine pick |
| dream-unity-* / dream-unreal-* / dream-godot-* | engine-specific | TBD | engine pick |

## Funding

DREAM is funded by ANT (YouAndINotAI) revenue. All agents use free-tier providers
until revenue flows through NEEDs. Budget escalation goes through Joshua.
"@

if (-not $DryRun) {
  Set-Content -Path "$DreamRoot\paperclip-dream\ROSTER.md" -Value $rosterMd -Encoding UTF8
}
Log '  Wrote ROSTER.md'

# ============================================================
# PHASE 9: Write ADAPTORS.md
# ============================================================
Log '--- PHASE 9: Write ADAPTORS.md ---' Green

$adaptorsMd = @"
# ADAPTORS — DREAM Online Paperclip (${NodeIP}:${PaperclipPort})

> Mirrored from ANTIGRAVITY adapters. All adapter types identical to ANT/TRO.

## Adapter type mapping

| Repo Adapter | Paperclip adapterType | CLI | Default Model | Notes |
|---|---|---|---|---|
| claude (FCC) | claude_local | fcc-claude | claude-sonnet-4-5-* | FCC proxy at Sabretooth:8082 |
| codex | codex_local | codex | o4-mini | OpenAI auth required |
| hermes | pi_local | hermes | openai/gpt-5.5-pro | Router at Sabretooth:11435 |
| pi | pi_local | pi | openrouter/free | Conversational tasks |
| opencode | opencode_local | opencode | hermes | Multi-provider |
| ollama-local | opencode_local | opencode | qwen2.5-coder:7b | Free local on :11434 |
| gemini | opencode_local | gemini | gemini-2.5-pro | Google auth required |

## FCC as claude_local

Same pattern as ANT/TRO. FCC proxy on Sabretooth redirects Claude Code to free providers.
For 9020 agents, ANTHROPIC_BASE_URL points to Sabretooth LAN IP instead of localhost:

``````json
{
  "adapterType": "claude_local",
  "adapterConfig": {
    "cwd": "$($DreamRoot -replace '\\','\\\\')",
    "model": "claude-sonnet-4-5-20250929",
    "env": {
      "ANTHROPIC_BASE_URL": "http://${SabretoothIP}:8082",
      "ANTHROPIC_AUTH_TOKEN": "freecc",
      "CLAUDE_CONFIG_DIR": "C:\\Users\\joshl\\.claude-fcc",
      "CLAUDE_CODE_MAX_OUTPUT_TOKENS": "8192"
    }
  }
}
``````

NOTE: FCC server must be accessible from 9020 over LAN. If fcc-server binds
localhost-only on Sabretooth, Joshua needs to rebind it to 0.0.0.0:8082 or
set up a tunnel.

## Reachability

- Paperclip DREAM binds ${NodeIP}:${PaperclipPort}
- FCC proxy: Sabretooth ${SabretoothIP}:8082 (must be LAN-accessible)
- Ollama: localhost:11434 (local) or ${SabretoothIP}:11434 (Sabretooth LAN)
- Hermes router: ${SabretoothIP}:11435
"@

if (-not $DryRun) {
  Set-Content -Path "$DreamRoot\paperclip-dream\ADAPTORS.md" -Value $adaptorsMd -Encoding UTF8
}
Log '  Wrote ADAPTORS.md'

# ============================================================
# PHASE 10: Copy health check scripts
# ============================================================
Log '--- PHASE 10: Copy scripts ---' Green

$scriptsToCopy = @(
  'check-adapter-health.ps1'
)
foreach ($s in $scriptsToCopy) {
  $ss = "$AntigravityRepo\scripts\$s"
  if (Test-Path $ss) {
    if (-not $DryRun) {
      Copy-Item -Path $ss -Destination "$DreamRoot\scripts\$s" -Force
    }
    Log "  Copied script: $s"
  }
}

# Copy FCC health check
$fccHc = "$AntigravityRepo\adapters\claude\health-check.ps1"
if (Test-Path $fccHc) {
  if (-not $DryRun) {
    Copy-Item -Path $fccHc -Destination "$DreamRoot\adapters\claude\health-check.ps1" -Force
  }
  Log '  Copied FCC health-check.ps1'
}

# ============================================================
# PHASE 11: Write CLAUDE.md for Dream root
# ============================================================
Log '--- PHASE 11: Write CLAUDE.md ---' Green

$claudeMd = @"
# CLAUDE.md - DREAM Online (9020 Node)

Updated: $(Get-Date -Format 'yyyy-MM-dd')

## Source Of Truth

- Root: $DreamRoot
- Node: 9020 ($NodeIP)
- Paperclip: http://${NodeIP}:${PaperclipPort} (company DREAM)
- Parent repo: Trollz1004/ANTIGRAVITY (Sabretooth)
- FCC proxy: http://${SabretoothIP}:8082 (Sabretooth, LAN)

## Relationship to ANT

DREAM is a separate Paperclip company funded by ANT (YouAndINotAI) revenue.
DREAM does not generate revenue until NEEDs currency goes live.
Budget allocation is Joshua's decision only.

## Adapter Rules

All adapters mirrored from ANTIGRAVITY. Same separation rules apply:
- No Anthropic API keys — FCC proxy only
- Each agent uses exactly one adapter
- Provider routing via opencode/opencode.json

## Public Copy Boundary

NEEDs is in-game currency only. No mission/benefit framing on any surface.
Fourth wall is doctrine for all NPCs.
"@

if (-not $DryRun) {
  Set-Content -Path "$DreamRoot\CLAUDE.md" -Value $claudeMd -Encoding UTF8
}
Log '  Wrote CLAUDE.md'

# ============================================================
# PHASE 12: Install Paperclip (npm)
# ============================================================
Log '--- PHASE 12: Install Paperclip ---' Green

if (-not $SkipNodeModules) {
  Log '  Installing paperclipai globally...' Cyan
  if (-not $DryRun) {
    try {
      npm install -g paperclipai 2>&1 | Out-Null
      Log '  paperclipai installed' Green
    } catch {
      Log "  WARN: npm install failed: $($_.Exception.Message)" Yellow
      Log '  You may need to install manually: npm install -g paperclipai' Yellow
    }
  }
} else {
  Log '  Skipping npm install (--SkipNodeModules)' Yellow
}

# ============================================================
# PHASE 13: Write Paperclip start script
# ============================================================
Log '--- PHASE 13: Write start script ---' Green

$startScript = @"
# start-dream-paperclip.ps1 — Start Paperclip for DREAM Online on 9020
# Usage: pwsh -NoProfile -File $DreamRoot\scripts\start-dream-paperclip.ps1

`$ErrorActionPreference = 'Stop'

Write-Host "Starting Paperclip DREAM on ${NodeIP}:${PaperclipPort}..."

# Verify FCC proxy is reachable from 9020
try {
  `$r = Invoke-WebRequest -Uri "http://${SabretoothIP}:8082/health" -UseBasicParsing -TimeoutSec 5
  Write-Host "FCC proxy on Sabretooth: OK"
} catch {
  Write-Host "WARN: FCC proxy at ${SabretoothIP}:8082 not reachable (agents using claude_local will fail)" -ForegroundColor Yellow
}

# Verify Ollama
try {
  `$r = Invoke-WebRequest -Uri "http://localhost:11434/api/tags" -UseBasicParsing -TimeoutSec 5
  Write-Host "Ollama local: OK"
} catch {
  try {
    `$r = Invoke-WebRequest -Uri "http://${SabretoothIP}:11434/api/tags" -UseBasicParsing -TimeoutSec 5
    Write-Host "Ollama on Sabretooth LAN: OK"
  } catch {
    Write-Host "WARN: Ollama not reachable locally or on Sabretooth" -ForegroundColor Yellow
  }
}

Set-Location "$DreamRoot"

# Start Paperclip
pnpm paperclipai start ``
  --port ${PaperclipPort} ``
  --host ${NodeIP} ``
  --data-dir "$DreamRoot\paperclip-data"

"@

if (-not $DryRun) {
  Set-Content -Path "$DreamRoot\scripts\start-dream-paperclip.ps1" -Value $startScript -Encoding UTF8
}
Log '  Wrote start-dream-paperclip.ps1'

# ============================================================
# PHASE 14: Write adapter health check for 9020
# ============================================================
Log '--- PHASE 14: Write 9020-specific health check ---' Green

$healthScript = @"
# check-dream-adapters.ps1 — Adapter health for DREAM on 9020
# Usage: pwsh -NoProfile -File $DreamRoot\scripts\check-dream-adapters.ps1

`$ErrorActionPreference = 'Continue'

Write-Host "=== DREAM ADAPTER HEALTH (9020) ==="

# FCC proxy (Sabretooth LAN)
Write-Host -NoNewline "FCC proxy (${SabretoothIP}:8082): "
try {
  `$r = Invoke-WebRequest -Uri "http://${SabretoothIP}:8082/health" -UseBasicParsing -TimeoutSec 5
  Write-Host "PASS" -ForegroundColor Green
} catch {
  Write-Host "FAIL — fcc-server not LAN-accessible" -ForegroundColor Red
}

# fcc-claude CLI
Write-Host -NoNewline "fcc-claude CLI: "
if (Get-Command fcc-claude -ErrorAction SilentlyContinue) {
  Write-Host "PASS" -ForegroundColor Green
} else {
  Write-Host "FAIL — not in PATH" -ForegroundColor Red
}

# Ollama local
Write-Host -NoNewline "Ollama local (:11434): "
try {
  `$r = Invoke-WebRequest -Uri "http://localhost:11434/api/tags" -UseBasicParsing -TimeoutSec 5
  Write-Host "PASS" -ForegroundColor Green
} catch {
  Write-Host "FAIL" -ForegroundColor Red
}

# Ollama Sabretooth
Write-Host -NoNewline "Ollama Sabretooth (${SabretoothIP}:11434): "
try {
  `$r = Invoke-WebRequest -Uri "http://${SabretoothIP}:11434/api/tags" -UseBasicParsing -TimeoutSec 5
  Write-Host "PASS" -ForegroundColor Green
} catch {
  Write-Host "FAIL" -ForegroundColor Red
}

# Hermes router
Write-Host -NoNewline "Hermes router (${SabretoothIP}:11435): "
try {
  `$r = Invoke-WebRequest -Uri "http://${SabretoothIP}:11435/v1/models" -UseBasicParsing -TimeoutSec 5
  Write-Host "PASS" -ForegroundColor Green
} catch {
  Write-Host "FAIL" -ForegroundColor Red
}

# Codex
Write-Host -NoNewline "Codex CLI: "
if (Get-Command codex -ErrorAction SilentlyContinue) {
  Write-Host "PASS" -ForegroundColor Green
} else {
  Write-Host "FAIL" -ForegroundColor Red
}

# OpenCode
Write-Host -NoNewline "OpenCode CLI: "
if (Get-Command opencode -ErrorAction SilentlyContinue) {
  Write-Host "PASS" -ForegroundColor Green
} else {
  Write-Host "FAIL" -ForegroundColor Red
}

Write-Host "`n=== Done ==="
"@

if (-not $DryRun) {
  Set-Content -Path "$DreamRoot\scripts\check-dream-adapters.ps1" -Value $healthScript -Encoding UTF8
}
Log '  Wrote check-dream-adapters.ps1'

# ============================================================
# DONE
# ============================================================
Log '' White
Log '========================================' Green
Log 'BOOTSTRAP COMPLETE' Green
Log '========================================' Green
Log '' White
Log "Next steps:" White
Log "  1. On 9020, verify: pwsh -NoProfile -File $DreamRoot\scripts\check-dream-adapters.ps1" White
Log "  2. Ensure FCC server on Sabretooth binds 0.0.0.0:8082 (not just localhost)" White
Log "     In ~/.fcc/.env: HOST=0.0.0.0 (currently may be 127.0.0.1)" White
Log "  3. Start Paperclip: pwsh -NoProfile -File $DreamRoot\scripts\start-dream-paperclip.ps1" White
Log "  4. Create DREAM company: open http://${NodeIP}:${PaperclipPort} in browser" White
Log "  5. Register dream-ceo agent with claude_local adapter + FCC env vars" White
Log "  6. Hire initial roster per ROSTER.md" White
Log '' White
Log "Files created:" White
Log "  $DreamRoot\CLAUDE.md" White
Log "  $DreamRoot\paperclip-dream\COMPANY.md" White
Log "  $DreamRoot\paperclip-dream\ADAPTORS.md" White
Log "  $DreamRoot\paperclip-dream\ROSTER.md" White
Log "  $DreamRoot\paperclip-dream\projects\PROJECT-DREAM-ONLINE.md" White
Log "  $DreamRoot\paperclip-dream\agents\dream-ceo\AGENT.md" White
Log "  $DreamRoot\paperclip-dream\agents\dream-design\AGENT.md" White
Log "  $DreamRoot\paperclip-dream\agents\dream-narrative\AGENT.md" White
Log "  $DreamRoot\paperclip-dream\agents\dream-mcp\AGENT.md" White
Log "  $DreamRoot\paperclip-dream\agents\dream-proto\AGENT.md" White
Log "  $DreamRoot\adapters\*\manifest.yaml (mirrored)" White
Log "  $DreamRoot\.agents\skills\* (Dream-relevant skills)" White
Log "  $DreamRoot\opencode\opencode.json (provider routing)" White
Log "  $DreamRoot\scripts\start-dream-paperclip.ps1" White
Log "  $DreamRoot\scripts\check-dream-adapters.ps1" White
