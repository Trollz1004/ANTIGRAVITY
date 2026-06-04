# Orchestration Architecture
**Authority:** Josh Coleman  
**Date:** 2026-03-19  
**Principle:** Sabretooth-only control, worker nodes execute only

---

## Architecture

```
Josh (Telegram)
    ↓
Sabretooth OpenClaw (Orchestrator) ← YOU ARE HERE
    ↓ SSH only
├─ 9020 (Marketing/Content) — NO Telegram, NO OpenClaw
└─ T5500 (Build/Deploy) — NO Telegram, NO OpenClaw
```

---

## Rules

| Rule | Enforcement |
|------|-------------|
| **ONE Telegram** | Sabretooth only |
| **ONE OpenClaw Gateway** | Sabretooth only (127.0.0.1:18789) |
| **Worker nodes** | SSH access only, execute scripts, return results |
| **NO Telegram loops** | 9020/T5500 never send Telegram messages |
| **NO OpenClaw on workers** | Workers are dumb executors |

---

## How It Works

### 1. Josh Sends Command via Telegram

```
"Run yesterday-news on 9020"
```

### 2. Sabretooth Receives → Orchestrates

```python
# orchestrator.py dispatches via SSH
orch.dispatch_task("9020", "run_script", {
    "script": "yesterday-news-today.py",
    "args": "--mode generate"
})
```

### 3. 9020 Executes → Returns Output

9020 runs the script, stdout/stderr returned via SSH.

### 4. Sabretooth Reports Back to Josh

Results formatted and sent via Telegram (Sabretooth only).

---

## Commands

### Check Node Health

```python
python scripts/orchestrator.py status
```

### Run Script on Node

```python
python scripts/orchestrator.py run 9020 yesterday-news-today.py
```

### Execute Arbitrary Command

```python
python scripts/orchestrator.py exec 9020 "curl http://localhost:8000/api/health"
```

---

## Integration with Social Engine

For "Yesterday's News Today":

```
Josh: "Generate news content on 9020"
    ↓
Sabretooth: orch.dispatch_task("9020", "run_script", {
    "script": "yesterday-news-today.py",
    "args": "--mode generate"
})
    ↓ SSH
9020: Runs script, creates content files
    ↓ SSH return
Sabretooth: "Content generated on 9020 at C:\Antigravity\data\yesterday-news\..."
```

---

## Security

- SSH key-based auth only (`~/.ssh/krakken_ed25519`)
- No passwords in scripts
- Worker nodes cannot initiate connections
- All traffic flows Sabretooth → Worker → Sabretooth

---

## Files

| File | Purpose |
|------|---------|
| `scripts/orchestrator.py` | Main orchestration dispatcher |
| `briefings/ORCHESTRATION-ARCHITECTURE.md` | This document |
| `~/.ssh/config` | SSH aliases for nodes |

---

**Authority:** Josh Coleman  
**Last Updated:** 2026-03-19
