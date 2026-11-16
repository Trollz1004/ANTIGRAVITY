# Stray Master & Hermes Sync Branch Fold Report (2026-11-16)

Outcome: Every commit and file on `refs/heads/sabretooth/hermes-opsis-sync` (`393fd1a3`) and `refs/tags/archive/master-2026-11-04` (`4e023a1f`) has been audited against `origin/main` (`9f0f2aa3`). All legitimate unmerged code and skill metadata from commit `74ced3a5` (`HermesLeadGen: add /gtm-studio/ mount + nav tab`) have been folded cleanly into `apps/hermes-leadgen/` with environment-variable path resolution and automated tests. Neither `refs/heads/sabretooth/hermes-opsis-sync` nor `refs/tags/archive/master-2026-11-04` was deleted by this branch; the Judge deletes the remote branch and tag after merge.

---

## 1. Remote Refs Inspected

- `refs/heads/sabretooth/hermes-opsis-sync` -> `393fd1a364f0608d6c2098f48840e6c872dc9bbe` (6 commits from orphan root `a32f1231`)
- `refs/tags/archive/master-2026-11-04` -> `4e023a1f507781a089f6138cc71a0d2a4ecc3525` (8 commits: the 6 commits of `sabretooth/hermes-opsis-sync` plus `cc2d8540` and `4e023a1f`)
- Remote branch and tag preservation: **Both remote refs remain untouched on `origin` for the Judge to delete after merge.**

---

## 2. Commit-by-Commit Audit (`a32f1231` .. `4e023a1f`)

### Commit 1: `a32f12311509f6974bcbfc7738f82c11d4ea66a2` (2026-10-28)
- **Subject**: `feat(sabretooth-opsis): add YouTube Shorts <=59s guard, natural female TTS, and 4h strike worker (:8391)`
- **Status on `main`**: **Already on `main`** (cherry-picked in `4c7828c2` / PR #335 `f533b706`, with path/IP sanitization and private-only upload enforcement in `587560f5`).
- **Disposition**:
  - `youtube-shorts-podcast-engine/.gitignore`, `affiliate-partners.json`, `channels-config.json`, `gemini_female_voice_tts.mjs`, `inbound-crm-engine.mjs`, `public/index.html`, `sabretooth_opsis_worker.mjs`, `server.mjs`, `shorts_duration_guard.mjs`, `test/opsis-cut-and-reach.test.mjs`, `test_sabretooth_opsis_worker.mjs`, `timeline-engine.mjs` are all present on `main` in their hardened form (`privacyStatus: 'private'`, `@OnlineRecycleTech`, `harvey_scraping_permitted: false`, loopback default).
  - Duplicate files `youtube-shorts-podcast-engine/.claude/skills/rooflo-opsis-cut-and-reach/SKILL.md`, `youtube-shorts-podcast-engine/CLAUDE.md`, and `youtube-shorts-podcast-engine/index.html` were intentionally omitted when PR #335 landed because `.agents/skills/rooflo-opsis-cut-and-reach/SKILL.md`, root `CLAUDE.md`, and `youtube-shorts-podcast-engine/public/index.html` are the canonical locations.

### Commit 2: `ee126a6fce8201d72436f546209af57cd2ceef43` (2026-10-29)
- **Subject**: `feat(hermes-leadgen): tabbed GUI with 5 agent profiles, soul.md per tab, agent chat, Notes & Ideas, auto-start tasks`
- **Status on `main`**: **Already on `main`** under `apps/hermes-leadgen/` (landed in PR #322 `8f745826` and upgraded to OPSis Desk v1 in PR #347 `d3c80d14`).

### Commit 3: `8d98726fe1a69baf4da28a6a1546bf8488c593d2` (2026-10-29)
- **Subject**: `feat(sabretooth): upgrade :8392 Studio, :9119 Jarvis Orchestrator, :8082 FCC, Dual Graphy, Harvey 3-Type Lead Gen & RooFlow/SpecKit Auto-PR Push Loop`
- **Status on `main`**: **Core work already on `main`; rule-violating files excluded.**
- **Disposition**:
  - `apps/hermes-leadgen/*`, `.agents/skills/rooflo-opsis-cut-and-reach/SKILL.md`, `.specify/extensions.yml`, `.specify/specs/001-sabretooth-circular-pr-loop/tasks.md`, and `youtube-shorts-podcast-engine/boot-sabretooth-services.ps1` are already on `main` (PR #322 `8f745826` and PR #335 `4c7828c2`).
  - `.github/workflows/cloud-judges-validate-merge.yml` is **excluded** per standing Judge ruling (auto-merge workflows are prohibited; PR #342 `5369ff56` removed auto-land so only reviewed PRs merge).

### Commit 4: `b9cdbf09a60918df91a9ecf7e391fe7c6da2eb92` (2026-10-29)
- **Subject**: `Mandatory Post-Work Auto-Commit, Branch Push (sabretooth/auto-pr-sync) & GitHub PR Creation for Cloud Judges`
- **Status on `main`**: **Already on `main`** in `apps/hermes-leadgen/` (landed in PR #322 `8f745826` with non-faked hook statuses and same-origin POST guards).

### Commit 5: `74ced3a5c87fa01df718a3bc6ca340e8ab4838a9` (2026-11-01)
- **Subject**: `HermesLeadGen: add /gtm-studio/ mount + nav tab`
- **Status on `main`**: **Partially on `main`, remainder folded in this PR.**
- **Disposition**:
  - Already on `main`: `SABRETOOTH_SOURCE_DIR` support in `apps/hermes-leadgen/scripts/node-auto-pr-push.ps1` (merged in PR #331 `12bdddee`), OPSis naming, and official-API-only Harvey rules (merged in PR #322 `8f745826` and PR #347 `d3c80d14`).
  - **Folded in this PR**:
    1. `apps/hermes-leadgen/server.js`: Added `/gtm-studio/` static mount with directory-to-`index.html` rewrite, `path.relative` traversal guard returning HTTP 404, and root-relative asset path prefix rewriting (`/gtm-studio/...`), resolving `GTM_STUDIO_DIR` via `process.env.GTM_STUDIO_DIR || path.join(USER_HOME, 'remakes', 'clay-com', 'site')` (zero hardcoded Windows user paths). Also folded `GET /api/dreamforge/tools` and `POST /api/dreamforge/run` using `process.env.DREAMFORGE_URL || 'http://127.0.0.1:20128/dreamforge/index.html'` (zero hardcoded LAN IP) and added the 4 Dreamforge / CLI-Anything skill IDs to the `youtube` profile definition.
    2. `apps/hermes-leadgen/index.html` & `apps/hermes-leadgen/renderer.js`: Added Tab 10 (`data-tab="gtmstudio"`, `id="tab-gtmstudio"`, `10. Prospecting & YouTube Studio`) in the compatibility tab bar and wired `.tab-btn` click switching in `renderer.js`.
    3. `apps/hermes-leadgen/skills.json`: Added the 4 unmerged skill entries (`dreamforge_world_seed`, `dreamforge_art_styles`, `dreamforge_roleplay`, `cli-anything`) while preserving PR #335's `agent-reach` and `last30days` model restrictions (`youtube: false`).
    4. `apps/hermes-leadgen/test/hermes-leadgen.test.js`: Added `gtmstudio` to Test 7's tab assertions and added Test 17 covering `/gtm-studio/` directory rewrite, asset prefix rewrite, traversal protection, and `/api/dreamforge/tools` + `/api/dreamforge/run`.

### Commit 6: `393fd1a364f0608d6c2098f48840e6c872dc9bbe` (2026-11-02, tip of `sabretooth/hermes-opsis-sync`)
- **Subject**: `feat(sabretooth-opsis): sync 3 YouTube channels, OPSis worker, Dream Studio design, and Dual Graphy`
- **Status on `main`**: **Code and design doc already on `main`.**
- **Disposition**:
  - `docs/dream-studio-design.md`, `youtube-shorts-podcast-engine/channels-config.json`, and `youtube-shorts-podcast-engine/sabretooth_opsis_worker.mjs` were cherry-picked in `4c7828c2` (PR #335) and sanitized on `main`.

### Commit 7: `cc2d8540dcf41d799fd8bd7b36ff4babfd5901cf` (2026-11-02, on `archive/master-2026-11-04`)
- **Subject**: `Add MESSAGE-TO-CLAUDE.md — remake skill/repo handoff for Claude review`
- **Disposition**: **Recorded here and excluded from repo root.** `MESSAGE-TO-CLAUDE.md` was a point-in-time handoff note containing hardcoded Windows user profile paths and the retired Sabretooth LAN IP. The clean-room Remake `100% Yours` rule is canonically codified on `main` in `docs/standards/AGENT-STANDARD.md` (Section 3) and `AGENTS.md`.

### Commit 8: `4e023a1f507781a089f6138cc71a0d2a4ecc3525` (2026-11-02, tip of `archive/master-2026-11-04`)
- **Subject**: `Add CLAUDE-REVIEW-PACKAGE.md for Alienware review`
- **Disposition**: **Recorded here and excluded from repo root.** `CLAUDE-REVIEW-PACKAGE.md` bundled local files (`SKILL.md`, `score.json`, `MAKE-IT-YOURS.md`) containing hardcoded Windows user profile paths and third-party source headlines from a local remake folder. Its clean-room validation requirements are already enforced by `docs/standards/AGENT-STANDARD.md` and `.agents/skills/` on `main`.

---

## 3. Summary of Intentionally Excluded Files & Reasons

1. **`.github/workflows/cloud-judges-validate-merge.yml`**: Excluded because standing Judge rulings prohibit auto-merge/auto-land workflows (enforced in PR #342 `5369ff56`); all merges to `main` require human or signed-in Judge review.
2. **Root `AGENT.md`, `AGENTS.md`, `CLAUDE.md`, `GEMINI.md` from stray branch**: Excluded because `main` already replaced the pre-Nov-2 long context files with the 30-line lean context router (`PR #335`, `docs/standards/AGENT-STANDARD.md`, `docs/standards/backups-full-context/*.full-backup`) and house-rule pointers enforced by `tests/definitions-drift.test.mjs`.
3. **Root `api.workflow.json`, `workflow_api.json`, and `Agent Universal/agent-workflow-graphy.json`**: Excluded because those stray copies contain hardcoded Windows user profile paths and retired Sabretooth LAN IP literals banned by `scripts/doctrine/doctrine-check.py`; `main` tracks `docs/memory-layer/agent-workflow-graphy.json` and `mission-control/workflow_api.json`, and `apps/hermes-leadgen/server.js` synthesizes the live Sabretooth workflow graph dynamically when `api.workflow.json` is absent.
4. **`Sabretooth/gemini-to-gemini.md`, `Sabretooth/hermes-to-hermes.md`, and `HermesLeadGen/graphify-out/*`**: Excluded because `*gemini-to-gemini*` and `graphify-out/` are intentionally gitignored runtime/session artifacts in `.gitignore`.
5. **`MESSAGE-TO-CLAUDE.md` and `CLAUDE-REVIEW-PACKAGE.md`**: Excluded from root because they contain hardcoded local user paths and retired LAN IP literals; their handoff disposition is recorded in Section 2 above.
