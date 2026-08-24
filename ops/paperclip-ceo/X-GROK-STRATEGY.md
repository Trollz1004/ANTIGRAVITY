<!--
LOCKED-AND-SIGNED
signer: Grok Judge
agentId: 44a7bbb7-d01e-4f88-aa45-899b60f987de
adapter: grok_local
runtime: C:/Users/joshi/.grok/bin/grok.exe
identity: official grok.com CLI grok 1.0.5 (5115b46bc9)
not: OmniRoute, Hermes, OpenClaw, OpenCode, Codex, Claude, Gemini, X Developer API, third-party X poster
-->
# X.com strategy — Grok exclusive (youandinotai.com)

**Rule:** Anything associated with X.com (search, thread fetch, mentions, replies, posts, polls, DMs, media, twitter-cli, developer.x.com, cookies) is **Grok only**. Hermes, OpenClaw, OpenCode, Buffy, Codex, Claude, and Gemini must not call X. They may *assign* X work to [X Marketing (Grok)](/ANT/agents/x-marketing-grok) or [Grok Judge](/ANT/agents/grok-judge).

**Why:** Official X Developer API is the limited, billed route (pay-per-use since 2026: ~$0.015/post, **$0.20 if the post contains a URL**, $0.005/read; Free-tier write ~17 posts/day; unverified account cap ~50 original posts + 200 replies/day across web+API). Grok’s native X tools (`x_search` / keyword / semantic / user / thread) are first-party access to the X corpus via grok.com account-auth — not the X Developer app quota. Reads and research stay on Grok so we do not burn the $100/mo X Basic search tax or the 15-minute POST `/2/tweets` bucket.

Posts still count against the **X account** if we publish. Do not hammer. Draft to `ops/marketing-inbox/`. Joshua approves. Then Grok posts via grok.com tools.

---

## Goal

Company goal: **$5,000** Square membership/access on youandinotai.com ([ANT-64](/ANT/issues/ANT-64) / [ANT-65](/ANT/issues/ANT-65) / [ANT-66](/ANT/issues/ANT-66)). X is a funnel, not a firehose.

## Copy (business-only)

Allowed: membership, verification, safety, support, uptime, platform access, Square checkout.
Banned on public X: donate, donation, charity, kids hospitals, revenue split, Stripe.
Do not invent product claims that are not on the live site.

## Cadence (Grok-native, rate-aware)

| Lane | Who | Tool | Volume |
| --- | --- | --- | --- |
| Research / listen | X Marketing (Grok) | grok.com `x_keyword_search`, `x_semantic_search`, `x_thread_fetch`, `x_user_search` | Heavy — this is the rate win vs X API search |
| Draft | X Marketing (Grok) | inbox JSON | Daily if marketing gate is green |
| Publish | X Marketing (Grok) after Joshua approval | grok.com native post, never `POST /2/tweets` | Sparse: quality threads, not 50 unverified posts/day |
| Judge | Grok Judge only if an X artifact must be verified | same grok.com tools | Read-only unless Joshua says otherwise |

Never: twitter-cli, OpenCLI twitter, agent-reach write, Codex/Claude browser posting, OmniRoute as the model that talks to X.

## Content that converts (research, 2026)

- Niche first. Dating apps that scale on social pick one sharp audience, not “everyone.”
- Audience before spend. Starcrossed-style: content in-niche, then paywall/membership CTA.
- X format: short hook → one proof (verification, safety, uptime) → CTA to youandinotai.com membership. Put the URL only on approved posts (X API charges extra for URL posts; grok.com path still should not spam links).
- Replies to real dating-pain posts beat cold blasts. Grok search finds them without X API recent-search quotas.
- IRL / UGC clips belong on Reels/TikTok; X carries the thread + proof + support link.
- Track D1 interest in Square checkouts, not vanity likes.

## Marketing gate (unchanged)

No draft/post until CEO checklist is UP this session: frontend, backend db+redis+square, tunnel+DNS, support routes, Mission Control.

## Evidence standard

Every X claim: VERIFIED / UNVERIFIED / BLOCKED with a handle (post id, search query, inbox path). Invented engagement is forbidden.
