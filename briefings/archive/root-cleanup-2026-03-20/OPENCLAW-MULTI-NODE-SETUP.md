# OPENCLAW MULTI-NODE SETUP — SABRETOOTH MASTER + SUB-AGENTS

> ⛔ THIS IS NOT A SIMULATION. This infrastructure exists to help kids in need.
> Every agent, every model, every line of code must protect platform credibility.
> Zero tolerance for ToS violations, ethical gray areas, or legal risk.
> Clean, full, production-quality code ONLY. No shortcuts. No excuses.

**Architecture:** Sabretooth OpenClaw (master) → T5500/9020/etc OpenClaw instances (sub-agents)
**Model:** Grok 4.20 on master, Grok 4.1 Fast on sub-agents  
**Sync:** C:\antigravity origin/main (canonical repo truth)  
**Cost:** ~$3–$4/month total

---

## ARCHITECTURE

```
Sabretooth OpenClaw (Master)
  ├─ Grok 4.20 Multi-Agent (reasoning)
  ├─ Spawn sub-agents on:
  │  ├─ T5500 Orchestrator (Grok 4.1)
  │  ├─ T5500 Deployer (Grok 4.1)
  │  ├─ T5500 Platforms (Grok 4.1)
  │  ├─ T5500 Shriners (Grok 4.1)
  │  ├─ 9020 Node (if active)
  │  └─ Any other node
  └─ All report back to Sabretooth master
```

Each sub-agent OpenClaw instance:
- Runs locally on its node
- Listens on its own port (18789, 18790, 18791, etc.)
- Exposes MCP servers + tools
- Takes commands from Sabretooth master
- Executes tasks, reports back via webhook

---

## SETUP CHECKLIST

### MASTER: Sabretooth OpenClaw Setup

#### Step 1: Install OpenClaw on Sabretooth
```powershell
# If not installed
npm install -g openclaw

# Verify
openclaw --version
```

#### Step 2: Master Config (`C:\Users\joshl\.openclaw\openclaw.json` on Sabretooth)
```json
{
  "agent": {
    "id": "master-sabretooth",
    "name": "Sabretooth Master (Grok 4.20)",
    "model": { "primary": "xai/grok-4.20-multi-agent-beta-0309" }
  },
  "gateway": {
    "port": 18789,
    "mode": "server"
  },
  "subAgents": {
    "enabled": true,
    "autoSpawn": true,
    "nodes": [
      {
        "id": "t5500-orchestrator",
        "url": "http://192.168.1.100:18789",
        "token": "AGENT_TOKEN_T5500_ORCH",
        "role": "orchestrator"
      },
      {
        "id": "t5500-deployer",
        "url": "http://192.168.1.100:18790",
        "token": "AGENT_TOKEN_T5500_DEPLOY",
        "role": "deployer"
      },
      {
        "id": "t5500-platforms",
        "url": "http://192.168.1.100:18791",
        "token": "AGENT_TOKEN_T5500_PLAT",
        "role": "platforms"
      },
      {
        "id": "t5500-shriners",
        "url": "http://192.168.1.100:18792",
        "token": "AGENT_TOKEN_T5500_SHRIN",
        "role": "shriners"
      }
    ]
  },
  "webhooks": {
    "subAgentResults": "http://127.0.0.1:18789/webhooks/results"
  }
}
```

#### Step 3: Start Master
```powershell
cd C:\antigravity
openclaw gateway start
# Should listen on 18789
```

---

### SUB-AGENT: T5500 Node Setup (Repeat for each node)

#### Step 1: Install OpenClaw on T5500
```powershell
# SSH to T5500 or local terminal
npm install -g openclaw

# Verify
openclaw --version
```

#### Step 2: Sub-Agent Config (`C:\Users\joshl\.openclaw\openclaw-t5500-orch.json`)

For **T5500 Orchestrator** (port 18789):
```json
{
  "agent": {
    "id": "t5500-orchestrator",
    "name": "T5500 Orchestrator (Grok 4.1)",
    "model": { "primary": "xai/grok-4-1-fast-reasoning" },
    "workspace": "E:/ANTIGRAVITY"
  },
  "gateway": {
    "port": 18789,
    "mode": "agent",
    "authToken": "AGENT_TOKEN_T5500_ORCH"
  },
  "masterNode": {
    "enabled": true,
    "url": "http://192.168.1.101:18789",
    "reportInterval": 30
  },
  "mcp": {
    "servers": ["omega-sentry", "postgres", "playwright", "fetch", "memory"]
  }
}
```

For **T5500 Deployer** (port 18790):
```json
{
  "agent": {
    "id": "t5500-deployer",
    "name": "T5500 Deployer (Grok 4.1)",
    "model": { "primary": "xai/grok-4-1-fast-reasoning" },
    "workspace": "E:/ANTIGRAVITY"
  },
  "gateway": {
    "port": 18790,
    "mode": "agent",
    "authToken": "AGENT_TOKEN_T5500_DEPLOY"
  },
  "masterNode": {
    "enabled": true,
    "url": "http://192.168.1.101:18789",
    "reportInterval": 30
  },
  "workspace": "E:/ANTIGRAVITY"
}
```

**Repeat for platforms (18791) and shriners (18792) with different ports/tokens.**

#### Step 3: Start Sub-Agents on T5500
```powershell
# Start each sub-agent in separate terminal or background job

# Orchestrator
openclaw gateway start --config C:\Users\joshl\.openclaw\openclaw-t5500-orch.json

# Deployer (different terminal)
openclaw gateway start --config C:\Users\joshl\.openclaw\openclaw-t5500-deploy.json

# Platforms (different terminal)
openclaw gateway start --config C:\Users\joshl\.openclaw\openclaw-t5500-plat.json

# Shriners (different terminal)
openclaw gateway start --config C:\Users\joshl\.openclaw\openclaw-t5500-shrin.json
```

Or use startup script:

```powershell
# Save as C:\antigravity\scripts\START-OPENCLAW-MULTI-NODE.ps1

$nodes = @(
    @{ id = "orchestrator"; port = 18789 },
    @{ id = "deployer"; port = 18790 },
    @{ id = "platforms"; port = 18791 },
    @{ id = "shriners"; port = 18792 }
)

foreach ($node in $nodes) {
    Start-Process powershell -ArgumentList "-Command", "openclaw gateway start --config C:\Users\joshl\.openclaw\openclaw-t5500-$($node.id).json" -WindowStyle Minimized
    Start-Sleep -Seconds 2
}

Write-Host "All sub-agents started on T5500"
```

---

## COMMAND FLOW

### Josh sends command to Sabretooth:
```
"Deploy all 10 apps"
```

### Sabretooth Master (Grok 4.20):
1. Receives task
2. Reasons about delegation
3. Spawns **deployer sub-agent** on T5500 (via HTTP call to port 18790)
4. Passes command + context
5. Waits for webhook callback

### T5500 Deployer Sub-Agent (Grok 4.1):
1. Receives command from master
2. Runs `_deploy/` scripts
3. Updates `origin/main`
4. Sends webhook result back to Sabretooth
5. Goes idle, waiting for next task

### Sabretooth Master gets result:
1. Receives webhook from deployer
2. Optionally spawns **shriners sub-agent** for Protocol Omega routing
3. All logged + reported to Josh

---

## NETWORK SETUP

If nodes are on **different machines**, use IP addresses:

```json
"nodes": [
  {
    "id": "t5500-orchestrator",
    "url": "http://192.168.1.100:18789",  // T5500 IP
    "token": "AGENT_TOKEN_T5500_ORCH"
  },
  {
    "id": "9020-node",
    "url": "http://192.168.1.50:18789",   // 9020 IP
    "token": "AGENT_TOKEN_9020"
  }
]
```

If all on **same machine** (Sabretooth), use localhost + different ports:
```json
"nodes": [
  { "url": "http://127.0.0.1:18789", "port": 18789 },
  { "url": "http://127.0.0.1:18790", "port": 18790 }
]
```

---

## CODEX REAL JOB (During All This)

While Sabretooth master + sub-agents are running:

✅ **Codex monitors:**
- MCP servers healthy on all nodes
- DAO contracts locked (Protocol Omega)
- Iron Wall enforced (ENIGMA ≠ OMEGA)
- Fleet watcher daily logs updated
- No data drift

✅ **Codex stays on Sabretooth:**
- Runs security audits
- Validates sub-agent results
- Enforces repo truth (origin/main)
- Blocks bad pushes

---

## COST BREAKDOWN

- **Sabretooth Master (Grok 4.20):** $2.00/$6.00 per million tokens → ~$2–$3/month
- **T5500 Sub-agents (Grok 4.1 × 4):** $0.20/$0.50 per million tokens → ~$0.50–$1/month
- **9020 (if active):** +$0.25–$0.50/month
- **Total:** ~$3–$4/month for full multi-node orchestration

---

## TEST IT

### On Sabretooth:
```powershell
# Start master
openclaw gateway start

# In new terminal, test connection to sub-agent
curl http://127.0.0.1:18790/status
# Should return 200 OK from deployer
```

### Command flow test:
```
Message to Sabretooth OpenClaw:
"Deploy all 10 apps via T5500 deployer"

Expected:
1. Master receives command
2. Spawns deployer sub-agent on T5500 (18790)
3. Deployer runs _deploy/ scripts
4. Results webhook back to Sabretooth
5. All logged to origin/main
```

---

## FILES TO COMMIT

- `OPENCLAW-MULTI-NODE-SETUP.md` (this file)
- `scripts/START-OPENCLAW-MULTI-NODE.ps1` (startup script)
- `scripts/test-sub-agent-connection.ps1` (health check)

---

**Status:** ✅ Multi-node OpenClaw ready. Master on Sabretooth, sub-agents on each node, Codex guarding MCPs/DAOs.

Ready to go live? 🦞
