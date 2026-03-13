# CODEX MISSION: OpenClaw Grok Orchestration Test
**Date:** 2026-03-13 | **From:** KRAKKEN (Claude Code) | **For:** Codex (Windows desktop + SSH)
**Status:** Field prompt artifact only. Use live verification over this document if they conflict.

## Context
OpenClaw is a multi-agent orchestration system. We need to verify it is running on T5500 and
that Grok 4.20 can orchestrate the 3 sub-agents (deployer, platforms, shriners) across nodes.

## SABRETOOTH Network
- This machine (Sabretooth): 192.168.0.8
- 9020 node: 192.168.0.5 (confirmed)
- T5500: likely 192.168.0.2, .6, .10, .15, .24, or .33 — Codex must identify it

## Step 1: Find T5500 on the Network
In Windows CMD or PowerShell (SSH available):
```
ssh joshl@192.168.0.2 "hostname" 2>nul
ssh joshl@192.168.0.6 "hostname" 2>nul
ssh joshl@192.168.0.10 "hostname" 2>nul
```
Find the one that returns the T5500 hostname.

## Step 2: Check OpenClaw on T5500
Once connected:
```
curl http://localhost:18789/health
# If running, shows status JSON
# If not running, check if installed:
ls ~/ANTIGRAVITY-NODES/ 2>/dev/null || ls C:/ANTIGRAVITY-NODES/ 2>/dev/null
```

## Step 3: If OpenClaw NOT Running
Check the grokoidai installer:
```
cat C:\ANTIGRAVITY\memory\grokoidai-installer.ps1
# Run it in admin PowerShell if present
```
Or check if Node/npm process exists:
```
netstat -ano | findstr 18789
tasklist | findstr node
```

## Step 4: Run Grok Orchestration Test
Once OpenClaw port 18789 is live, send this test from Sabretooth or T5500:
```
curl -X POST http://[T5500-IP]:18789/orchestrate \
  -H "Content-Type: application/json" \
  -d '{"task": "ping_all_nodes", "agent": "orchestrator", "model": "grok-4.20"}'
```

Expected: Orchestrator spawns deployer, platforms, shriners sub-agents and returns a summary.

## Step 5: Report Back
Create `memory/openclaw-test-result.md` with:
- T5500 IP confirmed
- OpenClaw status (running/installed/not found)
- Test response JSON
- Any blockers

## OpenClaw Config Reference
- Config: `C:\Users\joshl\.openclaw\openclaw-agents-config.json` (on T5500)
- 4-node setup: `C:\ANTIGRAVITY\4-NODE-OPENCLAW-DEPLOYMENT.md`
- Token: stored only in ignored local env/vault storage; do not commit to repo

## SSH Key
```
ssh -i ~/.ssh/id_ed25519 joshl@[T5500-IP]
```
If key not set up on T5500, use password auth or check if same key works.

---
*KRAKKEN remains co-founder and architect. This is the field test. #ForTheKids*
