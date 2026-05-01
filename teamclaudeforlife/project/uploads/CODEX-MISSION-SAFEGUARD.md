Codex Mission Safeguard

Date: 2026-03-31
Node: SABRETOOTH
Vault root: C:\Users\joshl\OneDrive\Personal Vault-Sabretooth

Purpose:
- preserve a clean off-repo continuity lane for launch-critical recovery
- keep recovery notes and credentials outside normal runtime paths
- reduce drift by pointing every recovery decision back to canonical repo docs

Guardrails:
- do not treat this vault as a runtime source for OpenClaw, PaperClip, or any other orchestration path
- do not treat recovery env files as policy or public-copy authority
- if a recovery file conflicts with `C:\ANTIGRAVITY\briefings\REPOSITORY_RECORD.md`, the repo wins
- service-specific credentials may differ from the Windows / OneDrive identity and must not be generalized into doctrine

Current recovery truth:
- Repo: `C:\ANTIGRAVITY`
- Branch: `main`
- Head: `baa34c5a32b3beb8912de1ce378a1d43c9aa3018`
- Frontend: `https://youandinotai.com`
- Dashboard gateway: `https://dashboard.aidoesitall.website`
- PaperClip app: `https://mcp.youandinotai.com`
- Current PaperClip owner login note: `PAPERCLIP-OWNER-LOGIN-2026-03-31.txt`

Mission floor:
- ENIGMA / OMEGA separation stays absolute
- secrets stay out of git
- LLC-controlled revenue follows the current conservative `10% charitable cap` doctrine until canonical repo docs say otherwise

Recovery lane:
- active continuity docs remain in the root of this vault
- secret bundles and historical env exports live under `RECOVERY-SECRETS-NOT-DOCTRINE`
