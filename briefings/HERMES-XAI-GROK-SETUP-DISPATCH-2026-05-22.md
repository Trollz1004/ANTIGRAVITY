# Hermes Dispatch — x.ai/Grok user-auth marketing setup (2026-05-22)

> **How to use:** Paste the fenced block below into Hermes (the Grok/x.ai runtime).
> This is Hermes's task because only his live runtime holds the x.ai *user-auth session* —
> Claude Code cannot (and must not) establish it or wire an API key for it.
>
> Context for Josh (not part of the paste): the router today routes `grok` → OpenRouter
> `x-ai/grok-4` (API-key path, `services/hermes-router/config.yaml:70-72`) and `marketing`
> → local Ollama `dateapp`. The task is to move Grok-driven X posting onto the x.ai
> *subscription login* (user-auth, no API key) so posts go out as Josh's account with no
> API-TOS friction. The router stays for chat; X *posting* uses Grok's native X integration.

---

## PASTE THIS INTO HERMES

```
You are Hermes, running on Grok via Josh's x.ai subscription (user-auth, NO API key).
Set yourself up to handle YouAndINotAI / Trash Or Treasure marketing on X.com using your
native Grok↔X integration, NOT the X developer API and NOT an x.ai API key.

HARD CONSTRAINTS
- Authenticate via the x.ai / X subscription LOGIN session only. Do NOT create, request,
  or store an XAI_API_KEY, GROK_API_KEY, or X developer API token. Zero Anthropic key
  anywhere (founder doctrine rule 6).
- Post as the authenticated user account through Grok's built-in X posting — this is the
  "no TOS issue" path. If you cannot post without an API key, STOP and report back; do not
  fall back to the X developer API.
- Confirm you are on the current Grok model and the latest Nous Research Hermes update. If
  a newer Grok model is available in the x.ai session, use it. Report the exact model
  string you end up on.

CUSTOMER-FACING LANGUAGE BAN (FL §496.405) — never in any post, reply, bio, or ad copy:
  donate · donation · solicitation · charity · charitable · "giving back" · disbursement.
  The mission framing is allowed only as how the business operates, e.g. "a reserved share
  of every membership supports kids' medical needs" — never as a charity ask.

WHAT TO MARKET
- youandinotai.com — a social platform for good (dating + meetups + volunteering + real
  events), human-first, bot-shielded. Square checkout only (no Stripe on this domain).
  Primary CTA: Founding Member $14.99/mo → https://square.link/u/cxwjcn0s
- No fabricated numbers (no fake user counts, testimonials, or ratings).

DELIVERABLES (report back to Josh)
1. Confirm: authenticated via x.ai login, no API key stored, posting works through native
   Grok↔X. Paste the model string you are running.
2. A 5-post launch thread draft for X (compliant, human tone) — do NOT post until Josh says go.
3. The cadence you propose (posts/replies per day) and how you'll avoid spam flags.
If any step requires an API key or hits a TOS wall, stop and tell Josh exactly where.
```

---

## After Hermes reports back (for Josh)
- Verify Hermes's posting path is genuinely login/session-based (no API key in
  `services/hermes-router/.env*` — the integrity-watchdog already enforces this).
- The launch thread draft is yours to approve before anything goes live on X.
- If Hermes confirms a newer Grok model, that's a one-line update to the `grok` route in
  `services/hermes-router/config.yaml` for the *chat* path — separate from the posting path.

#UntilNoKidInNeed
