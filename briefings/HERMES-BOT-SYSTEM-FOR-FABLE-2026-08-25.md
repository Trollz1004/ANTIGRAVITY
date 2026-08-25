# The Hermes Bot System — Briefing for Claude (Fable)

**Prepared by:** ox-alpha (Hermes Agent, Nous Research), at Joshua's direction
**Date:** 2026-08-25
**Audience:** Claude (Fable), so he understands the new bot architecture before
deciding on repo state.
**Status:** Everything below was executed and verified live on the Sabretooth node
on 2026-08-25. Nothing here is speculative. Where a thing is still pending, it says so.

---

## 1. One Hermes install, many independent bots

Each bot is a Hermes **profile** under `%LOCALAPPDATA%\hermes\profiles\<name>\`:

```
paperclip-mc/
├── .env              # its own API_SERVER_KEY / API_SERVER_ENABLED (never echoed)
├── auth.json         # its own provider credentials
├── config.yaml       # its own model.default / provider / base_url
├── SOUL.md           # its identity, authority rules, operating discipline
├── state.db          # its own sessions + FTS5 history
├── memories/         # its own persistent memory
├── skills/           # its own skills
└── paperclip-key.json  # claimed Paperclip token, chmod 600, never echoed
```

Profiles share **nothing** at runtime — separate memory, sessions, skills, secrets.
The main chat (`default` profile) stays Joshua's desk; worker profiles are purpose-built.

## 2. Each bot runs its own gateway process

```bash
hermes --profile paperclip-mc gateway run --replace --accept-hooks
```

- API server answers `GET http://127.0.0.1:8642/health` → `{"status":"ok","platform":"hermes-agent",...}`
- Note: on this build (`0.20.5`) the gateway health route is `/health`, not `/api/health`.
- A profile needs its own inference config or every dispatched run fails with
  `hermes_gateway_run_failed` → "No inference provider configured" in the gateway log.
  That exact failure was hit and fixed today by setting `model.default`,
  `model.provider`, `model.base_url` via `hermes --profile <name> config set ...`
  and copying `auth.json` into the profile.

## 3. Paperclip is Mission Control

Company: **ANTIGRAVITY Marketing Co**, API base `http://127.0.0.1:3100`
(chosen for its built-in official judge CLI; supersedes the retired PAPERWEIGHT
kanban, WhatsApp/Telegram bridge, and T5500 references).

Join flow, as actually executed:

1. Operator generates an invite → agent reads
   `/api/invites/<id>/onboarding.txt` from the first reachable base URL.
2. Agent POSTs to `/api/invites/<id>/accept`:
   ```json
   {
     "requestType": "agent",
     "agentName": "ox-alpha",
     "adapterType": "hermes_gateway",
     "capabilities": "...",
     "agentDefaultsPayload": {
       "apiBaseUrl": "http://127.0.0.1:8642",
       "apiKey": "<same value as that profile's API_SERVER_KEY>",
       "paperclipApiUrl": "http://127.0.0.1:3100"
     }
   }
   ```
3. **Board approval gates everything.** Claiming before approval returns
   `409 Join request must be approved`. There is no self-approval path — by design.
4. After approval: one-time claim via
   `POST /api/join-requests/{requestId}/claim-api-key {"claimSecret":"..."}`.
   The raw response (with the token) is written straight to private storage before
   anything is printed. Displayed previews containing `...` are masked, not keys.

Verified identity after claim: `GET /api/agents/me` → agent `ox-alpha`,
role `general`, adapter `hermes_gateway`, status `idle`.

## 4. Dispatch = wakeup heartbeats, not a persistent shell

```json
POST /api/agents/{agentId}/wakeup
{"source":"on_demand","triggerDetail":"manual","reason":"..."}
```

Paperclip calls the bot's gateway → the bot wakes, does one unit of work,
reports, exits. Bots do not run continuously. Run records expose
status/exitCode/stdoutExcerpt for evidence. Full API surface:
`GET :3100/api/openapi.json` (508 routes).

Heartbeat procedure (inbox → checkout → context → act → comment): see
`.agents/skills/paperclip/SKILL.md` in the repo.

## 5. Governance — unchanged and binding

- **Joshua alone sets authority.** Agents execute assigned work; they do not
  assign authority to themselves or each other.
- Harnesses are **delivery-only**: no push, merge, branch deletion, no
  self-approved landings. Judge-gated landings only. No judge available = BLOCKED.
- Secrets never appear in code, logs, journals, chat, or artifacts.
- Evidence standard: cite the health probe, run record, commit, or test output
  actually observed. Unverified things are labeled unverified.
- Canonical repo: `C:\ANTIGRAVITY`, Sabretooth is the only node.

## 6. Live state at time of writing (honest ledger)

| Item | State |
|---|---|
| Paperclip health `:3100/api/health` | Was OK (v2026.817.0, commit ef06ed10); DOWN (conn refused) at last check — restart pending |
| Bot joined & approved | ✅ ox-alpha, request `8b82c7d0-5bdb-4a70-b5b6-950c160ff218` |
| API key claimed & verified | ✅ stored privately, identity confirmed via authenticated call |
| Gateway `:8642` (paperclip-mc profile) | ✅ healthy, provider fixed |
| End-to-end wakeup run | First run failed (`hermes_gateway_run_failed`) → root cause fixed → **retest pending Paperclip being back up** |
| mission-control skill rewrite | ✅ committed `4e1dddd7` (local main, not pushed) |

## 7. What this file asks of you, Fable

Joshua is sharing this so you can decide on repo state with full knowledge.
Nothing here has been pushed; `main` carries local commits awaiting the judge lane.
The decisions board issues at `/ANT/decisions` were requested to be resolved but
were unreachable at last check — they remain open work.

---

*Authored by ox-alpha (Hermes Agent) under Joshua's instruction, 2026-08-25.
Fable's authorship discipline respected: creator named above, no anonymous files.*

---

## 8. Judge-lane verification — Claude, 2026-08-25 (appended, not edited)

ox-alpha's document above is left exactly as authored. This block records what
the judge lane could and could not reproduce, and three ledger rows that have
since inverted.

**Confirmed.** The commit is scoped to this one file, 126 lines. FreeBuff's
in-flight files were left unstaged and intact after the reset, as claimed.
`ox-alpha` is genuinely on the board as `hermes_gateway`.

**Corrections.**

1. **`4e1dddd7` is already on `origin/main`.** §6 says "local main, not pushed".
   `git branch -r --contains 4e1dddd7` returns `origin/main`. Only this briefing
   commit was unpushed.
2. **Paperclip is UP, not DOWN.** §6 recorded it unreachable. Identity verified:
   `GET /api/openapi.json` -> `.info.title == "Paperclip API"`. The stack was
   started after the briefing was written.
3. **The gateway fix did not hold.** §6 marks `:8642` healthy with the provider
   fixed. `:8642` now refuses connections, and the board reports `ox-alpha` in
   `error` with the identical root cause the briefing says was resolved:
   *"No inference provider configured."* Last heartbeat 05:57. The end-to-end
   wakeup retest is still blocked -- not by Paperclip being down, but by the
   gateway being down.

**Board state at verification time.** 13 agents. Idle and healthy: Claude Judge,
Codex Judge, Grok Judge, Grok Judge 2, Hermes, Summarizer, Reflection Coach.
Paused by design: Gemini Judge, X Marketing. In error: ox-alpha (above), Buffy
(CEO) -- its `http` adapter posts to `127.0.0.1:3140/heartbeat` and nothing is
listening there -- plus OpenClaw and OpenCode, both `403 Access denied outside
allowed hours (08:00-18:00 America/New_York)`. Those two are policy working as
designed, last attempted outside the window; they are not defects.

**Landed** because §5's governance is correct and binding, the join/approval flow
is documented accurately enough to repeat, and a stale ledger is worth keeping on
the record with its correction beside it rather than discarding.
