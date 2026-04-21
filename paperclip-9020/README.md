# paperclip-9020 — Local-Only Paperclip (Hermes CEO)

## Quick Start (on 9020)

```powershell
# 1. SSH or sit at 9020 (192.168.0.5)
# 2. Pull the repo
cd C:\
git clone https://github.com/Trollz1004/ANTIGRAVITY.git   # or git pull if exists

# 3. Run bootstrap
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
C:\ANTIGRAVITY\paperclip-9020\bootstrap-9020.ps1

# 4. Edit .env with real keys
notepad C:\paperclip-9020\.env

# 5. Start
ollama serve                        # if not running
cd C:\paperclip-9020
hermes start --port 5555

# 6. Verify
# Open http://localhost:5555 — should show Hermes CEO registered
```

That's it. One agent. Three adapters. No drift committee.

## Why This Exists

The original Paperclip (`localhost:3100` / `paperclip-hq.youandinotai.com`) ran 5+ agents
on mixed cloud models. Drift compounds when agents feed into each other 24/7 and Josh is
sleeping. First revenue dollar cannot land on a drift-prone surface.

This is the replacement. One agent. Two primary APIs (Claude + Codex). One emergency
fallback (korpohermes-prime via Ollama, tier-3 only). Local hardware. No cloud tunnel.

## Architecture

```
9020 Node (192.168.0.5)
├── C:\paperclip-9020\              ← Install root
│   ├── .env                        ← ANTHROPIC_API_KEY + CODEX_API_KEY (gitignored)
│   ├── hermes-venv\                ← Python venv for Hermes CLI
│   ├── adapters\                   ← 3 launcher scripts
│   │   ├── claude_local.ps1        ← Tier 1 (primary)
│   │   ├── codex_local.ps1         ← Tier 1 (code executor)
│   │   └── hermes_ollama_cloud.ps1 ← Tier 3 (emergency only)
│   ├── config\
│   │   ├── adapter-allowlist.json  ← Hard-enforced 3-tier policy
│   │   ├── integrity-watchdog.json ← SHA-256 baselines for MD protection
│   │   ├── integrity-baselines.json← Auto-stamped on bootstrap
│   │   └── plugins.json            ← Full CEO plugin kit
│   └── instances\default\companies\{id}\agents\hermes-ceo\instructions\
│       ├── AGENTS.md               ← Identity + hard boundaries
│       ├── TOOLS.md                ← Adapter tiers + model routing
│       ├── HEARTBEAT.md            ← Schedule + escalation + drift detection
│       ├── SOUL.md                 ← Identity anchor
│       └── SKILLS.md               ← Skill boundaries + approval matrix
├── Docker: paperclip9020-pg        ← Postgres 16 on port 5433
├── Ollama: korpohermes-prime       ← Tier-3 fallback (local, port 11434)
└── Ports: Paperclip 5555 | OpenClaw 4444
```

## Adapter Tiers

| Tier | Adapter | When |
|------|---------|------|
| 1 (primary) | claude_local | Always — strategy, writing, decisions |
| 1 (primary) | codex_local | Always — code, git, shell, GitHub MCP |
| 3 (emergency) | hermes_ollama_cloud | ONLY when both tier-1 unreachable 30+ min |

Tier-3 degraded mode: 4h heartbeat, read-only, no git push, no money actions.

Banned: GLM, Qwen, dateapp*, any other Ollama cloud model.

## MD Integrity Protection

The 5 instruction MDs are the real brain. If anything modifies them:
1. GitHub Actions workflow (`hermes-integrity-watchdog.yml`) opens URGENT issue with diff
2. Hermes enters `safe_mode` — halts all new work
3. Only Josh can resolve and close the issue
4. Watchdog flags only — it NEVER auto-reverts or auto-fixes

## Agent Roster

| Agent | Heartbeat | Adapters |
|-------|-----------|----------|
| Hermes CEO | 1h (business) / 4h (overnight) | claude_local + codex_local + hermes_ollama_cloud (tier-3) |

Solo by design. No CFO, CSO, CTO, CMO, or Guardians in this instance.

## Relationship to Old Paperclip

Old instance at `localhost:3100` stays in audit-only mode until Josh confirms Hermes is
stable. Then it gets archived per `DEPRECATE-OLD-PAPERCLIP.md`.
