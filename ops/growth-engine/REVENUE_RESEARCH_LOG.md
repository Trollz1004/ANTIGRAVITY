# Revenue & Growth Research Log

## [2026-09-23 21:08] Micro-Directory & Startup Submissions
- **Summary:** Submitting YouAndINotAI to 50+ free startup directories (BetaList, ProductHunt, LaunchingNext, AlternativeTo).
- **Action Taken:** Configured directory-submissions skill for automated indexing.

## [2026-09-23 21:08] Interactive Quiz / Dating Profile Health Checker
- **Summary:** Free 1-minute quiz ('Is your profile attracting bots?') driving visitors directly to $1 Bot-Shield & $14.99 AI Profile Review.
- **Action Taken:** Integrated into conversion-optimization funnel plan.

## [2026-09-24 10:02] Micro-Directory & Startup Submissions
- **Summary:** Submitting YouAndINotAI to 50+ free startup directories (BetaList, ProductHunt, LaunchingNext, AlternativeTo).
- **Action Taken:** Configured directory-submissions skill for automated indexing.

## [2026-09-24 10:02] Interactive Quiz / Dating Profile Health Checker
- **Summary:** Free 1-minute quiz ('Is your profile attracting bots?') driving visitors directly to $1 Bot-Shield & $14.99 AI Profile Review.
- **Action Taken:** Integrated into conversion-optimization funnel plan.

## [2026-09-24 10:02] Audit of this pass
- **Summary:** `revenue_research_engine.py` exited 0 and appended the same two canned tactics as 2026-09-23. It does not search the web. No `directory-submissions` skill exists in the tree, and no quiz page is wired. Referral codes are real code (`ops/growth-engine/referral_links.py`, LOVE-XXXXXXXX into `growth.db`). QR banners are a generator script (`generate_qr_promos.py`), not a measured channel. Fresh external note, not executed: 2026 dating-app acquisition writeups say do not buy users into an empty market; free levers that compound are a two-sided referral (inviter and invitee), post-match invite prompts, and value-first Reddit threads. Paid social, UGC, and creator fees stay out of scope under the free-only rule.
- **Action Taken:** Logged only. No directory submission, no quiz build, no posts.

## [2026-09-25 10:00] Micro-Directory & Startup Submissions
- **Summary:** Submitting YouAndINotAI to 50+ free startup directories (BetaList, ProductHunt, LaunchingNext, AlternativeTo).
- **Action Taken:** Configured directory-submissions skill for automated indexing.

## [2026-09-25 10:00] Interactive Quiz / Dating Profile Health Checker
- **Summary:** Free 1-minute quiz ('Is your profile attracting bots?') driving visitors directly to $1 Bot-Shield & $14.99 AI Profile Review.
- **Action Taken:** Integrated into conversion-optimization funnel plan.

## [2026-09-25 10:05] Audit of this pass + fresh external research
- **Summary:** `revenue_research_engine.py` exited 0 but again appended the same two canned tactics (directory submissions, quiz) it has logged since 09-23 — it performs no web search and executes nothing. Fresh external research (2026 sources) this pass, free-only levers ranked by fit: (1) **Web-app referral loop, two-sided** — "invite a friend, both get X" with visible progress; realistic K-factor for dating in 2026 is 0.2-0.4; we already have real code (`referral_links.py`, LOVE-XXXXXXXX into growth.db) — the gap is surfacing the link post-signup/post-match, not generating it. (2) **Community concentration beats breadth** — every 2026 dating-launch source repeats: pick ONE community/geo, get to critical mass there; contribute 10 value replies per 1 mention; value-first Reddit threads are already our JARVIS pipeline's format. (3) **Landing/pricing simplicity for the $1 Bot-Shield** — micro-SaaS data: at low traffic every confused visitor is unreplaceable; pricing must parse in <10s; 2-tier beats 3-tier ($1 impulse entry → $14.99 review as the target tier). (4) **Shareable artifact** — "dating wrapped"/stats-card style screenshots users post themselves; a bot-detection quiz RESULT card would be the free version of this and finally makes the long-logged quiz idea earn its keep. Out of scope under free-only rule: ASO/app-store tactics (we are web-only), Apple Search Ads, Meta UA, paid micro-influencers.
- **Action Taken:** Logged only. Publishing path remains the JARVIS proposal inbox (2/brand/day); no direct posts, no builds this pass.

## [2026-09-30 10:00] Micro-Directory & Startup Submissions
- **Summary:** Submitting YouAndINotAI to 50+ free startup directories (BetaList, ProductHunt, LaunchingNext, AlternativeTo).
- **Action Taken:** Configured directory-submissions skill for automated indexing.

## [2026-09-30 10:00] Interactive Quiz / Dating Profile Health Checker
- **Summary:** Free 1-minute quiz ('Is your profile attracting bots?') driving visitors directly to $1 Bot-Shield & $14.99 AI Profile Review.
- **Action Taken:** Integrated into conversion-optimization funnel plan.

## [2026-09-30 10:01] Audit of this pass + fresh external research (free-only)
- **Summary:** `revenue_research_engine.py` exited 0 and again appended the same two canned tactics (Micro-Directory submissions, Interactive Quiz) it has logged since 2026-09-23 — it performs no web search and executes nothing. Real external research this pass (2026 sources, free-only under "AI pays for AI" rule): (1) **Two-sided referral credits beat single-sided** — Dropbox data: double-sided reward lifted program participation +29% vs single-sided; Dropbox itself captured 35% of daily signups via referrals at peak and trimmed paid CAC 27%. We already generate LOVE-XXXXXXXX codes in `ops/growth-engine/referral_links.py` writing to `growth.db`; the gap is the **two-sided credit** — invitee currently gets nothing — and the **surface** (post-signup modal, post-match invite prompt), not the link itself. (2) **K-factor reality check** — at K=0.5 (typical 2026 dating referral per Launchlist), 10 viral cycles ≈ 1,750 users; K=1.0 → 3,000. We are nowhere near measuring K yet because referral share of signup is untracked. (3) **Community concentration over breadth** — Admiral, r/startups, r/dating_advice all converge: pick ONE subreddit or geo, do 10 value replies per 1 mention, lean into controversy (bot-detection is already a controversial hook), don't spray 50 directories. (4) **Pricing-parsing for the $1 Bot-Shield** — micro-SaaS conversion data: at low traffic each confused visitor is unreplaceable; $1 impulse → $14.99 review is a sound 2-tier ladder, but the landing page must surface both in <10s. Out of scope (free-only): Meta UA, Apple Search Ads, paid micro-influencers, ASO. Out of scope (date-app doctrine): ASIDE is not on Sabretooth, Aider is not a marketing lane.
- **Action Taken:** Logged only. No posts, no builds, no code changes. Next-pass asks: (a) measure referral share of signup from `growth.db` (free SQL); (b) wire an invitee-side bonus to make referrals two-sided (date-app code change, not marketing); (c) surface the referral link post-signup and post-match (frontend change). All three depend on date-app code work, not this cron.

## [2026-10-01 10:00] Micro-Directory & Startup Submissions
- **Summary:** Submitting YouAndINotAI to 50+ free startup directories (BetaList, ProductHunt, LaunchingNext, AlternativeTo).
- **Action Taken:** Configured directory-submissions skill for automated indexing.

## [2026-10-01 10:00] Interactive Quiz / Dating Profile Health Checker
- **Summary:** Free 1-minute quiz ('Is your profile attracting bots?') driving visitors directly to $1 Bot-Shield & $14.99 AI Profile Review.
- **Action Taken:** Integrated into conversion-optimization funnel plan.

## [2026-10-01 10:01] Audit of this pass + fresh external research (free-only)
- **Summary:** `revenue_research_engine.py` exited 0 and again appended the same two canned tactics (Micro-Directory submissions, Interactive Quiz) it has logged every day since 2026-09-23 — it performs no web search and executes nothing; this is the 4th identical log in 8 days. **Ground-truth on what is actually moving** (queried `ops/growth-engine/growth.db` directly): `social_posts` has 21 rows, **all `pending`, engagement=0, 0 `posted`, 0 distinct platforms reached**; `referral_codes` has 1 row (`LOVE-4E82A19E`, uses=0, conversions=0) — referral code exists in the DB but has never been used. No signups, no conversions, no measured K-factor. The "publishing pipe" is still `blocked_no_cdp` from the 2026-09-17 digest — 14 days and counting. **Fresh external research (2026 sources, free-only):** (1) **K-factor math is the only free lever that compounds** — AppsFlyer's worked example: 1-invite-per-user × 33.3% conversion → K=0.333 → after 33 viral cycles, 1M+ users. Our DB has 1 code with 0 uses; we are at K≈0, not K=0.3. **The single most leveraged action this week is making the referral code shareable on a single landing page**, not 50 directory submissions. (2) **Two-sided referral rewards** — Dropbox's published lift: double-sided reward +29% participation vs single-sided, captured 35% of daily signups at peak, trimmed paid CAC 27%. Our current code gives the inviter 0% and the invitee 0% — the loop is structurally closed at zero. (3) **Distribution picks community over breadth** — Admiral, r/startups, r/AppBusiness all repeat: ONE subreddit or geo, 10 value replies per 1 mention, lean into bot-detection controversy. Our 7 pending Reddit posts (r/hingeapp etc.) have been "ready to publish" since Sep 13; **zero have left the DB**. (4) **Status quo lock-in is the actual blocker** — the auto-poster generates content (proven: 21 rows of well-formed hooks/scripts) but cannot reach Chrome for publishing; no cron has touched the CDP connection. Every day this cron appends the same canned tactics while the actual rate-limiter (`blocked_no_cdp`) sits untouched. (5) Out of scope under free-only: Meta UA, Apple Search Ads, paid micro-influencers, ASO. (6) Out of scope (date-app doctrine): ASIDE is not on Sabretooth, Aider is not a marketing lane. **Net research verdict for this pass:** the catalogued tactics are not wrong, they are simply not executed; the highest-EV change is publishing the 7 pending Reddit posts via any available path (CDP heal, manual, or Reddit RSS API), not logging a new tactic.
- **Action Taken:** Logged only. No posts, no builds, no code changes. Next-pass concrete asks: (a) attempt CDP heal of the social auto-poster to clear the `blocked_no_cdp` rate-limiter (currently 14 days stale); (b) publish at least one of the 7 pending Reddit posts to r/hingeapp manually or via Reddit RSS API to break the "0 posted" state; (d) decide two-sided referral reward structure (inviter credit % + invitee credit %) — date-app code change, gated on Joshua's money call per prior memory note that 50% payout ledger is not built. All three are execution gaps, not research gaps; further `revenue_research_engine.py` log entries without execution will be flagged as noise.
