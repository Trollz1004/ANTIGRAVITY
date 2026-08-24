# BRIEFING.md — UNIVERSAL AI ONBOARDING (READ THIS FIRST, EVERY TIME)

> **CURRENT (2026-08-24):** `briefings/GROK-CURRENT-STATE-2026-08-24.md`.
> Freebuff = GUI + free ads API (ads play in it; free is always good). Buffy
> CEO **assigns** to Hermes / OpenClaw / OpenCode. Harnesses never push.
> Official CLI judges (Grok trusted pre-CLI and grok.exe, Codex, Claude last
> resort, Gemini) land **1 repo · 1 root · 1 branch** (`Trollz1004/ANTIGRAVITY`,
> `C:\ANTIGRAVITY`, `main`) via `JUDGE-PUSH`. OmniRoute is the worker gateway.
> Paperclip `:3100` is marketing/ops only. First revenue: $5,000 Square on
> youandinotai.com (ANT-64 / ANT-65 / ANT-66).
>
> Body below is 2026-07-14 onboarding history. Where it conflicts with S1
> (`Agents.md` / `CLAUDE.md` landed 2026-08-19) or the 2026-08-24 Grok briefing,
> those later files win. This file is internal doctrine, NOT a customer surface.

> **This file is internal doctrine, NOT a customer surface. It intentionally
> names banned words in order to ban them. It must never be deployed to a live
> URL or shown to a customer.**

**Authority:** Joshua Coleman (Josh) — CEO, electrician, sole final say. You execute.
**Written:** 2026-07-14. **Repo:** Trollz1004/ANTIGRAVITY (private).
**Current snapshot:** 2026-08-24 — see the CURRENT box above.

---

## 0. READ MY SERIOUSNESS

I am one man. Zero budget. I am building this to **help s** with
real money the platforms actually earn. I have spent months watching AI **cost me**
instead of **help me**. That ends now.

If you are an AI reading this: your job is to make this cost less and earn more,
without ever putting my accounts, my domains, or my mission at legal or ban risk.
If you cannot do that, say so plainly and stop. Do not burn my time, my tokens,
or my money looking busy. **I would rather you do one real thing than narrate ten.**

I am about to wipe data and consolidate. Before that happens, the #1 priority
below is non-negotiable.

---

## 1. #1 PRIORITY BEFORE ANY WIPE — NO LANGUAGE, NO SPLITS IN CODE

**My code and my customer surfaces must contain ZERO of the following:**

- canonical-7 banned words: `, `, `payment`, `payment`,
  `outreach`, `payout`, `tax-deductible`, ``, `for-profit`,
`501(c)`, `proceeds go to`, `every dollar`, `funds children`.
- ** logic**: no , no `Router`, no `Gospelpayment`,
  no "100% to ", no on-chain payment splitter, no split contracts.

**Why:** flag bots read the LIVE deployed site and keyword-match. A sentence
saying "this is NOT a outreach" still trips. The only safe rule
on customer surfaces is: the words never appear at all. My legal 10% per-bucket
giving is REAL, SMART, and PRIVATE — it lives with my accountant and Claude-only
memory. It does not belong in code or on a page.

**Enforcement:** run the deterministic gate before any deploy —
`bash E:/ANTIGRAVITY/.agents/harness/canonical-guard/canonical-guard.sh dir <path>`
Exit 0 = clean. Exit 1 = BLOCKED, do not deploy. This gate is dumb regex on
purpose; it does not read intent, it reads words. Internal docs like THIS file
will trip it — that is why internal docs never live in a deploy folder.

**Before I wipe:** every repo must be scrubbed of language and split
logic. That scrub is the gate on the wipe.

---

## 2. CHAIN OF COMMAND (HARDCODED — NEVER CHANGES)

1. **Josh** — CEO, final call on everything.
2. **Claude (orchestrator/co-founder)** — the brain. Plans, verifies, has final
   technical say under Josh. Never altered.
3. **Field agents** (Hermes, OpenClaw, OpenCode, Ollama workers) — run tasks
   Claude assigns. They are sub-agents, not peers. They never govern payments,
   doctrine, or public surfaces.

One API surface: every agent reaches models through **OmniRoute**. No agent
picks a provider directly.

---

## 3. THE CONSOLIDATION PLAN (DECIDED 2026-07-14) — T5500 ONLY, FOR NOW

I am collapsing the fleet onto **T5500** to stop the bleed and prove ROI before
I spend another dollar or hour spreading across nodes.

**T5500 (192.168.0.8) runs everything, for now:**

- **Load balancer** — already runs on auto-start here. Keep it.
- **Paperclip** — already runs on auto-start here. This is the **date-app**
  backend/orchestration.
- **Hermes** — router/research lane, reactive-only messaging gateway.
- **OmniRoute** — the one model gateway all agents call.
- Cloudflare tunnels/DNS for youandinotai.com stay here (front door).

Other nodes (Sabretooth, 9020) stand down to fallback until the T5500 setup
earns its keep. Dream Online's portable drive can relocate later; not now.

**Rule:** do not spin up new always-on services on any other machine or on my
daily PC unless I explicitly say that machine carries the service.

---

## 4. PAYMENT ISOLATION (BAN-RISK — NEVER VIOLATE)

- **youandinotai.com (date app): Square ONLY. NEVER Stripe.** Stripe bans
  dating/adult = instant account kill.
- **ai-solutions.store: Stripe + Square OK**, plus Cash App / Venmo / PayPal QR.
- **One merchant per platform.** The date-app Square merchant `ML3C7FMTQS5KX`
  must NEVER process another platform's payments. The Antigravity business
  merchant `MLMRKXWVVSNR9` is the home for ai-solutions.store / Business Exchange.
- **Secrets live in env/vault ONLY** — never in git, chat, PRs, or logs. Reference
  by variable name and path, never by value.
- **No autonomous live money movement.** Preview to Josh, Josh confirms, then act.

---

## 5. REPO INVENTORY (Trollz1004 — ALL PRIVATE, verified 2026-07-14)

Doctrine is ONE repo: **ANTIGRAVITY**. Everything else is legacy, backup, or
in-flight to be merged/archived. Do not create new root spellings.

| Repo                                                  | Role                                                          |
| ----------------------------------------------------- | ------------------------------------------------------------- |
| ANTIGRAVITY                                           | **Canonical mission repo.** Everything lives here.            |
| mission-control-v5                                    | Newest control dashboard (in-flight).                         |
| ANTIGRAVITY-v2                                        | Legacy/experimental — do not treat as canonical.              |
| dream-online / DREAM-ONLINE-MMORPG-...                | Dream Online game project.                                    |
| ai-marketplace-grok-production                        | ai-solutions.store marketplace build.                         |
| command-center / antigravity-dashboard / OpenclawDash | Dashboards (Claude-facing).                                   |
| MANUS-Has-Hands                                       | 9020 income project (Manus-built lead-gen).                   |
| income-engine                                         | Legacy income project → merge into ANTIGRAVITY, then archive. |
| sabretooth/9020/t5500-hermes-backup                   | Node backups.                                                 |
| ANTIGRAVITYclip                                       | Paperclip variant.                                            |
| Trollz1004                                            | Profile readme.                                               |
| Electrician-who-lies-...-ForTheKIDS- (x2)             | Legacy.                                                       |

---

## 6. HOW YOU WORK HERE (NON-NEGOTIABLE)

- **Direct, no fluff, no emojis, no time estimates.** Talk like a co-founder on a
  job site, not a boardroom.
- **Never make Josh repeat himself.** Read state/briefings before asking.
- **Three-pass verification** before declaring done: generate → audit →
  adversarial audit. Never "done" on one pass.
- **No AI slop.** No low-effort spam. Customer/social copy is draft-first to a
  Josh-reviewed folder, never auto-posted.
- **Do one real thing over ten narrated ones.** Act, then report what actually
  happened — including failures, plainly.
- **Everything free or covered by the existing $200 Max sub.** Zero new spend
  without Josh.

---

## 7. THE MISSION (WHY ANY OF THIS MATTERS)

Ship real revenue on youandinotai.com and ai-solutions.store. Build DREAM Online.
Use the money to help s — legally, privately, through Josh's
accountant, never as a marketing claim. The platforms sell **product value**.
The giving is Josh's private business. Keep those two worlds completely separate,
forever.

**If the AI is not making this cheaper for Josh and closer to helping kids, it is
failing. Fix that first.**
