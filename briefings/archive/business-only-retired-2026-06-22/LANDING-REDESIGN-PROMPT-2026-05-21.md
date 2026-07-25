# Designer-Plugin Prompt — youandinotai.com Landing Redesign (2026-05-21)

> **How to use:** Copy everything inside the fenced block below and paste it into the
> Opus designer-plugin surface (OpusPawClaw / design workspace). It is self-contained.
> Authored by the external Opus orchestrator from a live audit of `apps/youandinotai-frontend/`
> on 2026-05-21. Josh approves marketing only after the redesign lands.

---

## Why this exists (context for Josh — not part of the paste)

The current `apps/youandinotai-frontend/app/page.tsx` is **not a product landing page**. It
renders an internal-style **"ANTIGRAVITY STATUS"** dashboard. A first-time visitor to
youandinotai.com sees:

- A stat grid showing **"$0 Tracked Revenue"**, **"0 Tracked Customers"**, **"Pre-launch"** —
  i.e. the site advertises that nobody has paid yet. Conversion poison.
- A stat card labeled **"Recorded payouts"** (`page.tsx:145`) — `payout` is a
  **banned canonical-7 customer-facing word** (FL §496.405). This is a live compliance hit.
- Stale **"Launch: April 4, 2026"** copy (`KidsPlatform.tsx:139`, `DAOMetrics.tsx:9/47`,
  `app/api/metrics/route.ts:17`) — six weeks past.
- No hero, no value proposition, no signup funnel, and **no Square checkout CTA** even though
  five live Square links exist.
- The real product components (`KidsPlatform`, `AgeGate`, `AntiGravity`, etc.) exist in
  `components/` but are **not wired to `/`**.

The prompt below tells the designer-plugin Opus to audit and rebuild this into a
marketing-ready, doctrine-clean consumer landing page that drives the first paying customer.

---

## PASTE THIS INTO THE DESIGNER PLUGIN

```
You are Opus, the design lead for youandinotai.com. Audit the current landing page and
redesign it into a marketing-ready consumer homepage that converts a cold visitor into a
paying Founding Member. This is the surface Josh will point paid traffic at, so it has to
sell the product and pass compliance on the first pass.

PRODUCT (what we are selling)
- youandinotai.com — NOT just a dating app. Position it as a "social platform for good":
  authentic human connection (dating + meetups + volunteering + real-world events), with a
  built-in commitment that a share of revenue is reserved for kids in need (medical care
  first). Human-first, anti-bot, anti-doomscroll.
- Stack already in place: Next.js 15 / React 19 / FastAPI / Square / PostgreSQL.

CURRENT STATE TO REPLACE (audit findings, all in apps/youandinotai-frontend/)
1. app/page.tsx renders an "ANTIGRAVITY STATUS" ops dashboard, not a product page. Replace it.
2. It shows "$0 Revenue / 0 Customers / Pre-launch" to visitors. Remove ALL self-reported
   zero/pre-launch metrics from the public page. Do not advertise that nobody has paid yet.
3. page.tsx:145 has a stat card labeled "Recorded payouts" — DELETE it (banned word).
4. "April 4, 2026" launch dates are stale (KidsPlatform.tsx:139, DAOMetrics.tsx:9 & :47,
   app/api/metrics/route.ts:17). Remove hard-coded past launch dates entirely; the product
   is live now — speak in present tense ("Join today"), never "launching April 4".
5. The dating-product components in components/ are not on the homepage route. Build the new
   landing in app/page.tsx (compose new sections; reuse existing components only where they
   already match the new design).

HARD CONSTRAINTS (compliance — non-negotiable, the page is rejected if any are violated)
- BANNED WORDS on every customer-facing surface (FL §496.405): payment, payment,
  outreach, , , "", payout. Never use them, not even
  to describe the mission. Say it as: "a reserved share of every membership supports kids'
  medical needs" or "10% of revenue is set aside for " — framed as how the
  business operates, not as a  ask.
- PAYMENTS: Square only on this domain. Never mention or link Stripe here. Use these exact
  live Square checkout links for the CTAs:
    - Bot-Shield (identity verification) $1 .......... https://square.link/u/Qc5mxUy7
    - Founding Member $14.99/mo (PRIMARY CTA) ........ https://square.link/u/cxwjcn0s
    - 3-Month Founder $39.99 ......................... https://square.link/u/oY7qEfRM
    - 12-Month Founder $99.99 ....................... https://square.link/u/6GHpbvvl
    - Royalty Card $2,500 ........................... https://square.link/u/CafhorUS
- NO FABRICATED DATA: do not invent user counts, testimonials, star ratings, "as seen in"
  logos, or fake activity numbers. If we don't have a real number, don't show a number. Use
  benefit-driven copy instead of metrics.
- Entity in footer: © 2026 Trash Or Treasure Online Recycler LLC. Keep the existing age-gate
  / adult-verification flow reachable (this is an 18+ platform).

DELIVERABLE — new landing page structure (mobile-first, dark + light themes already exist)
1. Hero: one-line promise + subhead + PRIMARY CTA button → Founding Member $14.99/mo Square
   link. Secondary link: "How it works".
2. Value prop: 3 cards — (a) real humans, bot-shielded; (b) connection beyond a swipe
   (meetups/volunteering/events); (c) membership that means something (the reserved-share
   framing above, compliant wording).
3. How it works: 3 simple steps (verify you're human → build a real profile → meet people).
4. Founding Member pricing block: the tiers above as cards, Founding Member highlighted as
   the recommended plan; Bot-Shield $1 shown as the low-friction entry. Each card's button is
   the matching Square link, target=_blank rel="noopener noreferrer".
5. Trust & safety: Bot-Shield verification, 18+ age gate, privacy posture. Plain language.
6. Mission strip: compliant one-paragraph statement that a reserved share of revenue supports
   kids' medical needs (no banned words). This is a differentiator, keep it honest and short.
7. FAQ: 4–6 questions (Is this another dating app? How is my data handled? What's Bot-Shield?
   What does my membership support? Can I cancel?).
8. Footer: entity line, links to the other public surfaces, age-gate/legal links.

QUALITY BAR
- Accessible (semantic headings, alt text, focus states, AA contrast in both themes).
- Fast: no layout shift, lazy-load below the fold, no fake spinners.
- Conversion-focused: the Founding Member CTA is visible above the fold and repeats before
  the footer.
- Tone: warm, direct, human. Not corporate, not "AI-powered everything", not hypey.

OUTPUT
- Provide the full replacement app/page.tsx plus any new section components, ready to drop
  into apps/youandinotai-frontend/. Note any existing component you reused vs. replaced.
- List every file you changed.
- Confirm at the end: "No banned canonical-7 words; Square-only links; no fabricated metrics;
  no stale launch dates." If you cannot confirm all four, say which and why.
```

---

## After the plugin produces the redesign (next steps for Josh)

1. Paste the result back here (or drop the files on a branch) and I'll review it against
   doctrine before it ships — banned-word scan, Square-link check, no-fake-data check, and a
   build check.
2. Merging the new `page.tsx` triggers a Cloudflare Pages redeploy (public, irreversible) —
   that stays your approve-and-merge gate per doctrine #6.
3. The "payouts" banned word and stale launch dates are live **right now**; if you want
   them off the site before the full redesign is ready, say the word and I'll draft a tiny
   stopgap PR that removes just those two compliance/staleness hits.

#UntilNoKidInNeed
