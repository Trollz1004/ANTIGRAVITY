# FUNA-7 Lever 2 — Directory Submission Blitz: Draft Pack

**Date:** 2026-08-11
**Product:** youandinotai.com — dating platform where every member is a verified human
**Payment rail:** Square (live checkout for membership and verification)
**Owner:** Joshua (founder approval required before any submission goes live)
**Status of this pack:** ALL DRAFTS. Nothing has been submitted. No accounts created.

---

## Global rules applied to every draft below

- Business-only framing: membership, verification, safety, support, uptime, platform access.
- Differentiator leads everywhere: **V8 Cloud Verification — every member is a verified human. Built to keep bots out.**
- Claim discipline: "verified human" is the provable claim. Do NOT promise "no catfish"
  (a verified human can still misrepresent themselves) or any "100%" guarantee unless
  Joshua explicitly approves that claim strength in writing.
- **HARD BLOCKER (verified in code 2026-08-11):** the backend does not yet enforce
  verification before interaction — `backend/fastapi-app/app/routers/swipe.py` and
  `messages.py` contain no `verified` gate, so unverified accounts can currently
  browse, match, and message. Every draft below claiming members "must pass
  verification before they can interact" is inaccurate until that enforcement
  ships. NO SUBMISSION until Joshua either (a) approves shipping the enforcement
  gate (small backend change, ~3 routers) or (b) directs softening the copy to
  verification-as-offered ("look for the verified badge").
- **NO pricing figures appear in any draft.** Pricing statements must be copied verbatim
  from the live Square catalog at submission time. Placeholder used: `[PRICE — copy from Square catalog]`.
- No fabricated metrics, no fabricated testimonials, no user-count claims.
- Never mention any payment processor other than Square on dating surfaces.
- Escalate to Joshua before replying to any comment touching pricing, legal, or doctrine.

---

## Tracker

| Platform | Status | Submission URL | Account needed | Submitted date | Live URL | Result |
|---|---|---|---|---|---|---|
| Product Hunt | DRAFT | https://www.producthunt.com/posts/new | Product Hunt maker account | — | — | — |
| BetaList | DRAFT | https://betalist.com/submit | BetaList account (email) | — | — | — |
| Show HN | DRAFT | https://news.ycombinator.com/submit | HN account (aged accounts perform better) | — | — | — |
| Indie Hackers | DRAFT | https://www.indiehackers.com/new-post | Indie Hackers account + product page | — | — | — |
| AlternativeTo | DRAFT | https://alternativeto.net/manage-item/ | AlternativeTo account | — | — | — |
| SaaSHub | DRAFT | https://www.saashub.com/services/new | SaaSHub account | — | — | — |
| StartupBase | NOT DRAFTED (next batch) | https://startupbase.io | — | — | — | — |
| Launching Next | NOT DRAFTED (next batch) | https://www.launchingnext.com/submit/ | — | — | — | — |
| SideProjectors | NOT DRAFTED (next batch) | https://www.sideprojectors.com | — | — | — | — |
| Uneed | NOT DRAFTED (next batch) | https://www.uneed.best/submit-a-tool | — | — | — | — |

---

## 1. Product Hunt

**Status:** DRAFT
**Submission URL:** https://www.producthunt.com/posts/new
**Account needed:** Product Hunt account for the maker (Joshua or designated hunter). Maker must be tagged.
**Lead time:** Schedule launch 12:01 AM PT; pick a weekday. Assets must be uploaded at scheduling time.

**Name:** YouAndINotAI

**Tagline (<=60 chars, this one is 45):**
> Dating where every member is a verified human

**Topics:** Dating, Social Networking, Safety

**Short description:**
> YouAndINotAI is a dating platform built around one promise: everyone you match with is a real, verified human. Our V8 Cloud Verification checks every member before they can interact, so every profile you see belongs to a real, verified person. Membership includes verified access, human support, and a platform we run and operate ourselves.

**Maker's first comment:**
> Hey Product Hunt — maker here.
>
> We built YouAndINotAI because the biggest problem in online dating isn't matching algorithms — it's not knowing whether the profile you're talking to is a real person. Bots and fake profiles waste your time and your trust.
>
> So we made verification the product. Every member goes through V8 Cloud Verification before they can interact with anyone. No verification, no access. That's the whole idea in one sentence: you, and I, not AI.
>
> What you get as a member:
> - Every profile you see belongs to a verified human
> - A safety-first platform — verification is required, not optional
> - Human support when you need it
> - A platform we host and operate ourselves
>
> Checkout runs on Square. Happy to answer anything about how verification works, what we check, and what we deliberately don't collect.

**Gallery checklist (prepare before scheduling):**
- [ ] Logo / thumbnail, 240x240 (animated GIF thumbnails allowed)
- [ ] 3–6 gallery images, 1270x760 — first image is the hook: "Every member is a verified human"
- [ ] Screenshot: verification flow (blur any real member data — use a test account)
- [ ] Screenshot: browse/match screen showing verified badge
- [ ] Screenshot: membership checkout (Square) — confirm on-screen price matches Square catalog before capture
- [ ] Optional: <60s demo video
- [ ] Verify all screenshots come from the PRODUCTION build (assets/index-<hash>.js, not /@vite/client)

**Reply templates:**
- "How does verification work?" → Describe the member-facing flow only (what a member does, what gets checked). Do not disclose internal detection logic. If pressed on specifics, escalate to Joshua.
- "How much does it cost?" → State exactly what the Square catalog says, nothing more. If unsure, escalate before replying.
- "Is my verification data safe?" → Verification exists to confirm you're human; describe retention/handling only per what's published on the site. Legal-adjacent → escalate to Joshua before answering.

---

## 2. BetaList

**Status:** DRAFT
**Submission URL:** https://betalist.com/submit
**Account needed:** BetaList account (email signup). Free submissions queue for weeks; paid options skip the queue — spend requires Joshua's approval.
**Lead time:** Free queue is typically 1–2 months; plan accordingly or approve expedite.

**Startup name:** YouAndINotAI

**Pitch (one-liner):**
> A dating platform where every member is a verified human — built to keep bots out.

**Description:**
> Online dating has a trust problem: you never know if the profile on the other side is a real person. YouAndINotAI fixes that at the door. Every member passes V8 Cloud Verification before they can interact with anyone on the platform. The result is a dating experience where every match, every message, and every profile is a verified human being.
>
> Membership includes verified platform access, human support, and an independently operated platform we run and monitor ourselves. Signup and checkout are live today at youandinotai.com.

**Screenshot needed:** Landing page hero (1000px+ wide, production build).

---

## 3. Show HN (Hacker News)

**Status:** DRAFT
**Submission URL:** https://news.ycombinator.com/submit
**Account needed:** HN account. Note: brand-new accounts posting Show HN get flagged more; use an established account if one exists. Do not vote-ring or ask anyone to upvote — HN detects and penalizes this.
**Format:** Title + URL, with the text below posted as a first comment — or a text post if a comment-first approach is preferred. Plain voice, no marketing language, honest about limitations.

**Title (<=80 chars):**
> Show HN: YouAndINotAI – a dating site where every member is a verified human

**Post text / first comment:**
> Hi HN. I built a dating site with one core constraint: nobody can interact with anyone until they've passed human verification. The name is the pitch — you, and I, not AI.
>
> Why: bots and fake profiles are the dominant failure mode of dating apps. Most platforms treat detection as a moderation problem after the fact. I made it a gate instead — verification (we call the system V8 Cloud Verification) happens before a member can message or match at all. Unverified accounts simply can't touch other users.
>
> Some honest notes on the stack and setup:
> - It's self-hosted on my own hardware, published through Cloudflare tunnels. That's a deliberate cost decision, and yes, it means I'm the ops team.
> - Payments are Square checkout for membership and verification.
> - It's a small, new platform. I'm not going to pretend there's a huge user base yet — the bet is that people will trade network size for the guarantee that everyone they see is real.
>
> Things I'd genuinely like feedback on: the verification-as-gate tradeoff (friction vs. trust), and what would make you trust — or distrust — a verification badge on a dating profile.
>
> Happy to answer questions about how it works and what I'd do differently.

**Show HN reply guidance:**
- Answer technical questions with candor; admit unknowns plainly.
- Do not reveal fraud/bot-detection internals in detail (gaming risk) — say so directly: "I'd rather not publish the exact checks since that's a cheat sheet for bot operators."
- Pricing/legal/privacy-policy questions → hold reply, escalate to Joshua.
- Never argue with critics; concede fair points.

---

## 4. Indie Hackers

**Status:** DRAFT
**Submission URL:** https://www.indiehackers.com/new-post (also create product page at https://www.indiehackers.com/products/new)
**Account needed:** Indie Hackers account; product pages may require linking a revenue source — link nothing without Joshua's approval.

**Title:**
> I launched a dating platform where verification is the product, not a feature

**Post:**
> Every dating app says it fights bots. I decided to build one where verification comes first: nobody gets access to other members until they've passed human verification.
>
> The product is YouAndINotAI (youandinotai.com — the name is the positioning). The differentiator is V8 Cloud Verification: every member is checked before they can match or message. What members buy is simple — verified access, a verified-human member pool, human support, and a platform we operate ourselves.
>
> Builder notes:
> - I self-host on my own hardware behind Cloudflare tunnels. Higher ops burden, near-zero hosting bill, full control.
> - Checkout is Square — membership and verification are ordinary product purchases, live today.
> - Distribution is the current battle. This post is part of a directory/launch blitz (Product Hunt, BetaList, Show HN, and the long tail) — happy to compare notes with anyone who's run one.
>
> The bet I'm making: dating apps compete on network size, and I can't win that game today. So I'm competing on trust instead — a smaller pool where every profile has passed human verification beats a huge pool where you're screening out fakes yourself.
>
> Ask me anything about verification-gating, self-hosting a consumer app, or selling trust as the core SKU.

**Reply guidance:** Builder-journey tone; share real lessons; revenue numbers only if Joshua approves publishing them — otherwise "not sharing numbers yet."

---

## 5. AlternativeTo

**Status:** DRAFT
**Submission URL:** https://alternativeto.net/manage-item/ (Add an application)
**Account needed:** AlternativeTo account. Listing goes through moderator review (a few days typical).

**Application name:** YouAndINotAI

**URL:** https://youandinotai.com

**Short description (~140 chars):**
> Dating platform where every member is a verified human. V8 Cloud Verification blocks bots before they can ever interact.

**Full description:**
> YouAndINotAI is an online dating platform built on mandatory human verification. Every member must pass V8 Cloud Verification before they can browse, match, or message — which means every profile on the platform belongs to a real, verified person — verification is designed to stop bots at the door.
>
> Membership includes verified platform access, a safety-first environment, human customer support, and an independently operated platform. Web-based; membership and verification checkout handled through Square.

**License / pricing model:** Paid (subscription/membership) — set exact tier labels from the Square catalog at submission time. `[PRICE — copy from Square catalog]`

**Platforms:** Web

**Tags:** dating, online-dating, verification, safety, anti-bot

**List as alternative to:** Tinder, Bumble, Hinge, OkCupid, Match.com, Plenty of Fish, Coffee Meets Bagel
> Differentiation note for each pairing: "Unlike [X], every YouAndINotAI member is human-verified before they can interact — bots are blocked at signup, not moderated after the fact."

---

## 6. SaaSHub

**Status:** DRAFT
**Submission URL:** https://www.saashub.com/services/new
**Account needed:** SaaSHub account (email or GitHub login).

**Service name:** YouAndINotAI

**Website:** https://youandinotai.com

**Tagline:**
> Dating where every member is a verified human

**Description:**
> YouAndINotAI is a dating platform with mandatory human verification. Its V8 Cloud Verification system checks every member before they can match or message, keeping bots out at the door instead of moderating them after the fact. Membership includes verified access, human support, and an independently operated platform. Payments run on Square.

**Category:** Dating / Online Communities

**Pricing field:** Paid. Enter exact figures from the Square catalog only. `[PRICE — copy from Square catalog]`

**Alternatives to associate:** Tinder, Bumble, Hinge, OkCupid

---

## Pre-submission checklist (every platform, before flipping DRAFT → SUBMITTED)

- [ ] Joshua has approved the copy (public brand copy requires founder approval)
- [ ] Every `[PRICE — copy from Square catalog]` placeholder replaced with the exact live Square catalog value, or the pricing field left blank
- [ ] youandinotai.com is serving the production build (check for assets/index-<hash>.js, not /@vite/client)
- [ ] Screenshots are current, from production, with no real member data and no secrets visible
- [ ] Update the tracker row (status, date, live URL) immediately after submitting
- [ ] Response playbook loaded; pricing/legal/doctrine questions escalate to Joshua before reply
- [ ] Any support/uptime claim in the copy ("human support", operations wording) verified by Joshua as accurate today
- [ ] Show HN / Indie Hackers only: Joshua consciously accepts the public self-hosting/topology disclosure in those drafts before posting
