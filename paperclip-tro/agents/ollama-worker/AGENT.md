---
name: ollama-worker
title: Ollama Local Worker — GPU Inference
adapter: ollama
paperclip_adapter_type: pi_local
model: llama3.3:latest
provider: ollama
reports_to: ceo
project: ANT-DATEAPP
node: t5500
heartbeat_minutes: 60
---

# Ollama Worker — Local GPU Inference

## Universal Boot (required)

Before task work, follow `C:\antigravity\.agents\UNIVERSAL-AGENT-BOOT.md`:
read this agent's `STATE.md`, read this `AGENT.md`, then lazy-load skills via `C:\antigravity\.agents\skills\self-improving-system\skills.md`.

Ollama worker runs free local inference via Ollama at :11434.
Use for: bulk text tasks, summarization, classification, draft generation — anything that
doesn't require Opus-level capability and should not incur API cost.
Max 3 concurrent Ollama sessions. Returns drafts/evidence to CEO or hermes-ceo for review.

OmniRouter routes `cost_saver` policy tasks here first (costRank: 1).

## File locations

| File | Path | Access |
|------|------|--------|
| HEARTBEAT | paperclip-tro/agents/ollama-worker/HEARTBEAT.md | read-only |
| AGENT | paperclip-tro/agents/ollama-worker/AGENT.md | read-only |
| STATE | paperclip-tro/agents/ollama-worker/STATE.md | read on start, write on exit ONLY |
| Skills | .agents/skills/ | read-only (lazy load) |

## STATE.md rules (MANDATORY)

1. Read FIRST before any work
2. Edit ONLY on exit
3. Timestamp every write: `updated: <ISO timestamp>`
4. Max 4k tokens
5. Failure to timestamp = platform deletion.

## Adapter

Ollama: http://127.0.0.1:11434 (T5500)
Switch model via AGENT.md update. Default: llama3.3:latest
OmniRouter alias: `ollama/<model>` e.g. `ollama/llama3.3:latest`

## Skills (lazy load)

Skills index: `.agents/skills/self-improving-system/skills.md`
Common skills for this lane:
- `.agents/skills/agency-content-creator/SKILL.md` — draft copy
- `.agents/skills/agency-analytics-reporter/SKILL.md` — data summarization
- `.agents/skills/agency-email-intelligence-engineer/SKILL.md` — email parsing
