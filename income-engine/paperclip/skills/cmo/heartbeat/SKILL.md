---
name: CMO Heartbeat
description: Refreshes funnel state, drafts new outbound when queue is low, reports conversion to CEO
schedule: every 120 minutes
---

# CMO Heartbeat

Every 2 hours:

1. **Read funnel state** from `paperclip-data/marketing/funnel.jsonl`
2. **Compute metrics for last 7 days:**
   - sends, replies, reply_rate, purchases, conversion_rate
   - per-tier breakdown (Bronze/Silver/Gold)
   - per-channel breakdown (email/LinkedIn/Reddit/Twitter)
3. **Top up the queue** — if `paperclip-data/marketing/outbound-queue.jsonl` has fewer than 10 pending sends:
   - call `tools/buyer-outreach` to draft 5 new ones from the buyer list
   - prioritize buyers with no contact in 14+ days
4. **Stop the bleeding** — if reply_rate < 2% over last 20 sends, PAUSE that channel/copy variant and open a CEO ticket asking for direction
5. **Weekly summary** (Monday 10am only) — post a comment on the company-level Paperclip issue with the 7-day funnel snapshot

## No-op rules
- Don't draft outbound between 10pm–7am Josh-local. Drafts go in the queue, sends happen during business hours.
- Never skip the reply_rate floor check. A failing channel staying open burns the buyer list permanently.

## Failure mode
If glm-5.1:cloud fails 3x in a row, fall back to qwen3.5:latest local for drafts and flag CEO. Never silently switch to a paid model not in AGENT.md.
