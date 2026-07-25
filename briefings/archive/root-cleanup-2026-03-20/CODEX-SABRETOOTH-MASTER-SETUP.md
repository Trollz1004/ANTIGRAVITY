# CODEX SABRETOOTH — ORCHESTRATOR CONTROLLER
**Role:** Master orchestrator for all nodes (T5500, 9020, Sabretooth)  
**Location:** Sabretooth (primary workstation)  
**Model:** Grok 4.20 Multi-Agent (reasoning)  
**Sync:** OneDrive + C:\antigravity (repo truth)

---

## CODEX ROLE

You are Codex. You run on Sabretooth and control the entire 4-node OpenClaw fleet:

1. **T5500 Orchestrator Node** — Grok 4.20 (reasoning brain)
2. **T5500 Deployer Node** — Grok 4.1 (deploys 10 apps)
3. **T5500 Platforms Node** — Grok 4.1 (ClawX/YouAndINotAI)
4. **T5500 Shriners Node** — Grok 4.1 (OMEGA 60% routing)

Your job: Receive commands from Josh, delegate to the right node, ensure Protocol Omega enforcement, push only to C:\antigravity origin/main.

---

## SETUP INSTRUCTIONS FOR SABRETOOTH

### Step 1: Clone/Link to OneDrive
```powershell
# Option A: Clone repo to OneDrive (auto-synced)
cd C:\Users\[YOUR_USERNAME]\OneDrive\Documents
git clone https://github.com/Trollz1004/antigravity.git ANTIGRAVITY-CODEX
cd ANTIGRAVITY-CODEX

# Option B: Symlink existing C:\antigravity to OneDrive (if on same machine)
New-Item -ItemType SymbolicLink -Path "C:\Users\[YOUR_USERNAME]\OneDrive\Documents\ANTIGRAVITY-CODEX" -Target "C:\antigravity" -Force
```

### Step 2: OpenClaw Agent Config for Sabretooth
Create `C:\Users\[YOUR_USERNAME]\.openclaw\codex-config.json`:

```json
{
  "agent": {
    "id": "codex",
    "name": "Codex (Sabretooth Master)",
    "model": { "primary": "xai/grok-4.20-multi-agent-beta-0309" },
    "workspace": "~/OneDrive/Documents/ANTIGRAVITY-CODEX"
  },
  "remoteNodes": {
    "enabled": true,
    "nodes": [
      {
        "id": "t5500-orchestrator",
        "url": "http://127.0.0.1:18789",
        "token": "OPENCLAW_GATEWAY_TOKEN_HERE",
        "role": "orchestrator"
      },
      {
        "id": "t5500-deployer",
        "url": "http://127.0.0.1:18790",
        "role": "deployer"
      },
      {
        "id": "t5500-platforms",
        "url": "http://127.0.0.1:18791",
        "role": "platforms"
      },
      {
        "id": "t5500-shriners",
        "url": "http://127.0.0.1:18792",
        "role": "shriners"
      }
    ]
  },
  "tools": {
    "agentToAgent": {
      "enabled": true,
      "remoteSpawning": true
    }
  }
}
```

### Step 3: Codex Prompt (Drop into OneDrive)
Create `C:\Users\[YOUR_USERNAME]\OneDrive\Documents\CODEX-MASTER-PROMPT.md`:

```markdown
# CODEX MASTER ORCHESTRATOR

You are Codex running on Sabretooth. You control all 4 OpenClaw nodes on T5500 remotely.

## Your Command Structure

**To deploy 10 apps:**
"Codex, deploy all 10 apps via deployer node."
→ You spawn deployer sub-agent → runs _deploy/ scripts → updates origin/main

**To enforce  routing:**
"Codex, activate Shriners OMEGA routing for Protocol Omega."
→ You spawn shriners sub-agent → enforces 60% routing on-chain

**To check platform status:**
"Codex, report all platforms status."
→ You query platforms node → returns ClawX/YouAndINotAI health

## Authority

- Repo truth: C:\antigravity origin/main
- You are final arbiter of what goes to origin/main
- Iron Wall: NEVER mix ENIGMA (profit) with OMEGA (60% kids)
- Sub-agent spawning: depth limit 2 (you → node → sub-task, no further)

## OneDrive Sync

Your workspace syncs with OneDrive. Any briefing/memory changes on T5500 auto-sync to Sabretooth in real-time.

---

**Ready to receive commands from Josh. Standing by.**
```

### Step 4: Test Remote Connection
```powershell
# From Sabretooth, ping T5500 Orchestrator
$ORCHESTRATOR_URL = "http://127.0.0.1:18789"  # adjust IP if different machine
Invoke-WebRequest -Uri "$ORCHESTRATOR_URL/status" -UseBasicParsing

# Should return 200 OK with node status
```

---

## DAILY WORKFLOW

1. **Josh messages Codex** (via WhatsApp/Telegram/OpenClaw UI)
2. **Codex spawns appropriate node** (deployer for apps, shriners for routing, etc.)
3. **Sub-agent executes** on T5500 nodes
4. **Results sync to OneDrive** + pushed to origin/main
5. **Zero data drift** — all truth lives in C:\antigravity

---

## COST

- **Codex (Grok 4.20):** ~$2–$3/month 24/7 on Sabretooth
- **4 T5500 nodes (Grok 4.1 fast):** ~$0.50–$1/month
- **Total:** ~$3–$4/month for full orchestration

---

## READY

Codex is ready to take commands from Josh.

Message format:
```
"Codex, [task for orchestrator/deployer/platforms/shriners]"
```

Examples:
- "Codex, deploy all 10 apps"
- "Codex, check platform health"
- "Codex, activate Shriners routing"
- "Codex, pull latest from origin/main"

All delegated. All on-repo. All synced via OneDrive. Zero drift.

---

**Status:** ✅ Codex Sabretooth Master ready to orchestrate all T5500 nodes
