# Absorb Survey — archify, SlopMonster, opuspawclaw (2026-09-17)

Read-only research via `gh api`. No repos cloned. Goal: which features are worth porting into JARVIS (`ops/dashboard-jarvis`, Node `server.mjs` + vanilla JS panels, :9150) as panels vs proxied iframes vs skip.

## 1. tt-a1i/archify

**What it is:** An agent *skill*, not a hosted app. Installed via `npx skills add tt-a1i/archify -g` into `~/.claude/skills` (or `.agents/skills`). An agent (Claude Code, Cursor, Codex CLI, OpenCode) produces a typed JSON IR describing a system (architecture/sequence/dataflow/lifecycle/workflow), and a Node.js CLI (`archify/bin/archify.mjs`) deterministically renders it to a self-contained HTML/SVG file, plus optional PNG/WebM/share-card exports. It also does before/after diagram diffing off two validated JSON snapshots.

**Stack/run:** Node.js CLI + renderer modules (`archify/renderers/*`), no server, no ports, no database. Runs as a one-shot build step producing static HTML.

**License:** MIT (SPDX `MIT` from the API) — fine for private commercial reuse.

**Activity:** pushed 2026-09-17 (today), 65,807 stars (Trendshift-featured) — an actively maintained, very popular project.

**Features:**
- Five diagram renderers (architecture, sequence, dataflow, lifecycle, workflow) → self-contained HTML output.
- Before/Delta/After architecture diffing between two JSON snapshots.
- Node search, upstream/downstream reach tracing, guided "stories" inside the rendered HTML viewer.
- Brand-mark catalog and desktop-readability/engineering-profile presets.
- Export to PNG/SVG/WebM/1200×630 share cards.

**External services/keys:** none — fully local, no API keys.

**Data model:** reads a typed JSON IR file the calling agent authors; writes a single HTML file (plus optional binary exports) to disk. No persistent state of its own.

**Absorbable into JARVIS as:**
- (a) **panel** — a "Diagrams" panel that shells out to the archify CLI against JARVIS's own service/topology data (e.g., render the God's Eye node graph or the runbook's restart-set dependency chain as an interactive architecture diagram) and embeds the resulting static HTML in an iframe served from JARVIS's own origin. This is the standout absorb candidate: no server, no keys, MIT-licensed, and directly useful for visualizing the Sabretooth stack.
- (b) diff view — reuse the Before/Delta/After renderer as a "what changed" view on top of git panel diffs. **Panel.**
- Brand-mark/export tooling — **skip**, cosmetic, not needed for an internal ops dashboard.

No direct overlap with existing JARVIS panels (nothing today renders topology diagrams); it's additive.

## 2. ItsssssJack/SlopMonster

**What it is:** An agent skill / CLI, not a webapp: "turn AI-written copy into copy a human would ship." A stdlib-only Python scorer (`tools/deslop.py`) rates text 1–5 against five pattern rules (vocabulary tells, phrase shapes, punctuation habits, rhythm, and a "proof rule"), and a shell script (`tools/cleanse.sh`) hands the draft to a *different* model family (e.g., Claude wrote it → GPT cleans it) to strip the tells, then rescans until it hits 5/5. Ships a GitHub Actions gate (`slop.yml`) to fail a build below score 5.

**Stack/run:** Python 3 stdlib (no dependencies) + a bash wrapper that shells out to an installed `codex` or `claude` CLI. No server, no ports, no database.

**License:** MIT — fine for private commercial reuse.

**Activity:** pushed 2026-09-07, 393 stars.

**Features:**
- `deslop.py` scorer: five-rule linter (vocabulary, phrase shapes, punctuation, rhythm, unverifiable-claim/"proof" rule), scores text or an HTML/Markdown file, CI-gateable exit code.
- `cleanse.sh`: rival-model rewrite pass, model-family-aware (routes to the opposite vendor from whoever drafted).
- Example/receipts harness comparing a real page's before/after score.
- Installable as a Claude Code skill (`~/.claude/skills/slopmonster/`) or a plain-markdown `SKILL.md` for other agents.

**External services/keys:** none required for scoring; the cleanse step needs a locally installed `codex` or `claude` CLI (already present on this box) — no new key.

**Data model:** reads a text/HTML/Markdown file or `--text` argument; writes nothing persistent (prints score + optional cleansed text to stdout).

**Absorbable into JARVIS as:**
- (c) **skip, direct absorb into the dashboard** — this repo overlaps almost completely with the already-installed `no-ai-slop` skill in `.agents/skills`, which does the same detect/rewrite job. Don't build a JARVIS panel for it; at most, wire its scorer into a CI gate for marketing copy (already governed by `product-copy-business-only`), which is a skills/CI change, not a dashboard panel.
- The five-rule scoring approach is worth stealing as a reference for the CI gate script if not already equivalent to `no-ai-slop`'s method, but that's a skill-authoring task, not a JARVIS feature.

## 3. Trollz1004/Ai-Solutions-Jules-Code-Review-Agentic-Dashboard ("opuspawclaw")

**What it is:** A Vite + React 19 + Tailwind storefront-and-demo single-page app: a marketing/pricing page (`Hero`, `PricingSection`, `ProductCatalog`, `TrustBar`) in front of a simulated "dual-agent AI workstation" (`src/workstation/*`) called OpusPawClaw — a two-pane chat UI ("Alpha"/"Beta" agents) with a provider switcher (Claude/Gemini/GPT/Grok/Perplexity/Ollama), a Monaco-style code editor pane, a terminal panel, a diff-compare modal, and a "Task Commander" that broadcasts one prompt to both panes.

**Stack/run:** Vite dev server on port 3000 (`vite --port=3000`), React 19, Tailwind 4, `@google/genai` (Gemini) as the only wired AI SDK dependency, plus an unused `express`/`dotenv` pair in `package.json` (no server file exists — `clean` script even deletes a nonexistent `server.js`). No backend is implemented; it is static-buildable.

**License:** none (SPDX `null`, no `LICENSE` file in the tree) — **not cleared for reuse**, including inside a private repo, until Joshua (as the repo owner/copyright holder) explicitly licenses or dual-licenses it. Practically he owns `Trollz1004/...` so he can grant himself use, but there is currently no license text in the repo to point to.

**Activity:** pushed 2026-09-17 (today), 0 stars, private-feeling solo project.

**Features (all client-side simulations, confirmed by reading source):**
1. Marketing hero/pricing/catalog page for "AI Solutions Store" — **skip**, this is a storefront page for ai-solutions.store, not a JARVIS panel.
2. Dual-agent chat workstation (Alpha/Beta panes, provider picker) — **skip** for JARVIS; if kept at all it belongs on ai-solutions.store as a product, not the ops dashboard.
3. "Jules Enterprise Code Check" — reads as a real integration in the marketing copy ("Jules Verified: Secure & Performant", "324 rules checked") but `runJulesCodeCheck` in `src/lib/checkout.ts` is five hand-rolled regex checks (hardcoded secret, raw SQL concat, eval/innerHTML, missing removeEventListener, missing try/catch) with a fake fixed "rulesChecked: 324" and randomized scan-time jitter — **no external Jules API call exists**. Flag as an unverified/misleading product claim.
4. Stripe checkout modal (`StripeCheckoutModal.tsx`, `processStripeSubscription`) — also fully simulated: `await sleep(1400ms)`, no Stripe SDK call, accepts any 15+ digit numeric string as a "valid" card, generates a random license key, and stores the "subscription" only in `localStorage`. **No real payment processing.** This is a hard mismatch with the CLAUDE.md rule that Square is the actual checkout integration and this doctrine's payments are otherwise closed/frozen.
5. License key verification (`verifyLicenseKey`) — also client-only: any string prefixed `OPUS-PRO-`/`OPUS-ENT-`, or the literal `OPUS-FOUNDER-PASS`, is accepted as valid. No server-side license database.
6. Task Commander (broadcast one prompt to both panes) — directly **overlaps** with JARVIS's own already-shipped "task commander" panel (commit `25fff06c`, "feat(jarvis): task commander panel"). **Skip**, redundant.
7. Compare/diff modal, terminal panel, code editor pane — **skip** for JARVIS; these are workstation-product UI, not ops-dashboard panels, and none read live Sabretooth data.

**Product/deployed angle:** `metadata.json` names it "AI Solutions Store" storefront for "AI Solutions Store and OpusPawClaw," implying a live product tied to ai-solutions.store, but nothing in the repo calls a real backend — no server file, no API routes, only `@google/genai` wired for a chat call and everything else (Stripe, Jules, licensing) faked client-side. **Any pricing, "Jules Verified," or checkout claim in this README/app should be treated as unverified** until a real Stripe integration and a real Jules (or equivalent) scanning backend are built — currently it would be selling a product whose two headline features (security scan, payment) do not exist server-side.

**Absorbable into JARVIS as:** nothing recommended. This repo's only path forward is as a genuine ai-solutions.store product (with real Stripe/Square checkout and a real code-scan backend), separate from JARVIS. If Joshua wants a "run Jules-style code review" utility inside JARVIS, it would need to be built fresh against a real scanner — the current regex stub isn't worth porting as-is; at most reuse the five rule *categories* as a starting checklist.

## Summary table

| Repo | License verdict | Best JARVIS action |
|---|---|---|
| archify | MIT, reusable | Panel: diagram/topology renderer via CLI, iframe the static HTML output |
| SlopMonster | MIT, reusable | Skip as a panel — overlaps `no-ai-slop` skill already installed |
| opuspawclaw | No license, not cleared | Skip entirely for JARVIS; separate product-track decision, and its Jules/Stripe/license claims are unverified simulations |
