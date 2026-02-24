---
name: health
description: "Check SABRETOOTH platform health — all 4 services"
---

Run diagnostics on the ENIGMA platform services on SABRETOOTH (192.168.0.8). Check all 4 ports in the dependency chain:

1. **Ollama** (11434) — `curl http://192.168.0.8:11434/api/tags`
2. **Clawdbot** (18789) — `netstat` or port check
3. **HEMORzoid API** (8001) — `curl http://192.168.0.8:8001/health`
4. **Dashboard** (3001) — port check

Report in this format:
```
Ollama (11434):     [UP/DOWN] — [detail]
Clawdbot (18789):   [UP/DOWN] — [detail]
HEMORzoid (8001):   [UP/DOWN] — [detail]
Dashboard (3001):   [UP/DOWN] — [detail]
```

If anything is DOWN, immediately reference the troubleshooting decision tree from the platform-ops skill and suggest the fix. Bottom-up diagnosis — if Ollama is down, everything downstream is irrelevant until it's back.

SABRETOOTH only. Never touch .5 or .15 nodes.
