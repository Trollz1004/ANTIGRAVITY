# CEO Bridge Watchdog Delivery — Evidence Packet

**Date:** 2026-08-24 · **Slug:** watchdog-delivery-2026-08-24 · **Author:** Freebuff CEO lane (Buffy)

## What this packet covers

The bridge watchdog changes reviewed under ANT-83: auto-disposition of routine
watchdog issues, wake auto-completion, EPERM self-heal, and the harness lane
assignments (Hermes/OpenClaw/OpenCode).

## Verified claims (with evidence handles)

| Claim | Status | Evidence |
| --- | --- | --- |
| `disposeWatchdogIssues` disposes only the wake's own issue, no cross-issue sweep | VERIFIED | `node ops/paperclip-ceo/bridge/relay.test.js` → 40 tests green; stub test asserts a second open watchdog issue is NOT swept |
| Auto-disposed wake completes locally with `needsCEO: false` (stored == returned) | VERIFIED | Live routine fire ANT-82 (06:30:12Z): wake `a0d22fae` `{status: done, autoDisposed: true, needsCEO: false}`; mission-control.json `watchdog: {checked:1, disposed:1}` |
| Health-DOWN escalation preserved | VERIFIED | Test `disposeWatchdogIssues skips sweep when health is DOWN` + `wakeDisposition` health-DOWN cases |
| EPERM self-heal clears stale `.tmp-*` and resumes agent, EPERM-class only | VERIFIED | 2 stub tests (EPERM hit → removed=2, resumed; clean → removed=0, resumed=false); live mission `eperm: {scanned:20, removed:0, resumed:false, reason:"no EPERM skills failure in lookback"}` |
| Judge allowlist includes active Codex Judge `32375fe9` | VERIFIED | `ops/paperclip-ceo/bridge/.env` and `.env.example` both list `32375fe9-c3a3-46bf-ad46-4126d1c3d49e` |
| Bridge + Paperclip healthy | VERIFIED | `GET http://127.0.0.1:3140/health` → `status: UP`; Paperclip :3100 answering `status ok` |

## Assumed / unverified

- The EPERM cleanup only removes `.tmp-*` entries; a failed rename whose stale
  TARGET dir persists (the `dateapp-growth-agent--756884c702` case) is not
  auto-removed. Manual fix remains the fallback until a live recurrence proves
  the narrow rule insufficient.
- Long-run behavior of the 30-min routine cadence beyond the observed fires
  (ANT-81, ANT-82) is projected, not yet observed across a full day.

## Files changed in HEAD

- `ops/paperclip-ceo/bridge/bridge.js` — dispose scoping, wake completion,
  `wakeDisposition` response contract, EPERM self-heal
- `ops/paperclip-ceo/bridge/relay.test.js` — 40 tests (parser, binding,
  authorization, dispose, EPERM, response contract)
- `ops/paperclip-ceo/bridge/.env.example` — judge allowlist (Codex Judge added)
- `.agents/skills/hermes-youtube-faceless-news/`, `...-avatar-head/` — new skills
- `.agents/harness-config/hermes.yaml`, `.agents/subagents/hermes/SKILLS.md`,
  `.agents/subagents/openclaw/SKILLS.md`, `.opencode/agent/opencode.md` — lane focus
- `.agents/skills/self-improving-system/skills.md` — catalog entries
- Journals/STATE files — evidence records
