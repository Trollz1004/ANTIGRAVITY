Run diagnostics on the ENIGMA platform services on SABRETOOTH (192.168.0.8). Check all 4 ports in the dependency chain:

1. **Ollama** (11434) — `curl http://192.168.0.8:11434/api/tags`
2. **Clawdbot** (18789) — port check
3. **HEMORzoid API** (8001) — `curl http://192.168.0.8:8001/health`
4. **Dashboard** (3001) — port check

Report in this format:
```
Ollama (11434):     [UP/DOWN] — [detail]
Clawdbot (18789):   [UP/DOWN] — [detail]
HEMORzoid (8001):   [UP/DOWN] — [detail]
Dashboard (3001):   [UP/DOWN] — [detail]
```

If anything is DOWN, reference the platform-ops skill at `C:\OPUSONLY\enigma-opus-plugin\skills\platform-ops\SKILL.md` for troubleshooting. Bottom-up diagnosis — if Ollama is down, everything downstream is irrelevant.

SABRETOOTH only. Never touch .5 or .15 nodes.
