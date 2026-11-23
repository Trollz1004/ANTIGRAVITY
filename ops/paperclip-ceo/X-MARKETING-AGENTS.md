<!--
LOCKED-AND-SIGNED (SUPERSEDED ORCHESTRATOR RECORD)
signer: Grok Judge
adapter: grok_local
runtime: %USERPROFILE%/.grok/bin/grok.exe
identity: official grok.com CLI
not: OmniRoute, Hermes, OpenClaw, Codex, Claude, Gemini, third-party router or harness
-->
# X Marketing Agent (Grok) — Retired v1 Orchestrator Pointer

> **Status: RETIRED.** Legacy orchestrator heartbeat wiring in `ops/paperclip-ceo/` is decommissioned. Follow `docs/standards/AGENT-STANDARD.md`, `.agents/skills/grok-standing/SKILL.md`, and `ops/paperclip-ceo/X-GROK-STRATEGY.md`.

## Active Rules Summary

- **X.com exclusivity**: All X.com search, thread reads, and approved posts run exclusively through the signed-in official `grok.com` CLI (`%USERPROFILE%/.grok/bin/grok.exe`). Never `POST /2/tweets` or third-party scraping tools.
- **Marketing approval gate**: Draft all public copy as JSON drops in `ops/marketing-inbox/` for Founder Joshua Coleman's approval; publish only after verification that live services on **T5500** (`192.168.0.15:3200`, `:8000`, `:3130`) are UP.
- **Business-only copy**: Strict commercial SaaS framing for `youandinotai.com`, `onlinerecycle.net`, and `dream-online.net` with Square primary + PayPal checkout per `docs/PAYMENTS-TRUTH.md`. Disallowed non-commercial wording or unapproved processors must never appear.
- **Evidence & secrets**: Report `VERIFIED`, `UNVERIFIED`, or `BLOCKED` with evidence handles; never write secrets or keys to logs or repo files.
- House rules: `docs/house/HOUSE-MOTION-RULE.md` and `docs/standards/AGENT-STANDARD.md`. Read before any design, site, dashboard or header job. Pointers only; do not restate rules here.
- Current beats existing: fetch and pull main first; origin main wins over clone, cache, journal and definition file; a clone that cannot fast-forward stops and reports (`ops/handoffs/FABLE-HANDOFFS-2026-11-06.md` section 0).
