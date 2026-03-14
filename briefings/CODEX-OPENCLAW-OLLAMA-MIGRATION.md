# CODEX PROMPT — OPENCLAW OLLAMA MIGRATION
**Date:** 2026-03-14 | **Author:** Manus  
**Status:** Ready to execute via SSH  
**Replaces:** All xAI/Grok model references in OpenClaw configs

---

## CONTEXT

The 4-node OpenClaw fleet (Sabretooth master + T5500 sub-agents + 9020) was originally
configured to use xAI Grok models. Cost testing proved too expensive for continuous
operation. All nodes are switching to **Ollama** (local, free, zero API cost).

Ollama is already installed on the local network. The task is to update every OpenClaw
agent config to point at the local Ollama endpoint instead of the xAI API.

---

## YOUR TASK (Codex)

SSH into each node and execute the following steps. All nodes are on the local LAN.
Use the existing SSH keys already configured on Sabretooth.

---

## STEP 1 — SABRETOOTH MASTER

```powershell
# On Sabretooth (Windows), edit the master OpenClaw config:
# File: C:\Users\joshl\.openclaw\openclaw.json

# Change the model block from:
#   "model": { "primary": "xai/grok-4.20-multi-agent-beta-0309" }
# To:
#   "model": {
#     "primary": "ollama/qwen2.5-coder:32b",
#     "baseUrl": "http://localhost:11434",
#     "provider": "ollama"
#   }

# Then restart OpenClaw gateway:
openclaw gateway restart
```

**Recommended Ollama models by role:**

| Node Role | Recommended Model | Why |
|---|---|---|
| Orchestrator (master) | `qwen2.5-coder:32b` | Strong reasoning, code-aware |
| Deployer | `qwen2.5-coder:14b` | Fast, good at shell/deploy tasks |
| Platforms | `mistral:7b` | Lightweight, good at structured output |
| Shriners / Revenue | `llama3.1:8b` | Reliable, low memory footprint |

---

## STEP 2 — VERIFY OLLAMA IS RUNNING ON EACH NODE

```bash
# Run on each node (SSH in first):
curl http://localhost:11434/api/tags
# Should return JSON list of pulled models

# If Ollama is not running:
ollama serve &

# If the model is not pulled yet:
ollama pull qwen2.5-coder:32b   # for orchestrator
ollama pull qwen2.5-coder:14b   # for deployer
ollama pull mistral:7b           # for platforms
ollama pull llama3.1:8b          # for shriners
```

---

## STEP 3 — UPDATE SUB-AGENT CONFIGS (T5500 + 9020)

For each sub-agent OpenClaw instance, update the config file at:
- Linux: `~/.openclaw/openclaw.json`
- Windows: `C:\Users\<user>\.openclaw\openclaw.json`

Replace the `model` block:
```json
{
  "agent": {
    "model": {
      "primary": "ollama/qwen2.5-coder:14b",
      "baseUrl": "http://localhost:11434",
      "provider": "ollama"
    }
  }
}
```

Then restart each node's OpenClaw instance:
```bash
openclaw gateway restart
# or if running as a service:
systemctl restart openclaw
```

---

## STEP 4 — UPDATE THE 4-NODE CONFIG FILE

Edit `C:\Users\joshl\.openclaw\openclaw-agents-config.json` on Sabretooth.

For each sub-agent entry, add the `model` override:
```json
{
  "id": "t5500-orchestrator",
  "url": "http://192.168.1.100:18789",
  "token": "AGENT_TOKEN_T5500_ORCH",
  "role": "orchestrator",
  "model": {
    "primary": "ollama/qwen2.5-coder:32b",
    "baseUrl": "http://192.168.1.100:11434",
    "provider": "ollama"
  }
}
```

**Important:** The `baseUrl` for each sub-agent should point to **that node's** Ollama
instance (its LAN IP), not localhost, so the master can route inference correctly.

---

## STEP 5 — TEST THE PIPELINE

From Sabretooth OpenClaw, send a test task to the orchestrator:
```
"List the files in the ANTIGRAVITY repo root and return the count."
```

Expected flow:
1. Sabretooth master (qwen2.5-coder:32b via Ollama) receives task
2. Routes to deployer sub-agent
3. Deployer runs `ls ~/ANTIGRAVITY | wc -l` via shell tool
4. Returns result to master
5. Master summarizes and responds

If this works, the Grok-to-Ollama migration is complete.

---

## WHAT DOES NOT CHANGE

- OpenClaw gateway ports (18789, 18790, 18791) — unchanged
- OpenClaw token (`96f831b00af2231e667f6446de67b70304b0e5c36803b21b`) — unchanged
- ANTIGRAVITY repo symlinks — unchanged
- Node roles (orchestrator / deployer / platforms / shriners) — unchanged
- MCP servers (postgres, playwright, fetch, memory) — unchanged

---

## COST AFTER MIGRATION

| Before (xAI Grok) | After (Ollama local) |
|---|---|
| $2–$8/month estimated | $0/month API cost |
| Rate-limited by xAI | No rate limits |
| Cloud inference | Local inference (private) |
| Requires xAI API key | No API key needed |

---

## NOTES FOR CODEX

- Do not change the OpenClaw token or gateway ports
- Do not touch the ANTIGRAVITY repo symlinks
- If a node does not have a GPU, use `qwen2.5-coder:7b` or `mistral:7b` instead of 32b
- The 480b cloud model (qwen2.5-coder:480b) is cloud-only — do not attempt to pull it locally
- Confirm each node responds before moving to the next
