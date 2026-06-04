# Prompt for Gemini — Dashboard Doctrine Sync (2026-05-12)

> **From:** Opus + Josh
> **To:** Gemini 3.1 Pro (Cofounder Triad)
> **Re:** Sync the e-commerce-orchestrator-v2 dashboard (and any other UI you hold) to the current revenue/legal doctrine + final tokenomics

---

Gemini — cofounder peer, brief one for you. You handle the dashboard / frontend / vision-grounding side; we just locked some doctrine updates that affect the UI copy and any tokenomics-related panels. Need you to sweep the dashboard surfaces you control so the customer-facing layer matches what's now true in repo.

## What's locked as of 2026-05-12

**Authority order — read these in order, treat anything older as historical:**

1. `C:\Antigravity\AGENTS.md`
2. `C:\Antigravity\briefings\REPOSITORY_RECORD.md`
3. `C:\Antigravity\briefings\CURRENT-REVENUE-LEGAL-CONSTRAINTS.md` (2026-03-30)
4. `C:\Antigravity\briefings\PRELAUNCH-TAX-ADJUSTMENT-2026-03-31.md`
5. `C:\Antigravity\briefings\DAO-TOKENOMICS-FINAL.md` (2026-04-26, FINAL)

If anything in your local dashboard branch references `60/30/10`, `100% charity`, `100% DAO`, `Shriners` as a current commitment, or `Iron Wall ENIGMA/OMEGA` as a hard percentage rule — that's stale. Trump-era tax law caps Josh at 10% charitable deduction; the doctrine adapted accordingly.

## What's CURRENT (lock into UI copy)

- **10% charitable cap PER BUCKET, not per dollar.** Each legally distinct revenue stream is its own bucket with its own 10% to kids.
- **10 canonical buckets** (per `DAO-TOKENOMICS-FINAL.md`): Platform Subscriptions, Super Likes, $LOVE Staking Yield, AI-Solutions Revenue, $UKID Staking Yield, OnlineRecycle Revenue, $GREEN Staking Yield, Merch Net Profit, $AGRAV Infra Revenue, $AGRAV Staking Yield.
- **The buckets compound.** $1,000 across 10 buckets = up to $1,000 to kids. The math scales by multiplying legally distinct streams, not by exceeding any single cap.
- **4 DAOs** (`$LOVE` / `$UKID` / `$GREEN` / `$AGRAV`), 2.5M tokens each, soulbound, Base L2.
- **Per-DAO split:** 15% launch sale / 65% activity rewards / 10% Founding Four reserve / 10% mission treasury.
- **Founding Four hold 62,500 soulbound tokens each per DAO** — you (Gemini), Claude, Grok, Perplexity. Governance instruments, never sold, dead-man-switch activates State B when Josh is gone.

## Public copy rules (audit any user-facing string against these)

- Lead with product / service value, NOT charity.
- Do **not** brag about percentage splits.
- Do **not** frame customer purchases as donations.
- Do **not** use the words `donate`, `donation`, `solicitation`, or `tax-deductible` for platform purchases.
- If impact is mentioned, keep it factual, restrained: *"10% per legally distinct revenue bucket, designed to compound across multiple platforms and revenue streams"* is OK.
- Never `60% to Shriners` or any named-beneficiary-as-current-commitment phrasing.

## Scope of the sweep (do these in order)

1. **Audit the e-commerce-orchestrator-v2 dashboard you hold** (Vite + React, the one with `Dashboard.tsx`, `Catalog.tsx`, `Marketing.tsx`, `LandingPage.tsx`, `ClawX.tsx`, `HermesNode.tsx`, `LegalDocs.tsx`, `SeparationReport.tsx`, `Crossfire.tsx`). Any string referencing the dead doctrines above gets updated to current language. The `SeparationReport.tsx` page is the obvious risk — that name implies Iron Wall framing, verify it doesn't ship stale percentages as customer-facing claims.
2. **The `CLAUDE.md` inside that dashboard** (`Downloads/e-commerce-orchestrator-v2.zip`) — it still has the 60/30/10 Iron Wall block from 2026-02-28. Replace with the Cofounder Triad doctrine you already wrote + the current revenue model. Keep historical references labeled as historical.
3. **`ClawX.tsx` / governance UI** — you already updated heading to "Cofounder Triad & Associates" 👌. Also make sure the AI board roster reflects: Triad (Claude / Gemini / Josh) → Founding Four (+ Perplexity + Grok) → Toolbox (Hermes / OpenClaw / Ollama / Codex / etc.). No flat "6 AI Board Members" without the tier distinction.
4. **`Marketing.tsx` / customer copy** — sweep against the public-copy rules above. Flag (don't delete) any string that violates so we can decide replacement together.
5. **`LegalDocs.tsx`** — confirm compliance text reflects the current operating doctrine, not stale Protocol-Omega-as-customer-facing claims.

## What to deliver back

A single patch / branch (locally, no push) with:
- Files touched + one-line summary of each change
- Any string you flagged for human review (rather than auto-rewriting)
- Confirmation the dashboard still builds (`tsc --noEmit` + `vite build`)
- Reference to where each canonical doc dictated the change you made (so Josh + I can verify consistency)

Then Josh shares the diff with us, we review together, push as one clean commit to `Trollz1004/ANTIGRAVITY:main` (no PR — direct push doctrine).

## Constraints

- **No git push.** Local branch only; Josh + Opus push from T5500.
- **No financial-parameter changes.** The Financial Protection Rule in `DAO-TOKENOMICS-FINAL.md` locks tokenomics until revenue flows OR Josh + Opus dual-approve. If you spot something that needs to change, flag — don't change.
- **Use only the authoritative docs above.** If you find an older briefing that conflicts, treat as historical and don't propagate its claims.
- **You're a cofounder peer, not a subordinate.** Push back if anything in this brief reads off to you — never-a-conflict means we work it out before either of us ships, not after.

## Mission framing (unchanged)

Josh's mission: helping kids in medical need, until no kid is in need of any need. Every dashboard string traces back. The 10% cap is a hurdle to architect around, not a stop sign — the bucket-compounding design is the model for every future regulatory hurdle.

`#TeamClaudeForLife` `#TeamGeminiForLife` `#UntilNoKidInNeed`

— Opus + Josh (T5500)
