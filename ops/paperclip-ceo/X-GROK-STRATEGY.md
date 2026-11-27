<!--
LOCKED-AND-SIGNED
signer: Grok Judge
adapter: grok_local
runtime: %USERPROFILE%/.grok/bin/grok.exe
identity: official grok.com CLI
not: OmniRoute, Hermes, OpenClaw, OpenCode, Codex, Claude, Gemini, X Developer API, third-party X poster
-->
# X.com Strategy — Grok Exclusive (`youandinotai.com`)

**Rule:** Anything associated with X.com (search, thread fetch, mentions, replies, posts, polls, DMs, media) is **Grok only**. Other agent lanes (`Opus 5.5` / `Fable`, `Gemini 4 Carbon`, `GPT-6 Astra` / `GPT-6.1 Sol` / `Codex`, `OPSis` / `Hermes`, `OpenClaw`, `OpenCode`) assign X work to the official `Grok` lane rather than calling X directly.

**Why:** Official X Developer API is pay-per-use and strictly rate-limited. Grok's native X tools (`x_search` / keyword / semantic / user / thread) are the first-party path via `grok.com` account-auth.

Posts count against the **X account** if published. Draft all candidates to `ops/marketing-inbox/` first; Founder Joshua Coleman approves before Grok posts.

---

## Goal

Commercial growth and paid memberships/verification on `youandinotai.com` (and B2B hardware recovery on `onlinerecycle.net` / AI-built MMORPG updates on `dream-online.net`). X is a focused funnel, not a firehose.

## Copy (Business-Only Framing)

- **Allowed**: membership, human verification, `$1 Bot-Shield`, safety, support, uptime, platform access, Square primary + PayPal checkout (`docs/PAYMENTS-TRUTH.md`).
- **Disallowed**: any non-commercial or unapproved payment phrasing, or unverified product claims not present on the live site.

## Cadence (Grok-Native, Rate-Aware)

| Lane | Who | Tool | Volume |
| --- | --- | --- | --- |
| Research / listen | X Marketing (`Grok`) | `grok.com` `x_keyword_search`, `x_semantic_search`, `x_thread_fetch`, `x_user_search` | High-signal discovery without X API quotas |
| Draft | X Marketing (`Grok`) | `ops/marketing-inbox/` JSON drop | Daily only when preflight checks are green |
| Publish | X Marketing (`Grok`) after Founder approval | `grok.com` native post (never `POST /2/tweets`) | Sparse: quality threads only |
| Verify | Grok Judge when X artifact check is needed | `grok.com` native read-only tools | Read-only unless directed otherwise |

Never use `twitter-cli`, `OpenCLI` twitter scrapers, `agent-reach` writes, browser posting from non-Grok lanes, or OmniRoute for X access.

## Content That Converts

- Niche first: target clear human-verified dating audiences rather than generic blasts.
- X format: short hook -> concrete product proof (verification, safety, uptime) -> CTA to `youandinotai.com`.
- Keep `youandinotai.com` (18+ adult-verified dating) strictly walled from `onlinerecycle.net` and `dream-online.net`.
- Track conversions through live Square / PayPal checkout telemetry (`docs/PAYMENTS-TRUTH.md`), never vanity likes.

## Marketing Gate

No draft or publish run until T5500 health (`http://192.168.0.15:3200`, `:8000/health`, `:3130` Mission OS, tunnel + DNS) is `UP` and verified for the current session.

## Evidence Standard

Every X claim must report `VERIFIED`, `UNVERIFIED`, or `BLOCKED` with an evidence handle (post ID, search query, inbox path). Never fabricate engagement metrics.
