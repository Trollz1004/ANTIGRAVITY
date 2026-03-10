# DECISIONS LOG — WHY WE DID WHAT WE DID

**Last Updated**: 2026-03-07T15:32:58-05:00

Every architectural decision is recorded here so no future session re-debates it.

---

## 2026-03-10: Payment truth must be verified from live repo files, not archaeology

**Decision**: Treat live payment truth as whatever is currently implemented in `C:\ANTIGRAVITY` under the backend payment files, frontend payment links, and the canonical payment briefing, and treat old PR email archaeology or export folders as recovery-only unless re-verified.
**Why**: Payment questions were drifting between old Stripe-era comments, dormant Paymentwall exports, and newer Square code. That is exactly the kind of memory loss that creates false architectural pivots.
**Impact**: `briefings/LIVE-PAYMENT-SOURCE-OF-TRUTH.md` is now the first stop for payment questions. Future sessions should verify `verify.py`, `webhooks.py`, `config.py`, `health.py`, `App.tsx`, and `square_catalog.json` before accepting any historical claim.
**Status**: Active

## 2026-03-10: The live payment blocker is identity binding, not Square's ability to charge $1

**Decision**: Stop re-debating whether Square can process the $1 Bot-Shield payment and focus payment debugging on user correlation between checkout and webhook confirmation.
**Why**: The March 5, 2026 Square receipt proves the charge path worked, and the live backend already uses Square. The remaining operational risk is whether the webhook can deterministically bind the payer back to the right user and verification event.
**Impact**: Payment work should prioritize validating the real Square webhook identity-binding path, while Google Pay remains a separate evidence question until a receipt is found.
**Status**: Active

## 2026-03-07: Node social automation is draft-first and human-gated, not autoposted

**Decision**: Replace the old browser-based multi-platform posting daemon with a legal-safe node automation layer that only generates draft packs, handoff queues, owned-site queues, and audits.
**Why**: The repo still contained a 24x7 browser autoposter for X, Facebook, Reddit, LinkedIn, and many other third-party platforms. That is the wrong default for the current operating model and creates needless terms-of-service and safety risk.
**Impact**: `scripts/social_engine/platform_policy.py` now disables live posting by default for every third-party platform. X and Facebook are explicitly Perplexity-gated, Reddit is Devvit/Opus/Perplexity-gated, LinkedIn is draft-only, and the new `Run-Safe-NodeAutomation.ps1` / `generate-safe-marketing-drafts.py` path becomes the approved node automation surface.
**Status**: Active

## 2026-03-07: The node automation boundary must be generated as an artifact, not remembered informally

**Decision**: Generate a node automation matrix and a public-copy policy audit on every approved control/audit run, instead of relying on memory or ad hoc explanations.
**Why**: Future sessions were at risk of drifting back into “maybe the nodes can post” or “maybe this warning is harmless” because the allowed surface was not explicit enough. A generated artifact is harder to reinterpret and easier to verify.
**Impact**: `generate-safe-marketing-drafts.py` now writes `CodeX/state/marketing/node-automation-matrix-latest.md` / `.json`, and `scan-public-copy-policy.py` writes `public-copy-policy-audit-latest.md` / `.json`. The approved tasks on Sabretooth and T5500 refresh those artifacts automatically.
**Status**: Active

## 2026-03-07: Public revenue-support copy should avoid donation/charity wording by default

**Decision**: Keep customer-facing OnlineRecycle and YouAndINotAI revenue-support copy free of `donate`, `donation`, `charity impact`, and similar phrasing unless a reviewed legal reason requires it.
**Why**: The repo has a standing Florida §496.405 guardrail, and the previous eBay/export/app copy was still carrying older “charity impact / every dollar goes to / Stripe-era” language that made future automation noisier and riskier.
**Impact**: `scripts/ewaste-crosslister-pipeline.js` now emits neutral revenue-note wording, `export-ebay-ready-html.js` mirrors that wording, and the public copy audit is now scoped tightly enough to catch real customer-facing drift without flagging its own internal guidance.
**Status**: Active

## 2026-03-07: Square is the canonical public checkout path for YouAndINotAI

**Decision**: Replace stale public `Stripe` references in the live YouAndINotAI app/policy copy with the canonical Square-hosted checkout links and Square wording.
**Why**: The backend had already been migrated toward Square, but the public app and policy copy still contained old Stripe links and descriptions. That drift is operationally dangerous and made the new copy audit immediately fail.
**Impact**: `youandinotai/src/App.tsx`, `youandinotai/src/app/pages/Register.tsx`, `youandinotai/PRIVACY_POLICY.md`, `youandinotai/REFUND_POLICY.md`, and `youandinotai/TERMS_OF_SERVICE.md` now align with the Square-first payment model and the stricter wording rules.
**Status**: Active

## 2026-03-07: Promote the Sabretooth ops stack into `main` instead of keeping it as local-only glue

**Decision**: Track the real Sabretooth/C-side operational scripts and runbooks in git once they are verified, instead of leaving them only in one dirty local checkout.
**Why**: `codex-doctor`, continuity export/restore/test, Sabretooth cleanup/finalize helpers, and the OnlineRecycle worker path are part of the actual operating model now. Leaving them untracked guarantees future drift, repeated rediscovery, and fragile disaster recovery.
**Impact**: `AGENTS.md`, continuity tooling, Sabretooth cleanup helpers, and the OnlineRecycle low-cost worker path now belong in the promoted repo path. Future cleanup should keep moving by reviewed slices, not by giant overlay commits or blind resets.
**Status**: Active

## 2026-03-07: Keep the live YouAndINotAI backend and harden it surgically instead of rewriting it

**Decision**: Treat Claude review branches as patch sources, not merge targets, and keep the live `youandinotai-api` codebase moving through small verified fixes instead of a full rewrite.
**Why**: The reviewed branch `origin/claude/review-changes-mmeucm90aurnm0ht-3sxI9` contained useful ideas, but it also lagged the current repo and would have regressed newer work if merged wholesale. The real backend issues were localized: stale Square/health wiring, missing endpoint throttling, and leftover backend Stripe dependency drift. Those are cheaper and safer to correct in place than to rebuild the service.
**Impact**: The live backend now uses explicit Square readiness checks, auth/verify rate limiting with trusted-proxy handling, and a reduced dependency set. Focused backend tests pass under `uv` + Python 3.12. Default path remains incremental hardening, not rewrite theatre.
**Status**: Active

## 2026-03-07: OnlineRecycle daily worker is deterministic, local drafts are template-first

**Decision**: Use a deterministic daily revenue worker for OnlineRecycle cashflow tasks, and reserve Ollama for low-cost fallback drafting and structured intake reply generation.
**Why**: The business needs a cheap path that finishes every time. Deterministic daily packs are more reliable than waiting on local model generation, while template-first local drafting still reduces paid-token usage for real intake responses.
**Impact**: `scripts/run-onlinerecycle-revenue-worker.ps1` now produces the daily marketing pack, response templates, cashflow checklist, and eBay export reliably. `scripts/Run-OnlineRecycle-LocalWorker.ps1` and `scripts/onlinerecycle-local-worker.js` remain the local drafting path, with `qwen2.5:7b` as the default Sabretooth fallback model.
**Status**: Done

## 2026-03-07: Use browser automation for inbox and web audits, not for replacing the deterministic OnlineRecycle core

**Decision**: Keep the deterministic OnlineRecycle core local and cheap, and aim browser-side automation at inbox polling, Square/storefront audits, and lead research instead of more generative copy loops.
**Why**: The current bottleneck is web/inbox handling and live copy drift, not lack of text generation. More Ollama/OpenClaw-style generation adds noise, while browser-side automation can actually close leads and catch public drift.
**Impact**: Best next automations are Gmail/FormSubmit intake parsing, Square drift checks, and local lead-source research. Treat OpenBrowser/OpenClaw-style browser tooling as ops automation, not the primary content engine.
**Status**: Active

## 2026-03-07: All three Windows nodes should boot lean unless a task directly supports the current operating model

**Decision**: Remove or disable stale startup launchers and scheduled tasks across Sabretooth, `T5500`, and `9020`, keeping only the minimal node-specific services that still support the current Codex/Ollama workflow.
**Why**: The old OPUS/OpenClaw/Docker/Chrome auto-start layer creates repeated confusion, background cost, and false recovery behavior after reboot. The current operating model is desktop-app-first on Sabretooth, Ollama-ready on the worker nodes, and explicit opt-in for anything heavier.
**Impact**: Sabretooth keeps the live `CodeX-*` tasks only. `T5500` now has no custom boot automation, no custom Startup entries, and only `OneDrive` left in `HKCU\...\Run`; `OpenClaw Gateway` and broken `OPUS-CLI-AutoStart` were removed entirely. `9020` now has no custom boot automation, no custom Startup entries, only `OneDrive` left in `HKCU\...\Run`, and `Redis` changed to `Manual`; `OPUS-Marketing-Watchdog` and `OPUS Auto Start` were removed entirely. Remote `Ollama` is now opt-in, not always-on.
**Status**: Active

## 2026-03-07: Drive boundary was an operational phase, not a permanent religion

**Decision**: The old Claude-vs-Codex drive split is no longer canonical. `C:\ANTIGRAVITY` is now the live Codex base on Sabretooth, and the old `E:` isolation can be retired once the fresh `C:` thread is confirmed.
**Why**: The user explicitly dropped the old ownership boundary and wants one primary home instead of duplicate repo copies across SSDs. The runtime tasks and MCP setup now point to `C:`.
**Impact**: Stop preserving the old drive split in new operational docs. Treat `E:` as a retirement candidate, not the live home.
**Status**: Active

## 2026-03-07: Keep `E:` primary, but allow Codex overflow onto `C:` when it is materially useful

**Decision**: Keep `E:\ANTIGRAVITY` and `E:\ANTIGRAVITY\CodeX` as the primary Codex house, but allow Codex to use `C:` for caches, backups, mirrors, or bulky working data when that actually helps operations.  
**Why**: Joshua explicitly removed the old "don't touch other drives" constraint. At the same time, `E:` is not under storage pressure right now, so moving data just to move it would create churn without benefit.  
**Impact**: Default to `E:` for active repo work. Use `C:` deliberately for overflow or space management when needed. Do not relocate repo data blindly.  
**Status**: Superseded by the `C:` home cutover

## 2026-03-07: Sabretooth should boot lean

**Decision**: Strip Sabretooth startup down to the Codex-relevant baseline and archive the stale ENIGMA/social/browser auto-launch junk instead of letting it run on boot.
**Why**: Sabretooth is now the main Codex seat. Auto-starting old dashboards, Facebook PWAs, Comet, and Chrome background launch just wastes boot time and muddies the operational state.
**Impact**: `Comet.lnk`, `Facebook.lnk`, and the Startup copy of `start-aidoesitall.bat` were removed from Startup, Chrome auto-launch was removed from `HKCU\...\Run`, and the Desktop source of `start-aidoesitall.bat` was archived under `C:\Users\joshl\OneDrive\Desktop\_archive\codex-cleanup-2026-03-07`. Keep `Ollama.lnk` and `OneDrive` only. `Clawdbot Gateway` still needs an elevated session if it is to be disabled.
**Status**: Active

## 2026-03-07: Verification-first between Claude and Codex

**Decision**: Prefer direct verification via git, SSH, files, and service health instead of assuming the other house is current.
**Why**: Both Claude and Codex now touch real infra and real repo state. Secondhand summaries are useful, but they should collapse to evidence whenever verification is possible.
**Impact**: Shared handoffs should stay concise and include commit positions, ops health, local deltas, and current risks.
**Status**: Active

## 2026-03-07: Disable dead legacy OPUS tasks on Sabretooth

**Decision**: Disable the old `OPUS-*` scheduled tasks on Sabretooth that point at missing files.
**Why**: They were firing against deleted paths and generating background failure noise that obscured the live `CodeX-*` stack.
**Impact**: Keep `CodeX-*` tasks as the active scheduler layer on Sabretooth. Treat legacy OPUS tasks as retired unless explicitly rebuilt.
**Status**: Done

## 2026-03-07: Codex continuity pack with split public/secret backup

**Decision**: Add a continuity export/test/restore flow for Codex that sends public/state recovery material to Kraken USB and OneDrive, while keeping secret continuity separate and encryption-ready.
**Why**: Code continuity without secret continuity is not enough, but secret continuity cannot be pushed offsite safely without an explicit backup passphrase.
**Impact**: Disaster-recovery status is now `GREEN`: public/state continuity is backed up locally and offsite, and encrypted secret continuity exists beyond local drives.
**Status**: Done

## 2026-02-14: Switch AI from Gemini to Claude

**Decision**: Replace Gemini SDK with Claude API in the dashboard  
**Why**: Gemini SDK 300 free credits exhausted. Joshua has Claude Max subscription (unlimited).  
**Impact**: geminiService.ts needs Claude equivalent, or simulation mode stays active  
**Status**: In progress

## 2026-02-14: Replace OpenClaw with custom code

**Decision**: Stop using OpenClaw/clawdbot/moltbot for Telegram gateway  
**Why**: Auth profile format deprecated in v2026.2.13 (`anthropic:claude-cli` → need `setup-token`). Config keeps changing names/formats. Joshua spent 12 days debugging instead of shipping.  
**Impact**: Build our own Telegram-to-Claude bridge (~150 lines). Zero third-party dependencies for the bot.  
**Status**: Decided, not yet built

## 2026-02-14: Build persistent memory-bank system

**Decision**: Create `memory-bank/` directory with structured context files  
**Why**: THE ROOT CAUSE of 12 days wasted + 4 duplicate apps. Claude has no memory after context window. Every new session starts blank. Joshua has rebuilt the same dating app 4 times because Claude forgot where things were.  
**Impact**: CLAUDE.md now references memory-bank/. Every session auto-loads full context.  
**Status**: Building now

## 2026-02-13: Node wipe and consolidation  

**Decision**: Factory reset all 3 nodes to marketing-only, preserve vault + OPUSONLY  
**Why**: Too many stale configs, broken services, zombie processes across nodes  
**Impact**: Clean slate on each machine. Scripts in D:\OPUSONLY\scripts\ handle re-setup  
**Status**: 9020 and T5500 wiped. SABRETOOTH last (after DNS verified)

## 2026-02-10: Migrate from GCP to AWS

**Decision**: Move backend from Cloud Run to AWS EC2  
**Why**: GCP project `ai-collab4kids` had issues (initially thought banned — CONFIRMED NOT BANNED). Migrated to AWS as backup.  
**Impact**: Backend now on BOTH 3.84.226.108 (AWS) AND Cloud Run (GCP). PEM key recovered from Antigravity history.  
**Status**: Both backends available. DNS still broken (pointing to old Railway URLs). GCP Cloud Run + Cloud SQL are ACTIVE.

## 2026-02-07: DAO smart contracts deployed

**Decision**: Deploy perpetual DAO on Base Mainnet  
**Why**: Ensure mission survives regardless of what happens to Joshua  
**Impact**: 60/30/10 split enforced by smart contract, not humans  
**Status**: Deployed and locked. GospelDonation.sol verified at 0x9855B75061D4c841791382998f0CE8B2BCC965A4 on Base Mainnet. Gnosis Safe 2-of-2 multisig on Charity + Infra wallets.

## 2026-03-08: Protocol Omega on-chain truth clarified

**Decision**: Treat the currently verified Base contract as the live truth and define the `30%` treasury as full mission infrastructure plus AI operations  
**Why**: Repo docs had narrowed the `30%` bucket to named vendors and mixed the live legacy contract/wallets with newer undeployed router addresses  
**Impact**: Governance docs now distinguish live verified on-chain state from intended-next deployment material, and the `30%` treasury explicitly covers power, hardware, hosting, domains, cloud, security, backups, facility costs, and AI platform costs  
**Status**: Live verified split remains `GospelDonation.sol` at `0x9855B75061D4c841791382998f0CE8B2BCC965A4` with payout wallets `0x8d3d... / 0xe0a42... / 0x7c3E...`; repo `DatingRevenueRouter` artifacts remain intended-next and were not verified live on Base in this session

## Earlier: Dual-purpose index.html

**Decision**: Landing page + React SPA in same index.html  
**Why**: Quick MVP — static landing page with pre-order modal + dashboard in one file  
**Impact**: Unconventional but works. Don't separate them unless deploying landing page independently.  
**Status**: Working

## Earlier: Tailwind via CDN only

**Decision**: No tailwind.config, no PostCSS, no local install  
**Why**: Fastest path to styled components. No build tooling overhead.  
**Impact**: Cannot customize Tailwind theme via config. Use inline styles for custom values.  
**Status**: Working — DO NOT change this
