---
name: warn-dead-node-paths
enabled: true
event: all
pattern: (nodes[\\/][9]020|node-workloads[\\/][9]020|C:[\\/]+Users[\\/]+josh[li][\\/]|192\.168\.0\.[8]|sabre[t]ooth|i7k32GB1050ti)
---

⚠️ **That path or node name is retired or hardcoded.**

- Third-node paths, retired workstation names, and legacy node IPs are permanently decommissioned. Never configure, probe, or route traffic to them.
- Never hardcode literal Windows user folder paths; always use `%USERPROFILE%`, `%LOCALAPPDATA%`, or `$env:USERPROFILE`.
- Canonical fleet topology runs on **two nodes only** as defined in `ops/fleet/fleet-map.json`:
  - **Alienware (`192.168.0.40`, Workshop)**: DREAM Engine `:9180`, Lead-Gen `:8392`, Media/TTS `:8391`, OPSis Studio `:8390`, Free Claude Code `:8082`.
  - **T5500 (`192.168.0.15`, Front-of-House)**: Mission OS `:3130`, DateApp Frontend `:3200`, DateApp API `:8000`, OmniRoute `:20128`, Hermes `:8643`/`:9119`, Shared `ai-memory` MCP `:49374`.
