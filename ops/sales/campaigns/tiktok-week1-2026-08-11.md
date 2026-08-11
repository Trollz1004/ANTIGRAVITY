# TikTok Week 1 Execution Plan — FUNA-7 Lever 1 (Faceless Network)

Date: 2026-08-11
Status: **DRAFT — FOR FOUNDER (JOSHUA) REVIEW. DO NOT POST ANYTHING FROM THIS FILE UNTIL APPROVED.**
Scope: 3 faceless TikTok accounts, slideshow format, week 1 of the FUNA-7 30-day ramp.
Doctrine: business-only copy — membership, verification, safety, support, uptime, platform access.
No pricing, no payment claims, no fundraising/charity language, no fabricated statistics, no fake testimonials.
Payments rail is Square — but pricing/checkout NEVER appears in TikTok copy. CTA is always youandinotai.com only.

---

## 0. Before Anything: Claims Gate

> **HARD BLOCKER (verified in code 2026-08-11):** the backend does not yet
> enforce verification before interaction — `swipe.py` discover/match and
> `messages.py` send_message contain no `verified` checks, so an unverified
> account can currently browse, match, and message. Every script below that
> says "verified before they can match/message/talk to you" is INACCURATE
> until that gate ships (or the copy is softened to "every member is offered
> verification / look for the verified badge"). Joshua decides: ship the
> enforcement gate, or soften all scripts. NOTHING POSTS BEFORE THAT DECISION.

Every slide below sells exactly one idea: **youandinotai.com human-verifies every profile, so you match with real people.**

- APPROVED framing (pending founder confirmation, see end of file): "every profile passes human verification," "built to keep bots out," "verified-human matching," "real people, verified."
- BANNED in all copy: percentages or counts we can't source ("90% of matches are bots"), fake user quotes, "guaranteed," pricing, plan names, payment words, charity/mission language, Stripe (never), competitor defamation by name ("Tinder is full of bots" → say "most dating apps" instead).
- Hooks may describe **relatable scenarios** (POV, "ever matched with…") — scenarios are honest; invented statistics are not.
- **AFFILIATION DISCLOSURE (required, FTC endorsement guides + TikTok policy):** these are
  company-operated accounts. Every bio states the affiliation plainly ("from the team behind
  youandinotai.com") and every promo caption must read as self-promotion by the platform team —
  never as an independent user's or reviewer's recommendation. No neutral-reviewer pretense,
  no first-person "a stranger recommended this to me" framing. If a script reads like an
  unaffiliated endorsement, add the team framing to its caption before posting.

---

## 1. Account Setup Checklist (3 Faceless Accounts)

Do all of this from the phone. One account per day max on a fresh device profile if possible; do not create all three in one hour from one IP if avoidable.

### Shared setup steps (repeat per account)
- [ ] New email alias per account (no reuse). Record handle + email in the tracker table (Section 5), never passwords in this repo.
- [ ] Personal account type (NOT business) — personal accounts keep full trending-sound access, which slideshows need. Switch to business later only if we need the instant bio link.
- [ ] Profile photo: brand-adjacent graphic from the repo's real asset pool `frontend/react-app/public/` (e.g. `bot-shield-logo.png`, `fingerprint-heart.jpg`, `faceless-avatar.svg` — no faces, no logos of other apps). Note: `/marketing-assets/youandinotai-public/` does not exist in this repo; if Joshua has a separate asset pack on the node, he supplies it, otherwise use the public/ pool.
- [ ] Bio set (copy below). Until TikTok unlocks the clickable bio link (typically 1K followers on personal accounts), the CTA lives in captions and final slides as plain text: "youandinotai.com".
- [ ] Warm-up: the first 2 calendar days after account creation (label them W1–W2 — these are NOT content Days 1–7), no promo. Spend 15–20 min/day scrolling dating-niche content, like/save/comment like a human, follow 10–15 niche creators. Post 1 non-promo slideshow each warm-up day (generic dating-red-flags content with NO app mention). Content DAY 1 starts only after W2 completes.
- [ ] Turn on analytics (Creator tools → Analytics) day one so week-1 data exists.

### Account 1 — "Bot Radar" (anti-bot / spot-the-fake niche)
- Angle: teaches people to spot bots, fake profiles, and catfish on dating apps. The app is the payoff: "or just use a platform that verifies humans."
- Handle ideas (check availability): `botradar.dating`, `spotthebot.dating`, `notabot.check`
- Bio (draft): `From the team behind youandinotai.com. Spotting bots + fake profiles so you don't waste another swipe.`

### Account 2 — "Dating App Audit" (reviewer / comparison niche)
- Angle: deadpan "auditor" voice on the state of online dating — what apps don't tell you, what verification should look like — CLEARLY as the youandinotai.com team's own perspective, never posing as an independent reviewer. Never names competitors negatively; says "most apps."
- Handle ideas: `datingapp.audit`, `theswipe.audit`, `dating.fineprint`
- Bio (draft): `We build youandinotai.com. Auditing how dating apps handle verification — and how we do it.`

### Account 3 — "Swipe Safe" (safety-first niche, women-leaning audience)
- Angle: online-dating safety habits — verifying who you're talking to, catfish red flags, safe first-date basics. Product fit: human verification as a safety layer.
- Handle ideas: `swipesafe.club`, `verifiedfirst`, `safeswiping`
- Bio (draft): `Online dating safety, from the team behind youandinotai.com. Verify before you trust.`

### Link strategy
- **Attribution setup (LAUNCH BLOCKER — founder, ~10 min, before any promo post):** create three
  Cloudflare redirect rules on youandinotai.com — `/tt1`, `/tt2`, `/tt3` → homepage — one per
  account (A1=tt1, A2=tt2, A3=tt3). Each account's CTA then uses ITS path
  (`youandinotai.com/tt1` etc.) in captions, final slides, and later the bio link. Cloudflare
  analytics shows requests per path, which is the only way week-1 SCALE/HOLD/KILL can see
  whether an account produced site visits — without this, conversion attribution is blind and
  the experiment only measures TikTok-side engagement.
- **Honesty limit: attribution is VISITS-level in week 1.** The current checkout stores no
  campaign tag (Path A static Square links; Path B `create_checkout_link` takes only a tier),
  so an order can NEVER be attributed to an account — same-day order counts are context, not
  proof of referral. Order-level attribution requires propagating a ref tag into the
  account-bound checkout record; that is queued with the Square Path B work (see
  ops/runbooks/YESTERDAY-NEWS-DROID-2026-08-10.md follow-up) and is NOT claimed by this plan.
- Week 1: plain-text CTA with the account's tracked path in caption + final slide. No link
  shorteners, no Square/checkout URLs, no pricing pages — tracked homepage path only.
- When bio link unlocks: point to `https://youandinotai.com/<account path>` (founder may later
  approve full UTM tagging; do not invent other URLs).
- Never put checkout links, pricing, or plan names anywhere on TikTok.

---

## 2. The 21 Slideshow Scripts (3/day × 7 days)

Format for every post: 5–7 image slides, big bold text (readable with sound off), trending calm/aesthetic sound (pick day-of from the For You page — must be a currently-trending sound, commercial-safe). **App reveal lands on slide 3–4** (FUNA-7 bookmark-optimization rule), never the last slide. Final slide is always the CTA slide.

Assets: app screenshots + the repo's real image pool at `frontend/react-app/public/` (bot-shield/fingerprint-heart/card-art images work as slideshow backgrounds). Stock b-roll stills, if wanted, must be sourced by the operator from a licensed/free library (note the source per post). No faces of real users, no invented testimonials. (`/marketing-assets/youandinotai-public/` does not exist in this repo — do not reference it.)

Naming: D{day}-{A1|A2|A3}. Each script belongs to its account's angle. If a script overperforms, re-skin it (new images, same text) for the other two accounts 48+ hours later.

Day numbering: DAY 1–7 below are CONTENT days. They begin only after each account finishes its W1–W2 warm-up (Section 1) — never post promo scripts during warm-up.

---

### DAY 1

**D1-A1 (Bot Radar) — "Texts back instantly"**
- Hook (slide 1): `Signs the "person" you matched with is not a person`
- Slide 2: `Replies in under 3 seconds. Every time. At 4am.`
- Slide 3: `Their photos look perfect but reverse-search goes nowhere. There's an easier fix →`
- Slide 4: `youandinotai.com — every profile passes human verification before it can match with you.`
- Slide 5: `No guessing games. You talk to people, not scripts.`
- Slide 6 (CTA): `Verified humans only. youandinotai.com`
- Caption: `The 3am instant reply is never a good sign. Where do you see this the most? youandinotai.com`
- Hashtags: `#datingapps #onlinedating #catfish #datingappfails #datingadvice #bots`

**D1-A2 (Dating App Audit) — "The fine print"**
- Hook: `Things dating apps hope you never ask`
- Slide 2: `"How do you check that a profile is a real person?"`
- Slide 3: `Most platforms don't have a real answer. One was built around the answer →`
- Slide 4: `youandinotai.com — human verification is the entry requirement, not an optional badge.`
- Slide 5: `Membership means the people you see got verified too.`
- Slide 6 (CTA): `Ask better questions. youandinotai.com`
- Caption: `Audit question #1: who checked that your match is human? youandinotai.com`
- Hashtags: `#datingapps #onlinedating #datingadvice #verified #swipelife`

**D1-A3 (Swipe Safe) — "Before you trust"**
- Hook: `A safety habit nobody teaches you about dating apps`
- Slide 2: `Verify the person exists before you invest your evenings in them.`
- Slide 3: `Or start where verification already happened →`
- Slide 4: `youandinotai.com — every member is verified human before they can talk to you.`
- Slide 5: `Safety isn't paranoia. It's a filter.`
- Slide 6 (CTA): `Swipe safer. youandinotai.com`
- Caption: `Verification first, feelings second. youandinotai.com`
- Hashtags: `#onlinedatingsafety #datingtips #catfish #datingadvice #safetyfirst`

---

### DAY 2

**D2-A1 — "The catfish starter pack"**
- Hook: `POV: you're 3 weeks into talking and they still can't video call`
- Slide 2: `Camera "broken." Always traveling. Photos never candid.`
- Slide 3: `You shouldn't need detective skills to date →`
- Slide 4: `youandinotai.com verifies every human before they ever appear in your matches.`
- Slide 5: `Bots and mass-run fake accounts don't make it through the door.`
- Slide 6 (CTA): `Skip the investigation. youandinotai.com`
- Caption: `Three weeks. No video call. We all know. youandinotai.com`
- Hashtags: `#catfish #onlinedating #datingstorytime #datingapps #redflags`

**D2-A2 — "What verification should mean"**
- Hook: `"Verified" badges on most apps vs. actual verification`
- Slide 2: `A blue check that took 10 seconds is decoration, not protection.`
- Slide 3: `Here's the version that's an actual gate →`
- Slide 4: `youandinotai.com — verification is required to join. Not a sticker. A door.`
- Slide 5: `If everyone inside is verified, the badge stops being the point.`
- Slide 6 (CTA): `Real gate > pretty badge. youandinotai.com`
- Caption: `Decoration vs. protection. Which one does your app have? youandinotai.com`
- Hashtags: `#datingapps #verified #onlinedating #datingadvice #appreview`

**D2-A3 — "Your time is the currency"**
- Hook: `The most expensive thing a fake profile steals isn't money`
- Slide 2: `It's your evenings. Your attention. Your hope.`
- Slide 3: `Protect the resource that doesn't refill →`
- Slide 4: `youandinotai.com — human-verified members only, so your time goes to real people.`
- Slide 5: `Verification is one strong filter — fewer fakes in the pool, fewer ways to get burned.`
- Slide 6 (CTA): `Spend your time on humans. youandinotai.com`
- Caption: `Nobody refunds you the three months you spent on a fake. youandinotai.com`
- Hashtags: `#onlinedatingsafety #catfish #datingtips #selfrespect #datingapps`

---

### DAY 3

**D3-A1 — "Bot bingo"**
- Hook: `Dating app bot bingo — how many have you hit?`
- Slide 2: `☐ "Hey handsome" opener ☐ link to a 'private page' ☐ answers questions you didn't ask`
- Slide 3: `☐ deleted account mid-conversation. Tired of playing? →`
- Slide 4: `youandinotai.com — a membership where every profile got human-verified first.`
- Slide 5: `Bingo card retired.`
- Slide 6 (CTA): `Stop collecting squares. youandinotai.com`
- Caption: `Comment your bingo count. Be honest. youandinotai.com`
- Hashtags: `#datingappfails #bots #onlinedating #datingmemes #catfish`

**D3-A2 — "The onboarding audit"**
- Hook: `I looked at what it takes to join most dating apps. It's an email.`
- Slide 2: `An email address. That's the whole security check.`
- Slide 3: `Now compare the joining requirement here →`
- Slide 4: `youandinotai.com — you verify you're human before you're a member. So does everyone else.`
- Slide 5: `Higher bar to enter = better room to be in.`
- Slide 6 (CTA): `Join a room with a door. youandinotai.com`
- Caption: `The bar is an email address. The bar can be higher. youandinotai.com`
- Hashtags: `#datingapps #onlinedating #appaudit #verified #datingculture`

**D3-A3 — "Green flags exist"**
- Hook: `Green flags in online dating (yes, they exist)`
- Slide 2: `They video call without excuses. Their stories stay consistent.`
- Slide 3: `And the biggest one: you met somewhere that verifies people →`
- Slide 4: `youandinotai.com — every match is a verified human. That's the baseline, not a bonus.`
- Slide 5: `Start from trust, not from doubt.`
- Slide 6 (CTA): `Date from a baseline of real. youandinotai.com`
- Caption: `Red flag content is easy. Here's the green flag list. youandinotai.com`
- Hashtags: `#greenflags #datingadvice #onlinedating #datingtips #healthydating`

---

### DAY 4

**D4-A1 — "Why bots love dating apps"**
- Hook: `Why is every dating app full of bots? An explainer.`
- Slide 2: `Bots are cheap to run and most apps have no human check at the door.`
- Slide 3: `So the fix isn't smarter swiping. It's a checked door →`
- Slide 4: `youandinotai.com — human verification required for every single member.`
- Slide 5: `Change the door, change the room.`
- Slide 6 (CTA): `Pick the room with the checked door. youandinotai.com`
- Caption: `It's not you. It's the door policy. youandinotai.com`
- Hashtags: `#bots #datingapps #onlinedating #explained #datingappfails`

**D4-A2 — "Feature that should be standard"**
- Hook: `One dating app feature that should be industry standard`
- Slide 2: `Not better filters. Not more swipes.`
- Slide 3: `Human verification for every account. Someone actually built it →`
- Slide 4: `youandinotai.com — membership = verified humans on both sides of every match.`
- Slide 5: `Everything else is a feature. This is a foundation.`
- Slide 6 (CTA): `Standards matter. youandinotai.com`
- Caption: `If one thing became standard tomorrow, this should be it. youandinotai.com`
- Hashtags: `#datingapps #onlinedating #techreview #verified #datingadvice`

**D4-A3 — "The first-message filter"**
- Hook: `You shouldn't have to interrogate your matches`
- Slide 2: `"Prove you're real" is an exhausting way to start a conversation.`
- Slide 3: `What if that part was already done? →`
- Slide 4: `youandinotai.com handles the "are you human" question before you ever match.`
- Slide 5: `First messages get to be about each other again.`
- Slide 6 (CTA): `Skip the interrogation. youandinotai.com`
- Caption: `Imagine opening with an actual question about them. youandinotai.com`
- Hashtags: `#onlinedating #datingtips #conversationstarters #datingapps #catfish`

---

### DAY 5

**D5-A1 — "POV: your match is a script"**
- Hook: `POV: you're flirting with 40 lines of code`
- Slide 2: `It compliments you. It agrees with everything. It has one goal: a link.`
- Slide 3: `Flirt with people instead →`
- Slide 4: `youandinotai.com — verified-human members only. Built to shut bots out.`
- Slide 5: `Chemistry requires a pulse.`
- Slide 6 (CTA): `Humans only. youandinotai.com`
- Caption: `If they agree with literally everything… run. youandinotai.com`
- Hashtags: `#bots #datingappfails #onlinedating #pov #datingmemes`

**D5-A2 — "Uptime for your love life"**
- Hook: `Rating dating apps like infrastructure`
- Slide 2: `Any platform can show you profiles. The question is what it filters out.`
- Slide 3: `Reliability = real humans, verified, every time you open it →`
- Slide 4: `youandinotai.com — verification-first platform. Support that answers. A feed of actual people.`
- Slide 5: `Boring reliability is the most romantic feature.`
- Slide 6 (CTA): `Dependable > flashy. youandinotai.com`
- Caption: `Judge apps like you'd judge infrastructure. youandinotai.com`
- Hashtags: `#datingapps #appreview #onlinedating #verified #techtok`

**D5-A3 — "Tell your group chat"**
- Hook: `Your group chat deserves better dating stories`
- Slide 2: `Less "I think it was a bot." More "we actually talked for hours."`
- Slide 3: `Better inputs, better stories →`
- Slide 4: `youandinotai.com — every member verified human, so the story starts real.`
- Slide 5: `Screenshot-worthy for the right reasons.`
- Slide 6 (CTA): `Upgrade the group chat content. youandinotai.com`
- Caption: `Tag the friend who narrates their matches to the group chat. youandinotai.com`
- Hashtags: `#groupchat #datingstorytime #onlinedating #datingapps #friends`

---

### DAY 6

**D6-A1 — "The unmatch mystery"**
- Hook: `Matched. Chatted. Account vanished. Again.`
- Slide 2: `Disappearing accounts are the signature move of fake profiles.`
- Slide 3: `Verification checks the human at the door — not disposable bot accounts →`
- Slide 4: `youandinotai.com — every member passed human verification to get in.`
- Slide 5: `Ghosting by a real person: survivable. Talking to nobody: avoidable.`
- Slide 6 (CTA): `Talk to people who exist. youandinotai.com`
- Caption: `The vanish isn't rejection — it usually wasn't a person. youandinotai.com`
- Hashtags: `#datingappfails #ghosting #onlinedating #catfish #datingstorytime`

**D6-A2 — "Questions to ask any dating app"**
- Hook: `5 questions to ask before trusting a dating app`
- Slide 2: `1. Who verified the profiles? 2. What happens to fakes? 3. Is verification required or optional?`
- Slide 3: `4. Is there real support? 5. Does the platform actually stay up? One app answers all five →`
- Slide 4: `youandinotai.com — required human verification, active support, reliable platform.`
- Slide 5: `Save this list. Use it everywhere.`
- Slide 6 (CTA): `Hold every app to this. youandinotai.com`
- Caption: `Bookmark this checklist for literally any dating app. youandinotai.com`
- Hashtags: `#datingadvice #onlinedating #checklist #datingapps #verified`

**D6-A3 — "For the ones re-downloading"**
- Hook: `To everyone re-downloading a dating app for the 5th time`
- Slide 2: `It's not that you're bad at this. The room keeps being full of fakes.`
- Slide 3: `Try a different room this time →`
- Slide 4: `youandinotai.com — a membership where verification is the price of entry for everyone.`
- Slide 5: `Same hope. Better odds environment.`
- Slide 6 (CTA): `Different room, different results. youandinotai.com`
- Caption: `The delete–redownload cycle ends when the room changes. youandinotai.com`
- Hashtags: `#datingapps #onlinedating #datingadvice #freshstart #datingtok`

---

### DAY 7

**D7-A1 — "Verification, explained simply"**
- Hook: `What "human verification" actually means (30 seconds)`
- Slide 2: `Every account proves a real human is behind it — before it can match or message.`
- Slide 3: `That single requirement removes bots, scripts, and mass-run fakes →`
- Slide 4: `youandinotai.com is built on exactly that requirement.`
- Slide 5: `Simple rule. Different experience.`
- Slide 6 (CTA): `See it in action. youandinotai.com`
- Caption: `The whole concept in 5 slides. youandinotai.com`
- Hashtags: `#explained #verified #onlinedating #datingapps #howitworks`

**D7-A2 — "Week 1 verdict format"**
- Hook: `The dating app standard I'm judging everything by now`
- Slide 2: `Required human verification. Real support. A platform that stays up.`
- Slide 3: `That's the bar. Here's who set it for me →`
- Slide 4: `youandinotai.com — verification-first membership, real humans on both ends.`
- Slide 5: `Once you see the bar, you can't unsee it.`
- Slide 6 (CTA): `Raise your bar. youandinotai.com`
- Caption: `New personal standard, effective immediately. youandinotai.com`
- Hashtags: `#datingapps #standards #onlinedating #verified #appreview`

**D7-A3 — "Sunday reset"**
- Hook: `Sunday reset: your online dating hygiene checklist`
- Slide 2: `Unmatch the ones who won't video call. Stop replying to profiles that feel scripted.`
- Slide 3: `And move the search somewhere verification already happened →`
- Slide 4: `youandinotai.com — every member human-verified. Safety built in, not bolted on.`
- Slide 5: `Clean feed, clear head, real people.`
- Slide 6 (CTA): `Reset with real. youandinotai.com`
- Caption: `Sunday reset but for your love life. Save for next week. youandinotai.com`
- Hashtags: `#sundayreset #datingtips #onlinedatingsafety #selfcare #datingapps`

---

## 3. Posting Schedule (all times US Central; adjust to audience analytics after Day 3)

Warm-up happens BEFORE Day 1 (Section 1): 2 days of scroll + 1 non-promo post per account, no app mention. The 21 scripts are the 7 promo days that follow (Days 1–7), and should run only AFTER founder approval; if approval lands mid-week, shift the whole grid — never skip warm-up.

| Slot | Account 1 (Bot Radar) | Account 2 (Audit) | Account 3 (Swipe Safe) |
|------|----------------------|-------------------|------------------------|
| Morning 7:30–8:30am | Post day's A1 script | — | Engage 5 min |
| Lunch 12:00–1:00pm | Engage 5 min | Post day's A2 script | — |
| Evening 7:30–9:30pm | — | Engage 5 min | Post day's A3 script |

- One promo post per account per day in week 1 (network total 3/day). Full FUNA-7 cadence of 3/day/account starts week 2, only for accounts that pass the scale criteria in Section 5 — ramping too fast on cold accounts triggers spam flags.
- Stagger: never post two accounts within 30 minutes of each other.
- Pick the trending sound at post time, not in advance (sounds die in 48h).
- Winner re-skins: an overperforming script may be reposted on a sibling account 48h+ later with fresh images.

---

## 4. Daily 10-Minute Engagement Routine (per account, phone-only)

Minutes 0–3 — own posts: reply to every comment (questions about the app → "it's youandinotai.com — every profile is human-verified"; never discuss pricing or payments in comments; hostile comments get one polite factual reply, then stop).
Minutes 3–6 — niche: open 5 dating-niche posts from the For You page; leave 2–3 genuinely useful comments (no app mention unless someone asks — 80/20 value rule from FUNA-7 compliance).
Minutes 6–8 — save/like 5–8 dating-niche posts (trains the algorithm toward the niche).
Minutes 8–10 — log metrics (Section 5) and note the day's best-performing hook style in one line.

Never: buy engagement, follow/unfollow churn, comment identical text across posts, link-drop in other creators' comments.

---

## 5. Metrics Log + Week-1 Kill/Scale Criteria

### Daily log (per post — keep in this folder as `tiktok-metrics-week1.md`, one row per post)

| Date | Post ID | Acct | Views 3h | Views 24h | Likes | Comments | "What app?" count | Saves (bookmarks) | Shares | Profile visits | Follows | Site visits (acct path, 24h) | Square orders same-day (founder-reported) | Notes |
|------|---------|------|----------|-----------|-------|----------|--------------------|--------------------|--------|----------------|---------|------------------------------|-------------------------------------------|-------|

Site visits come from Cloudflare analytics filtered to the account's `/tt*` path (see Link
strategy — attribution is a launch blocker). Square orders are reported by the founder from the
Square dashboard; log the count only, never customer details. Order counts are CONTEXT ONLY —
the checkout carries no campaign tag yet, so no order can be attributed to any account or to
TikTok at all (see Link strategy honesty limit). Never report an order as "from TikTok".

Derived daily: bookmark rate = saves/views (target 2%+, FUNA-7), share rate = shares/views, comment quality = count of "what's the app" comments (FUNA-7 target: 5+/video at scale).

### 24-hour post-mortem rule (revenue-tracker discipline)
Every post gets a one-line post-mortem in `ops/sales/campaigns/sales-run-log.md` exactly 24h after posting: what was claimed, what it measured, KEEP / RESKIN / KILL. No repeating a format that produced zero signal (0 saves AND 0 "what app?" comments AND <100 views at 24h) — kill it or rewrite the hook before it runs again. Same honesty standard as the tracker: report measured numbers only, never projected ones; conversion/revenue claims stay FUNDING_NOT_VERIFIED until an actual Square-side signal is observed by the founder.

### Week-1 review (Day 8, 30 minutes)

SCALE an account (move to 2–3 posts/day in week 2) if ALL of:
- Median 24h views across its 7 promo posts ≥ 300
- At least one post with bookmark rate ≥ 2% OR ≥ 3 "what app?" comments
- Zero moderation strikes / content removals
- Week-1 review MUST also record each account's total `/tt*` site visits and any same-day
  Square orders — an account driving real site visits outranks one with prettier TikTok
  numbers when deciding where week-2 effort goes

HOLD an account (repeat week-1 cadence with rewritten hooks) if:
- Median views 100–300, or engagement exists but no saves — the niche is right, hooks are weak. Rewrite hooks on the 3 best-saving scripts and rerun.

KILL an account's angle (keep the account, swap the angle) if ANY of:
- Median 24h views < 100 across 7 posts with no upward trend
- 0 saves and 0 "what app?" comments across all 7 posts
- Any moderation strike (faceless networks die by strikes — swap angle immediately, review what tripped it)

Network-level: if all 3 angles hit KILL criteria, do NOT add accounts — this is a format problem, not a scale problem. Write the post-mortem, test 3 new hook families on the best surviving account first. If ≥1 angle hits SCALE, week 2 = ramp that angle on its account AND clone its 3 best scripts to the other two accounts before creating any new accounts.

---

## 6. Claims Requiring Founder Verification BEFORE First Post

1. "Every profile/member passes human verification" and "verification is required to join" — must match how V8 Cloud Verification actually works in production today (all members, mandatory, pre-match). If verification is optional or not yet enforced for all members, all 21 scripts need softening before posting.
2. "No bots, no catfish" absolutes — drafted as "built to keep bots out" / "code doesn't get a profile"; confirm comfort level with this strength of claim.
3. "Support that answers" / "a platform that stays up" (D5-A2, D6-A2, D7-A2) — confirm support responsiveness and uptime posture are claims we stand behind publicly.
4. Bio link destination and whether a UTM-tagged URL should replace the bare homepage once bio links unlock (needed for the FUNA-7 2%+ CTR measurement).
5. Handle selections and whether these three angles are approved as the initial 3-of-5 FUNA-7 accounts.

Nothing in this file is posted anywhere. File awaits founder review.
