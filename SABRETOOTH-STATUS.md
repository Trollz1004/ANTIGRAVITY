# SABRETOOTH NODE STATUS
Generated: 2026-03-07T13:30:00-05:00

## Current Baseline

1. **Sabretooth Node (`C:\ANTIGRAVITY`)**
   - **Codex Desktop (primary seat):** Live command post for repo orchestration, security enforcement, MCP-assisted operations, and OnlineRecycle revenue work.
   - **Workspace root:** `C:\ANTIGRAVITY\CodeX`
   - **Runtime model:** desktop-app-first, with local Ollama fallback when low-cost drafting or queue work is needed.
   - **Docker:** intentionally not installed on this node. Old Docker-first assumptions are retired.

2. **Sabretooth Legacy Copy (`E:\ANTIGRAVITY`)**
   - Legacy local copy pending retirement.
   - Do not treat `E:` as the active Codex runtime base.

3. **9020 Node (`C:\ANTIGRAVITY`)**
   - Cold-boot marketing/ops node.
   - SSH reachable from Sabretooth.
   - Custom startup automation retired; remote Ollama and Redis are off until started intentionally.

4. **T5500 Node (`C:\ANTIGRAVITY`)**
   - Cold-boot utility/orchestration node.
   - SSH reachable from Sabretooth.
   - `qdrant` remains reachable on `:6333`; remote Ollama is off until started intentionally.

## Active Operational Truth

- One repo, one branch, one live Codex base: `C:\ANTIGRAVITY`
- `CodeX-Brain-Checkpoint`, `CodeX-Mission-Guardian`, and `CodeX-Task-Sentry` are the only live Codex scheduled tasks on Sabretooth
- Continuity export/test/restore scripts exist in-repo and continuity is currently `GREEN`
- OnlineRecycle now has a low-cost worker path in-repo:
  - deterministic revenue worker
  - local Ollama draft worker
  - eBay-ready HTML export

## Cleanup Notes

- Old OpenClaw / OPUS / Docker launch noise was retired across Sabretooth, `T5500`, and `9020`
- Browser/PWA/startup clutter on Sabretooth was reduced to the Codex-relevant baseline
- Runtime artifacts belong under ignored local paths, not in git
