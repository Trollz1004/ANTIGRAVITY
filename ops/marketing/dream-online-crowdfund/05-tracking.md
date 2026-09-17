# DREAM Online — Tracking Plan (Phase 2)

## 1. UTM Scheme, by Channel (from 03-copy.md)

Base: `utm_medium=social` for all social posts, `utm_medium=email` for the backer email, `utm_medium=video` for the devlog. `utm_campaign=dream-launch` everywhere. Base URL: `https://opencollective.com/dream-online`.

| Channel (copy section) | utm_source | utm_medium | utm_content | Ready-to-paste URL |
|---|---|---|---|---|
| X posts 1–8 (b) | x | social | x-post-01 … x-post-08 (one value per post number) | `https://opencollective.com/dream-online?utm_source=x&utm_medium=social&utm_campaign=dream-launch&utm_content=x-post-01` |
| Reddit r/MMORPG (c) | reddit | social | r-mmorpg | `https://opencollective.com/dream-online?utm_source=reddit&utm_medium=social&utm_campaign=dream-launch&utm_content=r-mmorpg` |
| Reddit r/gamedev (c) | reddit | social | r-gamedev | `https://opencollective.com/dream-online?utm_source=reddit&utm_medium=social&utm_campaign=dream-launch&utm_content=r-gamedev` |
| Reddit r/IndieGaming (c) | reddit | social | r-indiegaming | `https://opencollective.com/dream-online?utm_source=reddit&utm_medium=social&utm_campaign=dream-launch&utm_content=r-indiegaming` |
| TikTok script (d) | tiktok | social | tiktok-caravan | `https://opencollective.com/dream-online?utm_source=tiktok&utm_medium=social&utm_campaign=dream-launch&utm_content=tiktok-caravan` |
| Same script as YouTube Short (d) | youtube | social | shorts-caravan | `https://opencollective.com/dream-online?utm_source=youtube&utm_medium=social&utm_campaign=dream-launch&utm_content=shorts-caravan` |
| YouTube devlog (e) | youtube | video | devlog-01 | `https://opencollective.com/dream-online?utm_source=youtube&utm_medium=video&utm_campaign=dream-launch&utm_content=devlog-01` |
| Backer email (f) | email | email | backer-update-01 | `https://opencollective.com/dream-online?utm_source=email&utm_medium=email&utm_campaign=dream-launch&utm_content=backer-update-01` |

Each post gets its own `utm_content` value (increment the number, e.g. `r-mmorpg`, `r-mmorpg-02` for a follow-up) so clicks are attributable to one exact post, never to the channel as a whole.

## 2. What Open Collective Itself Reports

The Collective's public page (`opencollective.com/dream-online`) shows, live and without login: total raised, active-backer count, and a per-tier breakdown (Backer / Founder / Sponsor / Guild seats filled). This is the platform's own number — nothing calculated off-platform.

To export the underlying ledger: from the Collective's Dashboard, go to **Transactions** and click **Export CSV** (filterable by contribution vs. expense, date range, or tier). Source: [Open Collective — Exporting Transactions](https://documentation.opencollective.com/advanced/ledger/exporting-transactions).

## 3. Daily Scorecard — TRACKED Fields Only

| Field | Source |
|---|---|
| Impressions (per post, where the platform shows a view/impression count) | Native analytics on each platform (X post analytics, Reddit post view count, TikTok/YouTube view count) |
| Clicks by utm_content | Landing/redirect log or OC referral read where UTM parameters are visible in the URL bar record |
| New backers (count) | Open Collective public page, read by hand, logged with date |
| Monthly recurring total | Open Collective public page's stated recurring/monthly figure, read by hand, logged with date |

No field is filled from memory or estimate. A blank cell means the number has not been read yet — it is never filled with a guess.

## 4. Decision Rule — Day 7 and Day 14

**Day 7 check (non-programmer steps):**
1. Open the scorecard log for days 1–7.
2. For each channel, add up its clicks (by utm_content) and divide by its impressions, if impressions exist for that channel. That is the channel's click rate.
3. Compare channels against each other, not against a target number.
4. **If** one channel's click rate is clearly the highest (at least double the next-best) **and** it produced at least one new backer or OC page click → keep posting there, reduce the weakest channel.
5. **If** every channel shows clicks but zero new backers by day 7 → continue as planned through day 14 before changing anything (7 days is too short to judge backer conversion).
6. **If** a channel shows zero clicks after at least 3 posts → stop posting on that channel and do not replace it yet.

**Day 14 check:**
1. Total the full 14-day log: impressions, clicks, backers, recurring total.
2. **If** total new backers is greater than zero and at least one channel shows a repeatable click rate → continue that channel, drop any channel that produced zero clicks across the full 14 days.
3. **If** total new backers is zero and total clicks are also near zero across every channel → change channel mix (swap the weakest post type for a new one) before running another 14-day cycle.
4. **If** total clicks exist but zero backers after 14 days → stop and revisit the Open Collective page copy and tiers before posting again; the traffic problem is solved, the conversion problem is not.

## 5. What We Will Report, and What We Won't

- We will report exactly what a platform's own dashboard or Open Collective's own page shows, dated.
- We will report click counts only where a UTM-tagged link was actually clicked and logged.
- We will not report an estimate, a projection, or a "trending toward" number.
- We will not average or extrapolate from a partial day.
- We will not combine platforms into a single number unless each contributing number was independently read and logged first.
- If a number cannot be read from its own source, the scorecard cell stays blank, not filled in.
