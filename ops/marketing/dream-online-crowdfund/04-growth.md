# DREAM Online — Growth Plan (Phase 1)

## 1. The Funnel

| Stage | One Metric | How It Is TRACKED |
|---|---|---|
| Impression | Posts/videos seen | Native platform view count on each post (screenshot logged weekly, no paid boosting) |
| Click | Link clicks to landing page | UTM-tagged links: `?utm_source=<platform>&utm_medium=social&utm_campaign=dream-launch&utm_content=<asset-name>`, read from landing page server logs |
| Landing view | Sessions on the landing page | A single self-hosted counter script on the landing page (increments on page load, no third-party ad pixel) |
| Collective page view | Visits that reach opencollective.com/dream-online | UTM parameter carried through the outbound link from the landing page to Open Collective; counted from the landing page's own outbound-click log |
| Backer conversion | New backers per tier | Open Collective's own public contributor and budget stats (the platform's built-in dashboard), read and recorded by hand into a dated log entry, no estimate |

Every stage has exactly one owned, checkable number. No stage is reported until its own tool has produced that number.

## 2. Three Growth Loops (built from the game's own mechanics)

**Loop A — Named NPC Gossip.** A backer names one NPC. That NPC's state tick (GDD §12 world engine) carries the backer's chosen name into the gossip network as a `fact`, which spreads to neighboring NPCs as a `rumor` within two ticks. The backer gets a link to watch their NPC's name appear in another NPC's line. Loop: name → gossip spreads → backer shares the screenshot to show a stranger their name exists inside a living world → new visitor clicks through.

**Loop B — Founder Fable.** A Founder-tier backer's name or chosen deed is written into the world as a `fable`-tagged message, carried across every future epoch swap at one tier lower each time (per the epoch-demotion rule) so it never disappears, only fades. The backer receives the exact fable text and a permanent in-world reference. Loop: back at Founder → fable is written → backer shares the fable as proof of permanence → sharing signals status that money alone doesn't buy elsewhere.

**Loop C — Referral Memory.** A referred player's starting NPC is seeded with one memory slice: who sent them. On first meeting, that NPC greets the new player by naming the referrer. Loop: existing backer shares a referral link → new player's first in-game moment is personalized around the referrer → referrer is told (via one landing-page confirmation, not an in-game reward) that their name was spoken → referrer shares again.

All three loops use mechanics already specified in the world engine (state tick, truth tags, epoch demotion, proximity greeting); none require a new system.

## 3. 14-Day Launch Sequence

Each day lists channel(s) and the evidence that marks it done — a saved screenshot, a logged number, or a committed file, dated.

1. **Landing page + counter live.** Evidence: counter script fires, first count logged.
2. **Open Collective page live, tiers confirmed.** Evidence: public OC URL returns the four tiers.
3. **First founder-account post (no boosting).** Channel: primary social account. Evidence: post URL + view count.
4. **UTM link test.** Evidence: one manual click-through, confirmed in landing log.
5. **Second post: Loop A explainer (name-an-NPC).** Evidence: post URL.
6. **Direct outreach to 5 known contacts (personal message, not mass).** Evidence: message count sent, logged.
7. **Rest/monitor day — no new post.** Evidence: day-6 metrics recorded (impressions, clicks, landing views, OC views, backers).
8. **Third post: Loop C explainer (referral memory).** Evidence: post URL.
9. **First backer follow-up: confirm their NPC name is live.** Evidence: screenshot sent to backer.
10. **Fourth post: Founder fable explainer (Loop B).** Evidence: post URL.
11. **Community reply day — answer every comment/question, no new post.** Evidence: reply count.
12. **Fifth post: progress recap using only recorded numbers.** Evidence: post URL, numbers cross-checked against OC stats.
13. **Second outreach batch to 5 more contacts.** Evidence: message count logged.
14. **Two-week recorded-numbers review.** Evidence: full funnel table filled in from real logs, decision made on which loop to keep running.

## 4. Three Experiments

1. **Hypothesis:** Naming the loop explicitly in post copy (Loop A) drives more clicks than a generic "join our world" post. **Variant:** two otherwise-identical posts, one with the naming mechanic described, one without. **Sample needed:** at least 200 combined impressions per variant before comparing. **Decision rule:** if the named-mechanic post's click rate is at least 20% higher, use that framing going forward; otherwise keep both in rotation.

2. **Hypothesis:** A direct personal message converts to a landing-page visit better than a public post. **Variant:** 10 direct messages vs. UTM-tracked clicks from one public post reaching a similar audience size. **Sample needed:** 10 messages sent and matched against 10+ tracked post clicks. **Decision rule:** if direct messages produce at least double the click-through rate, prioritize direct outreach over posting volume next cycle.

3. **Hypothesis:** Showing the Founder fable text (Loop B) converts landing visitors to Open Collective clicks better than showing the tier price alone. **Variant:** landing page section A (fable example) vs. section B (price list only), shown on alternating days. **Sample needed:** at least 50 landing sessions per variant. **Decision rule:** whichever variant produces more outbound OC clicks per session stays; the other is dropped.

## 5. What We Will NOT Do

- No paid advertising of any kind until Open Collective proceeds cover model-inference cost, confirmed from OC's own recorded balance.
- No mechanic inside the game that routes player earnings to anyone outside the game, in any form.
- No public claim of any number — impressions, clicks, backers, or growth rate — that was not read directly from its own tracked source and logged with a date.
