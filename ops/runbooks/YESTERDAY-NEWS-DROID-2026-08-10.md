# Yesterday's News Today — Droid Automation Runbook

Date: 2026-08-10
Owner: Joshua (founder) / news-droid-producer agent (`.claude/agents/marketing/news-droid-producer.md`)

This pipeline is the live implementation of the Claude Droid SKU
(`ops/sales/campaigns/ai-solutions-store.md`): daily news brief → script →
metadata → upload.

## Pipeline

```
GitHub Actions (daily 11:00 UTC ≈ 06:00 ET)
  .github/workflows/yesterday-news-daily.yml
  └─ runs scripts/dashboard-aidoesitall/yesterday-news-today.py --mode generate
       ├─ NewsAPI (if NEWSAPI_KEY secret set) else keyless RSS fallback
       ├─ optional cloud-LLM script via OmniRouter (OMNI_* secrets)
       └─ commits content/yesterday-news/YYYYMMDD/{script.txt, metadata.json}
            + uploads same as a workflow artifact (14-day retention)

9020 node (local mirror, Windows Task Scheduler "YesterdayNewsToday", daily 06:00)
  scripts/dashboard-aidoesitall/setup-yesterday-news-scheduler.ps1  (register once)
  scripts/dashboard-aidoesitall/start-yesterday-news.bat            (manual run)
  └─ same generator, writes %USERPROFILE%\Documents\ANTIGRAVITY-RUNTIME\yesterday-news\
```

The cloud path runs even when every node is off. The two paths are independent;
either one producing a brief is a green day.

## How a node picks up and publishes

1. `git pull` on the node → newest `content/yesterday-news/YYYYMMDD/`.
2. Review: run the `news-droid-producer` agent (or read `script.txt` yourself).
   `metadata.json` `generator` field says how the script was made:
   `omni` (cloud model) or `template` (deterministic fallback).
3. Render: TTS + visuals from `script.txt` (renderer of choice; not yet automated).
4. Publish: `python yesterday-news-today.py --mode publish` posts the script to
   the YouTube community tab via `social_engine`. Full video upload is manual
   until a renderer is wired.

## Credentials (names only — values live in the vault / local env, never in git)

| Name | Needed for | Notes |
|---|---|---|
| `NEWSAPI_KEY` | Better headlines via NewsAPI | Optional. Without it the RSS fallback runs keyless. Repo secret for cloud; `.env` on node. |
| `OMNI_BASE_URL` | Cloud-model script generation | Optional. OmniRouter-compatible endpoint. On-LAN default is `http://127.0.0.1:11436`; the Actions runner can only use it once a routed/public endpoint exists. Unset ⇒ template script. |
| `OMNI_API_KEY` | Auth to the above | Optional; sent as Bearer only if set. |
| `OMNI_MODEL` | Model override | Optional; defaults to `auto` (router picks the tier). |
| YouTube login | `--mode publish` | Not an API key: a persistent logged-in Playwright browser profile on the publishing node. Log in once with `python scripts/daemon-login.py`. |

## Mission Control ROUTINES entry (paste onto the board)

Per `.agents/skills/mission-control/SKILL.md` column semantics:

```
ROUTINES
- name: yesterday-news-daily-brief
  cron: 0 11 * * *   (UTC; GitHub Actions)
  owner: news-droid-producer
  check: content/yesterday-news/ contains today's YYYYMMDD dir with script.txt
  on-miss: open the yesterday-news-daily.yml run in Actions; then check feeds;
           then check 9020 scheduled task "YesterdayNewsToday"
```

## Troubleshooting

- **No brief today (cloud):** open the latest "Yesterday's News Daily Brief"
  run in GitHub Actions. "No brief generated" in the collect step means the
  feeds had no articles dated yesterday — check `NEWS_MODE` (workflow uses
  `both`) and feed health in the run log.
- **No brief today (9020):** `Get-ScheduledTask YesterdayNewsToday` → check
  `%USERPROFILE%\Documents\ANTIGRAVITY-RUNTIME\logs\yesterday-news-today.log`.
- **`generator: template` every day despite OMNI secrets:** endpoint
  unreachable from the runner — the bot logs `OmniRouter script generation
  failed` and falls back by design. Expose a routed endpoint or accept
  template mode in cloud.
- **Dead feed:** the bot logs `RSS fetch failed for <source>`. Feed list lives
  in `FEED_SETS` in `yesterday-news-today.py`.

## Follow-up: Square account-bound checkout (Path B) — documented, not fixed here

The hosted Square payment links on youandinotai.com are live (Path A). The
account-bound checkout API path is fully coded in
`backend/fastapi-app` (ANTIGRAVITY-v2) but dead in production because:

1. Square credentials are unconfigured — `SQUARE_ACCESS_TOKEN` and
   `SQUARE_LOCATION_ID` empty, so `create_square_payment_link()` returns None
   and `POST /billing/checkout-link` answers 503.
2. Webhook signature config is unconfigured — the payment/booking webhook
   signature keys and notification URLs must be set AND registered in the
   Square dashboard (URL is part of the HMAC payload; any mismatch fails
   every signature).
3. No frontend caller — `Membership.tsx` uses the static links only; nothing
   calls `/billing/checkout-link`, so purchases are not account-bound and the
   reconciliation loop never closes.

Action for Joshua (on T5500, values from the vault, never committed): populate
the Square env names above, register the webhook URLs in the Square dashboard,
then wire the frontend to `POST /billing/checkout-link`. Until then, Path A
keeps selling.
