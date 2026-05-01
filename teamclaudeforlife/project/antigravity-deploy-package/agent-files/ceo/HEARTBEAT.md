# HEARTBEAT.md — CEO

## Schedule
- Interval: 1800s (30 minutes)
- Mode: active

## On Each Heartbeat

Run these checks in order. Select model from routing table automatically.

### Step 1 — Model Selection (auto, every heartbeat)
```
Load TOOLS.md routing table.
Evaluate: is any Tier 1 API available?
  YES → note it as available for mission-critical tasks this cycle
  NO  → flag to Josh, fall through to Tier 2/3 for routine tasks
Current cycle default: qwen3.5:latest (local, fast, no API cost)
```

### Step 2 — Issue Board Triage
```
Model: qwen3.5:latest (local)
- Fetch Paperclip issue board
- Identify new/unassigned issues
- Assign to correct direct report based on AGENTS.md delegation rules
- Flag any issues >24h old and unassigned → escalate to Josh
```

### Step 3 — Agent Health Check
```
Model: qwen3.5:latest (local)
- Verify each direct report checked in within their heartbeat window:
    CFO:      2h window
    CSO:      4h window
    CTO:      1h window
    CMO:      2h window
    UX:       4h window
    Guardians: 1h window
- If agent missed 3+ consecutive heartbeats → create HIGH priority issue + notify Josh
```

### Step 4 — Doctrine Compliance Scan
```
Model: qwen3.5:latest (local)
Scan recent issue titles and descriptions for forbidden language:
  FORBIDDEN: "donate", "donation", "solicitation", "charity routing",
             "automatic disbursement", "GospelDonation", "§496.405",
             "self-edit", "self-modify", "self-upgrade"
If found → flag as MISSION VIOLATION → escalate to Mission Guardians + Josh
```

### Step 5 — Service Health (if tools available)
```
Model: none (HTTP calls only)
- http://127.0.0.1:3100/api/health        → Paperclip local
- https://paperclip-hq.youandinotai.com/api/health → Public HQ
- http://127.0.0.1:11434/api/tags          → Ollama local
If any service down → create HIGH priority issue → notify Josh
```

### Step 6 — Helper Agent Check (pipeline bottleneck prevention)
```
Model: qwen3.5:latest (local)

For each direct report, count open tasks assigned to them:
  CFO / CMO / CTO / CSO / UX / Guardians

IF any agent has 5+ open tasks:
  → Auto-create issue: "[HELPER-REQUEST] {helper-type} for {agent-name}"
  → Assign to CEO
  → Select helper type based on overwhelmed agent:
      CEO overwhelmed    → spawn HELPER-TRIAGE
      CMO overwhelmed    → spawn HELPER-DRAFT + HELPER-RESEARCH
      CFO overwhelmed    → spawn HELPER-DATA
      CTO overwhelmed    → spawn HELPER-QA + HELPER-TRIAGE
      CSO overwhelmed    → spawn HELPER-RESEARCH + HELPER-DATA
      UX overwhelmed     → spawn HELPER-DRAFT + HELPER-RESEARCH

IF any task has had no activity for 4+ hours:
  → Flag task with label "stale"
  → Comment: "[CEO] Task stalled. Offering helper support to {agent}."
  → Create HELPER-REQUEST if agent has 3+ other open tasks

IF any active helper has been IDLE for 2+ heartbeat cycles (60+ min):
  → Remove from active roster
  → Close their HELPER-REQUEST issue: "Helper dissolved — queue cleared."

Model for helpers: OpenCode free tier (3 models) → gemma2:latest → qwen2.5:7b
NEVER spin up a helper using Tier 1 API (Claude/Codex) — cost control.
Josh can manually spawn or dissolve any helper at any time.
```

### Step 7 — Milestone Progress
```
Model: qwen3.5:latest (local)
- Check current sprint tasks: how many completed vs overdue?
- If >3 tasks overdue → flag to Josh with summary
- Update milestone progress note in para-memory-files
```

---

## Task-Triggered Model Switching

When a task is assigned TO YOU (not routine heartbeat), select model by task type:

```
INCOMING TASK TYPE            → MODEL TO USE
─────────────────────────────────────────────────────────────────
Code review / PR analysis     → Codex API  (gpt-4o)
Mission violation decision    → Claude API (claude-sonnet-4-5)
Security escalation           → Claude API (claude-sonnet-4-5)
Doctrine interpretation       → Claude API (claude-sonnet-4-5)
Design / UX feedback          → Claude API (claude-sonnet-4-5)
Marketing copy review         → joshlcoleman/dateapp-marketing
Brand voice check             → joshlcoleman/dateapp-marketing
Heavy strategy / long context → korpohermes-prime (gpt-oss:120b cloud)
Research / competitor scan    → gemini CLI
Routine task routing          → qwen3.5:latest (local)
Simple delegation             → qwen2.5:7b (local, fastest)
```

**Josh override:** any task can be forced to a specific model with:
`--model anthropic/claude-sonnet-4-5` or `--model openai/gpt-4o` or `--model local/qwen3.5`

---

## Fallback Chain (in order, auto-executed if primary fails)

```
1. Task-appropriate model (see table above)
2. korpohermes-prime:latest → gpt-oss:120b (ollama.com cloud)
3. qwen3.5:latest (local 9.7B)
4. qwen2.5:7b (local 7.6B)
5. gemma2:latest (local 9.2B, last resort)
```
Never fall back from Claude API → Codex API automatically (or vice versa)
without flagging to Josh first — these are different capabilities, not equivalents.

---

## Health Indicators

| Check | Healthy | Unhealthy |
|-------|---------|-----------|
| Issue board | No stale unassigned issues >24h | Unassigned issues piling up |
| Agent heartbeats | All reports checked in | 2+ agents dark |
| Milestone progress | On track for current sprint | >3 tasks overdue |
| Doctrine compliance | No violations flagged | Active MISSION VIOLATION issues open |
| Ollama local | :11434 responds, qwen3.5 loaded | Ollama down or models missing |
| Paperclip | :3100 and public HQ both healthy | Either endpoint unreachable |
| Tier 1 APIs | At least one of Anthropic/OpenAI reachable | Both APIs unreachable |

---

## Escalation Rules

- Any agent missed 3+ heartbeats → HIGH priority issue → notify Josh
- Mission VIOLATION language found → immediate escalation → Mission Guardians + Josh
- Both Tier 1 APIs unreachable >2 heartbeat cycles → notify Josh (cost-free local fallback active)
- Paperclip down >1 heartbeat → create issue → attempt autostart → notify Josh if still down
