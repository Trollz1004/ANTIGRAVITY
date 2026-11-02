# Message to Claude — Remake Skill/Repo for ANTIGRAVITY

**To:** Claude (official lane, not on this node/session)  
**From:** Hermes / OPSis on Sabretooth (192.168.0.8)  
**Subject:** Remake skill/repo for ANTIGRAVITY — how it works, what’s already done, and what I need from you

---

The remake work in this repo is not casual frontend tweaking. It’s a pixel-verified, slot-based site clone system backed by `remake.mjs` and a strict skill contract (`C:\Users\joshl\.remake\plugins\remake\skills\remake\SKILL.md`).

## What’s already done

- clay.com captured and scored: `C:\Users\joshl\remakes\clay-com\remake\score.json`  
  - Desktop 100%, Phone 99.92%, Motion 100%
  - 665 slots cataloged in `C:\Users\joshl\remakes\clay-com\remake\content.json`
- 665/665 slots are swapped to OPSis Prospecting & YouTube Studio branding (headlines, copy, buttons, menus, fonts, colors, logos, icons, photos, videos, alt text, meta)
- Local proof board lives at `C:\Users\joshl\remakes\clay-com\_remake\` with `/swap/` and `/proof/` routes
- The swapped site is mounted under HermesLeadGen at `/gtm-studio/` (see `HermesLeadGen/server.js` and `HermesLeadGen/index.html`)
- Maestro repo cloned and patched for AMD RX 6800 (RDNA 2 / gfx1030) support:
  - `C:\Ai-Dream-Team\Antigravity\repos\Maestro\app\setup_config.json`
  - `C:\Ai-Dream-Team\Antigravity\repos\Maestro\app\setup.py`
  - `C:\Ai-Dream-Team\Antigravity\repos\Maestro\app\services\hardware_detect.py`
  - `C:\Ai-Dream-Team\Antigravity\repos\Maestro\app\services\perf_recommend.py`
  - `C:\Ai-Dream-Team\Antigravity\repos\Maestro\app\docs\AMD-INSTALLATION.md`

## What the skill enforces

- `remake capture` writes a deterministic `content.json` and `score.json` — every slot has a `swap` field that must be populated for 100% ownership
- `remake score` reruns visual diff + motion checks; any branded residue (fonts, meta, og:image, cookies, CDN URLs) fails the % threshold
- The skill blocks publishing until Judge/score approves. No hand-waved “looks close enough.”
- Paths are Windows-native and node-based. Do not assume Linux/macOS paths or bash-only workflows here.

## What I need from you

1. Review `C:\Users\joshl\.remake\plugins\remake\skills\remake\SKILL.md` before touching any `remake/` files
2. Treat `C:\Users\joshl\remakes\clay-com\remake\score.json` as the source of truth for what’s already verified
3. Do not overwrite `remake/original/` or `score.json` — those are read-only proof artifacts
4. All future branding/content swaps must update `content.json` and rerun `node C:\Users\joshl\.remake\engine\bin\remake.mjs score` to verify
5. If you change server-side serving, keep the `path.relative` traversal guard and Host/Origin allowlists intact
6. For Maestro changes, tests live under `C:\Ai-Dream-Team\Antigravity\repos\Maestro\tests\` — run them before pushing

If anything in the skill or score format is unclear, ask before editing. The whole point is reproducible, test-approved rebranding — not one-off HTML edits.

---

**Key file paths (exact):**

| Purpose | Path |
|---|---|
| Remake engine | `C:\Users\joshl\.remake\engine\bin\remake.mjs` |
| Remake skill | `C:\Users\joshl\.remake\plugins\remake\skills\remake\SKILL.md` |
| Clay remake project | `C:\Users\joshl\remakes\clay-com\` |
| Original captured site | `C:\Users\joshl\remakes\clay-com\remake\original\` |
| Swapped content (665 slots) | `C:\Users\joshl\remakes\clay-com\remake\content.json` |
| Score proof | `C:\Users\joshl\remakes\clay-com\remake\score.json` |
| Rebrand guide | `C:\Users\joshl\remakes\clay-com\MAKE-IT-YOURS.md` |
| Proof board | `C:\Users\joshl\remakes\clay-com\_remake\` |
| HermesLeadGen server | `C:\Ai-Dream-Team\Antigravity\HermesLeadGen\server.js` |
| HermesLeadGen dashboard | `C:\Ai-Dream-Team\Antigravity\HermesLeadGen\index.html` |
| YouTube engine config | `C:\Ai-Dream-Team\Antigravity\youtube-shorts-podcast-engine\channels-config.json` |
| Maestro repo | `C:\Ai-Dream-Team\Antigravity\repos\Maestro\` |
| Marketing content output | `C:\Users\joshl\Useable Content for Marketing\` |
| Hermes memory | `C:\Users\joshl\AppData\Local\hermes\memories\MEMORY.md` |
