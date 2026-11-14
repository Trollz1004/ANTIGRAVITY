# Autonomize Self-Host Report (2026-11-13)

## 1. Why Push and PR Creation Were Refused on Target Repository

Cloning `https://github.com/Ai-Solutions-Store/EMERGENT-if-self-hosted-EMERGENT-GETS-CREDIT-AND-FREEM-BRANDING-MANDATORY-` into `%USERPROFILE%\antigravity\selfhost\autonomize` succeeded, and branches `ai/inbox/f5-autonomize-selfhost-code` and `ai/inbox/f6-autonomize-fresh-only-and-hn-source` (based on `ai/inbox/f5-autonomize-selfhost-code`) were created and committed locally.

When pushing to `origin` or opening a pull request in that repository, GitHub refused both `git push` and `gh pr create` because **the target repository was archived on `2026-08-26T23:26:24Z` and is read-only**.

### Exact Command Output (`git push` and `gh pr create`)

```text
remote: This repository was archived so it is read-only.
fatal: unable to access 'https://github.com/Ai-Solutions-Store/EMERGENT-if-self-hosted-EMERGENT-GETS-CREDIT-AND-FREEM-BRANDING-MANDATORY-/': The requested URL returned error: 403
pull request create failed: GraphQL: Repository was archived so is read-only (createPullRequest)
```

### Repository Metadata (`gh repo view`)

```json
{"archivedAt":"2026-08-26T23:26:24Z","isArchived":true,"isPrivate":true,"url":"https://github.com/Ai-Solutions-Store/EMERGENT-if-self-hosted-EMERGENT-GETS-CREDIT-AND-FREEM-BRANDING-MANDATORY-","viewerPermission":"ADMIN"}
```

---

## 2. Reddit Data API Terms Assessment (Read-Only OAuth Use)

- **Official Policy Link**: [Reddit Data API Terms](https://redditinc.com/policies/data-api-terms) (and [Reddit Developer Terms](https://redditinc.com/policies/developer-terms))
- **Verbatim Quotes from Reddit Data API Terms**:
  - **Section 2.1 (License)**:
    > *"Reddit grants you, subject to your complete and ongoing compliance with the Data API Terms, a non-exclusive, non-transferable, non-sublicensable, and revocable license solely to access and use the Data APIs as expressly permitted under and in accordance with the Data API Terms."*
  - **Section 2.4 (User Content)**:
    > *"The Content created with or submitted to our Services by Users (“User Content”) is owned by Users and not by Reddit. Subject to your complete and ongoing compliance with the Data API Terms, Reddit grants you a non-exclusive, non-transferable, non-sublicensable, and revocable license to copy and display the User Content using the Data API solely as necessary to develop, deploy, and operate your App in accordance with the Data API Terms. Except as expressly permitted by this section, no other rights or licenses are granted or implied, including any right to use User Content for other purposes, such as for training a machine learning or AI model, without the express permission of rightsholders in the applicable User Content."*
- **Plain Statement on Whether Reddit's Terms Allow This Use**:
  1. **Unauthenticated `.json` scraping (`reddit.com/r/NAME/new.json` without OAuth)** is **not allowed**; Reddit requires OAuth authentication and a descriptive `User-Agent` under the Data API Terms.
  2. **Authenticated OAuth read-only access (`https://oauth.reddit.com/r/NAME/new` with `REDDIT_CLIENT_ID` and `REDDIT_CLIENT_SECRET`)**:
     - For **personal, non-commercial viewing** of public subreddit posts at polite rates (`<= 60` requests/minute) without AI/ML model training, OAuth read-only access is permitted.
     - However, **Reddit's standard (free-tier) Data API Terms DO NOT ALLOW commercial use** (such as running a commercial freelance lead-generation / automated client-acquisition business or feeding Reddit User Content into commercial AI/LLM pipelines or vector databases) **without a separate written commercial agreement / licensing deal with Reddit**. Plainly: **using the free Data API tier for commercial lead generation is not allowed under Reddit's standard Data API Terms.**

---

## 3. Fresh-Only Opportunities, Permanent URL Deduplication, Hacker News Scanner & Daily Digest (`ai/inbox/f6-autonomize-fresh-only-and-hn-source`)

Built on top of `ai/inbox/f5-autonomize-selfhost-code` in `%USERPROFILE%\antigravity\selfhost\autonomize` (commit `51b4503`):

1. **72-Hour Freshness Rule & Post Age Display (`backend/models.py`, `backend/server.py`, `backend/telegram_bot.py`, `frontend/src/`)**:
   - Every opportunity stores the source's own posted time (`posted_at`) and the first time the hub saw it (`first_seen_at`), plus a human-readable `age` field (`format_post_age`).
   - Anything whose `posted_at` is unknown (`None` / invalid) or older than `72` hours (`is_fresh_posted_at` / `is_fresh_opportunity`) is never shown as `new`, never counted in analytics or scan totals (`compute_analytics_summary`, `/api/widget/summary`, `/api/scan`, `/api/scan/quick`, Telegram `/stats`), and never notified via Telegram (`notify_new_opportunity`).
   - Full-time job adverts (`is_fulltime_job_advert`) and plain search/feed index URLs (`is_search_page_url`) are rejected at scan/ingest time.
   - Post age (`data-testid="post-age"`) is displayed on every row in `Dashboard.jsx`, `Opportunities.jsx`, `OpportunityDetail.jsx`, and in every Telegram notification (`format_opportunity_notification` and `/opportunities`).
2. **Permanent Deduplication by Source URL (`backend/models.py`, `backend/server.py`, `backend/telegram_bot.py`)**:
   - Canonicalizes source URLs via `normalize_source_url` and records every seen URL in `seen_urls` as well as checking `opportunities` across all statuses (`new`, `approved`, `rejected`, `contacted`, `sold`, or deleted).
   - Once a `source_url` has been stored by the hub, it is never re-ingested and never notified again, whatever its status.
3. **Hacker News Official Firebase API Scanner (`backend/scanners.py`)**:
   - Added `scan_hackernews()` querying `https://hacker-news.firebaseio.com/v0/user/whoishiring.json` and `https://hacker-news.firebaseio.com/v0/item/<id>.json`.
   - Finds the current month's `Ask HN: Freelancer? Seeking freelancer?` story by `whoishiring` (`_is_current_month_freelancer_thread`) and reads only top-level comments (`thread_story["kids"]`, `parent == story_id`) whose text begins with `SEEKING FREELANCER`.
   - Stores each comment's own timestamp (`posted_at`) and item URL (`https://news.ycombinator.com/item?id=<id>`). Read-only (`GET` only) at a polite rate (`HN_RATE_DELAY_SECONDS`); never posts or votes.
4. **Daily Digest Function & Endpoint (`backend/server.py`, `frontend/src/lib/api.js`)**:
   - Added `build_daily_digest()` and `GET /api/digest/daily` (plus `/api/digest` and `/api/opportunities/digest/daily`).
   - Lists only real, non-sample, fresh (`posted_at <= 72h`) items whose `first_seen_at` is within the last 24 hours, each with its `age`, `source`, and `link`.
   - When no items qualify, returns `"No new freelance opportunities were first seen in the last 24 hours."` (`empty: True`, `count: 0`, `items: []`) and never pads with old items, job adverts, or market statistics.
5. **Unit Tests (`backend/tests/test_selfhost_autonomize.py`)**:
   - Added tests for the 72-hour freshness rule and age display, permanent `source_url` deduplication across all statuses, the Hacker News official Firebase API scanner, the empty daily digest (no padding), the 24-hour populated daily digest, and the `/api/digest/daily` HTTP endpoint + Emergent attribution header lock (`18 passed`).
6. **`EMERGENT_CREDITS.md` & `.env` Hygiene**:
   - Every Emergent credit required by `EMERGENT_CREDITS.md` remains 100% intact. No `.env` file was created, opened, or printed.

### Local Test Output (`pytest backend/tests/test_selfhost_autonomize.py -v`)

```text
============================= test session starts =============================
platform win32 -- Python 3.14.10, pytest-9.2.0, pluggy-1.7.0 -- %LOCALAPPDATA%\uv\cache\builds-v0\.tmpv85f95\Scripts\python.exe
cachedir: .pytest_cache
rootdir: %USERPROFILE%\antigravity\selfhost\autonomize
plugins: anyio-4.16.0
collecting ... collected 18 items

backend/tests/test_selfhost_autonomize.py::test_tier_order_without_emergent_key PASSED [  5%]
backend/tests/test_selfhost_autonomize.py::test_tier_order_with_emergent_key PASSED [ 11%]
backend/tests/test_selfhost_autonomize.py::test_omniroute_openai_chat_completions_mocked PASSED [ 16%]
backend/tests/test_selfhost_autonomize.py::test_simple_tier_tries_ollama_then_omniroute PASSED [ 22%]
backend/tests/test_selfhost_autonomize.py::test_mid_tier_tries_omniroute_then_ollama PASSED [ 27%]
backend/tests/test_selfhost_autonomize.py::test_fiverr_and_upwork_stubs_marked_as_samples PASSED [ 33%]
backend/tests/test_selfhost_autonomize.py::test_reddit_scanner_stays_off_when_creds_missing PASSED [ 38%]
backend/tests/test_selfhost_autonomize.py::test_reddit_scanner_uses_oauth_when_creds_set PASSED [ 44%]
backend/tests/test_selfhost_autonomize.py::test_samples_excluded_from_counts_and_revenue PASSED [ 50%]
backend/tests/test_selfhost_autonomize.py::test_empty_owner_facts_file_has_no_invented_facts PASSED [ 55%]
backend/tests/test_selfhost_autonomize.py::test_outreach_draft_with_empty_facts_contains_no_first_person_experience_claim PASSED [ 61%]
backend/tests/test_selfhost_autonomize.py::test_docker_compose_binds_ports_to_localhost PASSED [ 66%]
backend/tests/test_selfhost_autonomize.py::test_72_hour_rule_unknown_or_stale_not_new_not_counted_never_notified PASSED [ 72%]
backend/tests/test_selfhost_autonomize.py::test_duplicate_rule_url_never_notified_or_ingested_again_whatever_its_status PASSED [ 77%]
backend/tests/test_selfhost_autonomize.py::test_hackernews_scanner_reads_current_month_freelancer_thread_and_seeking_freelancer_comments PASSED [ 83%]
backend/tests/test_selfhost_autonomize.py::test_empty_daily_digest_says_so_plainly_and_never_pads PASSED [ 88%]
backend/tests/test_selfhost_autonomize.py::test_daily_digest_lists_last_24h_items_with_age_source_and_link PASSED [ 94%]
backend/tests/test_selfhost_autonomize.py::test_daily_digest_http_endpoint_and_emergent_credit_lock PASSED [100%]

======================= 18 passed, 4 warnings in 1.88s ========================
```
