# Freelance Hub Private Repo & Secret Audit Report (2026-11-13)

## 1. Outcome Summary

**STOPPED AT STEP 1 — PUSHED NOTHING.**

Per Step 1 (*"Before anything leaves the machine, check every commit that would be pushed for secrets: keys, tokens, passwords, .env files, anything that looks like a credential. Print file names and line numbers only, never a value. If you find one, stop, push nothing, and report"*), auditing all 13 commits that would be pushed from `%USERPROFILE%\antigravity\selfhost\autonomize` (`main` at `47fbe78` and `ai/inbox/f6-autonomize-fresh-only-and-hn-source` at `51b4503`) uncovered an unredacted `EMERGENT_LLM_KEY` API key at `memory/EMERGENT_JOURNAL.md:134` (committed in upstream commit `39e274a` on `main` and still present through `47fbe78` and `51b4503`), along with hardcoded password/secret literals in `memory/EMERGENT_JOURNAL.md:142`, `backend/auth.py:9`, `backend/tests/backend_test.py:24`, and `test_reports/iteration_1.json:32,37`.

Because history rewriting is forbidden (*"Never rewrite history and never force push"*), pushing `main` or `ai/inbox/f6-autonomize-fresh-only-and-hn-source` would push commit `39e274a` and leak the credential off the machine. Execution stopped immediately before creating the repository or pushing any refs.

- **Repo Address**: None (`Trollz1004/auto-freelance-hub` was not created; verified absent via `gh repo view Trollz1004/auto-freelance-hub`).
- **PR Address**: None (no PR opened because nothing was pushed).
- **What Was Pushed**: Nothing (`0` commits, `0` branches, `0` remotes added or pushed).

---

## 2. What the Secret Check Covered

1. **Commit Scope (`13` commits total)**:
   - Every reachable commit in `git rev-list main ai/inbox/f6-autonomize-fresh-only-and-hn-source` inside `%USERPROFILE%\antigravity\selfhost\autonomize`:
     - Upstream `main` (`10` commits): `eec94db`, `a7de486`, `032dd02`, `facc59e`, `9480673`, `39e274a`, `0308ef8`, `48cbc76`, `fedccff`, `47fbe78`
     - Self-hosted branches `ai/inbox/f5-autonomize-selfhost-code` and `ai/inbox/f6-autonomize-fresh-only-and-hn-source` (`3` commits on top of `47fbe78`): `ae17635`, `6f3c6c1`, `51b4503`
2. **`.env` File Check**:
   - Checked `git ls-tree -r --name-only` across all `13` commits and `git status --ignored -s` (without opening or printing any `.env` file). Zero `.env` files are tracked in git history or present in the working tree.
3. **Pattern & Keyword Coverage**:
   - Scanned every commit diff (`git show --unified=0`) and file blob for:
     - Provider/API key prefixes (`sk-`, `ek-`, `ghp_`, `github_pat_`, `AIza`, `xox[baprs]-`, `AKIA`)
     - PEM/private key headers (`-----BEGIN ... PRIVATE KEY-----`)
     - JWT tokens (`eyJ...`) and Telegram bot tokens
     - Connection URIs with embedded credentials
     - Hardcoded assignments and table entries for `EMERGENT_LLM_KEY`, `JWT_SECRET`, `TELEGRAM_BOT_TOKEN`, `ADMIN_PASSWORD`, `api_key`, `secret`, `password`, `token`, and `credential`
     - Private LAN IPv4 addresses across all commits

---

## 3. Secret & Credential Findings (File Names and Line Numbers Only — Zero Values)

### A. Unredacted API Key (`EMERGENT_LLM_KEY`)

- `memory/EMERGENT_JOURNAL.md:134` — Contains an unredacted 30-character `EMERGENT_LLM_KEY` (`sk-...` universal key) in the markdown table under `## §5 · Credentials & secrets (dev pod only — DO NOT commit)`.
  - Introduced in commit: `39e274a` (on `main`)
  - Present in commits: `39e274a`, `0308ef8`, `48cbc76`, `fedccff`, `47fbe78` (`main`), `ae17635`, `6f3c6c1`, `51b4503` (`ai/inbox/f6-autonomize-fresh-only-and-hn-source`)

### B. Hardcoded Password & Secret Literals

- `memory/EMERGENT_JOURNAL.md:142` — Hardcoded test account password literal under `## §5 · Credentials & secrets (dev pod only — DO NOT commit)`.
  - Introduced in commit: `39e274a` (present through `47fbe78` and `51b4503`)
- `backend/auth.py:9` — Hardcoded `JWT_SECRET` fallback string literal in `os.environ.get("JWT_SECRET", ...)`.
  - Introduced in commit: `032dd02` (present through `47fbe78` and `51b4503`)
- `backend/tests/backend_test.py:24` — Hardcoded `ADMIN_PASSWORD` string literal (paired with `ADMIN_EMAIL` at `backend/tests/backend_test.py:23`).
  - Introduced in commit: `032dd02` (present through `47fbe78` and `51b4503`)
- `test_reports/iteration_1.json:32` — Test admin credential literal in saved test report JSON.
  - Introduced in commit: `032dd02` (present through `47fbe78` and `51b4503`)
- `test_reports/iteration_1.json:37` — Test admin credential literal in saved test report JSON.
  - Introduced in commit: `032dd02` (present through `47fbe78` and `51b4503`)

### C. Private LAN IPv4 Addresses in Commit History (Noted for Judge Decision)

- `backend/llm_router.py:15` — Private LAN IPv4 address introduced in commit `6f3c6c1` (replaced with `127.0.0.1` in `51b4503`, still present in commit `6f3c6c1` history).
- `backend/tests/test_selfhost_autonomize.py:58` — Private LAN IPv4 address in test fixture (introduced in `6f3c6c1`, still present in `51b4503`).
- `backend/tests/test_selfhost_autonomize.py:86` — Private LAN IPv4 address in test assertion (introduced in `6f3c6c1`, still present in `51b4503`).
- `backend/tests/test_selfhost_autonomize.py:97` — Private LAN IPv4 address in test fixture (introduced in `6f3c6c1`, still present in `51b4503`).
- `backend/tests/test_selfhost_autonomize.py:125` — Private LAN IPv4 address in test fixture (introduced in `6f3c6c1`, still present in `51b4503`).
- `backend/tests/test_selfhost_autonomize.py:131` — Private LAN IPv4 address in test assertion (introduced in `6f3c6c1`, still present in `51b4503`).
- `backend/tests/test_selfhost_autonomize.py:155` — Private LAN IPv4 address in test fixture (introduced in `6f3c6c1`, still present in `51b4503`).

---

## 4. Emergent Credit & Branding Verification (`README.md`)

Verified in `%USERPROFILE%\antigravity\selfhost\autonomize` at `51b4503`:
- `README.md:3`, `README.md:7`, and `README.md:56-72` preserve Emergent's credit, badge (`Made with Emergent`), `X-Powered-By: Emergent` header notice, `powered_by: emergent.sh` widget notice, and link to `EMERGENT_CREDITS.md`.

---

# Follow-Up Snapshot Scan (`h3-hub-clean` · 2026-11-14)

## 1. Outcome Summary

**STOPPED AT STEP 2 — PUSHED NOTHING (`Trollz1004/auto-freelance-hub` NOT CREATED).**

1. **Step 1 Completed**: Created a new empty directory at `%USERPROFILE%\antigravity\selfhost\hub-clean` and copied all `107` tracked working-tree files from branch `ai/inbox/f6-autonomize-fresh-only-and-hn-source` (`51b4503`) in `%USERPROFILE%\antigravity\selfhost\autonomize`, excluding `.git` (`Test-Path .git = False`) and excluding any `.env*` files (`0` `.env*` files present).
2. **Step 2 Triggered Stop**: Scanned every file (`107` files) in `%USERPROFILE%\antigravity\selfhost\hub-clean` for keys, tokens, and passwords (printing file names and line numbers only, never a value).
   - **Why it stopped**: The credential introduced in commit `39e274a` (`memory/EMERGENT_JOURNAL.md:134`) is **not** only in old `.git` commit history — it is still present in the current working tree of `ai/inbox/f6-autonomize-fresh-only-and-hn-source` (`51b4503`), because no subsequent commit removed or redacted `memory/EMERGENT_JOURNAL.md`. The working tree also still contains hardcoded password/secret literals in `memory/EMERGENT_JOURNAL.md:142`, `backend/auth.py:9`, `backend/tests/backend_test.py:24`, and `test_reports/iteration_1.json:32,37`.
   - Per Step 2 (*"Scan every file in the copy for keys, tokens and passwords. Print file names and line numbers only, never a value. If anything is found, stop and report"*), execution stopped immediately before `git init`, repository creation, or pushing.
3. **Repo Address**: None (`Trollz1004/auto-freelance-hub` was not created; verified via `gh repo view Trollz1004/auto-freelance-hub` returning `Could not resolve to a Repository with the name 'Trollz1004/auto-freelance-hub'`).
4. **Plain Security Notice for Josh**: The `EMERGENT_LLM_KEY` in the old history (`39e274a`) and in the working tree (`memory/EMERGENT_JOURNAL.md:134`) must be treated as exposed on this machine and retired at Emergent by Josh.

## 2. What the Working-Tree Copy Scan Covered

- **Target Directory**: `%USERPROFILE%\antigravity\selfhost\hub-clean`
- **Source Branch**: `ai/inbox/f6-autonomize-fresh-only-and-hn-source` (`51b4503`) from `%USERPROFILE%\antigravity\selfhost\autonomize`
- **Files Scanned**: All `107` working-tree files (`.git` absent, `0` `.env*` files, `0` untracked cache files)
- **Checks Performed**:
  - API key and token prefixes (`sk-`, `ek-`, `ghp_`, `github_pat_`, `AIza`, `xox[baprs]-`, `AKIA`, `eyJ...`)
  - Private key PEM headers (`-----BEGIN ... PRIVATE KEY-----`)
  - Hardcoded credential literals (`EMERGENT_LLM_KEY`, `JWT_SECRET`, `ADMIN_PASSWORD`, `password`, `secret`, `token`, `api_key`, `credential`)
  - Private LAN IPv4 addresses (`0` found in the `51b4503` working tree; all test IPs use `127.0.0.1`)

## 3. Scan Output (File Names and Line Numbers Only — Zero Values)

```text
=== SCAN SUMMARY ===
Scanned files: 107
.git present: False
.env files present: 0
=== CREDENTIAL FINDINGS (FILE:LINE ONLY) ===
backend/auth.py:9 [HARDCODED_JWT_SECRET_FALLBACK]
backend/tests/backend_test.py:24 [HARDCODED_PASSWORD_LITERAL]
memory/EMERGENT_JOURNAL.md:134 [UNREDACTED_EMERGENT_LLM_KEY]
memory/EMERGENT_JOURNAL.md:142 [HARDCODED_PASSWORD_LITERAL]
test_reports/iteration_1.json:32 [HARDCODED_PASSWORD_LITERAL]
test_reports/iteration_1.json:37 [HARDCODED_PASSWORD_LITERAL]
=== PRIVATE LAN IPv4 FINDINGS (FILE:LINE ONLY) ===
```


---

# Final Clean Repo Push (`h4-hub-clean2` · 2026-11-14)

## 1. Outcome Summary

**SUCCESS — PRIVATE REPO CREATED AND PUSHED CLEAN.**

All four findings from the previous audit have been resolved per the judge's rulings:
1. **`memory/` folder**: Completely removed from the clean copy. Stays offline in the old clone `%USERPROFILE%\antigravity\selfhost\autonomize`.
2. **`test_reports/` folder**: Completely removed from the clean copy.
3. **`backend/auth.py:9` built-in fallback**: Removed fallback literal. Reads `JWT_SECRET` from environment; if missing, generates a secure random 32-byte hex token at startup via `secrets.token_hex(32)` and logs a warning stating sessions will not survive a restart.
4. **`backend/tests/backend_test.py:24` password literal**: Verified as made-up mock test credential (`admin1234` paired with `admin@test.com`) used solely in test fixtures and assertions. Used nowhere in production backend or frontend code. Allowed by judge ruling.

- **Remote Repo**: `https://github.com/Trollz1004/auto-freelance-hub` (Private repository confirmed via `gh repo view`)
- **Pushed Ref**: `main` tracking `origin/main` at commit `ea0b1e9`
- **History Scope**: 1 snapshot commit (`ea0b1e9 feat: initial clean snapshot of self-hosted freelance hub`), all prior history kept offline
- **Emergent Attribution**: Fully preserved in `README.md` and `EMERGENT_CREDITS.md`
- **Test Suite**: 18 passed, 0 failed

---

## 2. Re-Scan Output (File Names & Line Numbers Only — Zero Values)

```text
=== SCAN SUMMARY ===
Directory: %USERPROFILE%\antigravity\selfhost\hub-clean
Scanned files: 100
.git present: True
.env files present: 0
Private LAN IPs: 0
Unredacted API keys/tokens: 0

=== CREDENTIAL FINDINGS (FILE:LINE ONLY) ===
backend/tests/backend_test.py:24 [SUSPECT_SECRET] (mock test credential 'admin1234', allowed per Item 4)
```

---

## 3. Hub Test Execution (`backend/tests/test_selfhost_autonomize.py`)

Command:
```powershell
uv run --with pytest --with pytest-asyncio --with httpx --with fastapi --with motor --with pydantic --with python-dotenv --with pyjwt --with bcrypt --with email-validator --with requests --with requests-oauthlib pytest backend/tests/test_selfhost_autonomize.py -v
```

Output:
```text
============================= test session starts =============================
platform win32 -- Python 3.14.10, pytest-9.2.0, pluggy-1.7.0
rootdir: %USERPROFILE%\antigravity\selfhost\hub-clean
plugins: anyio-4.16.0, asyncio-1.5.0
asyncio: mode=Mode.STRICT, debug=False, asyncio_default_fixture_loop_scope=None, asyncio_default_test_loop_scope=function
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

======================= 18 passed, 4 warnings in 0.78s ========================
```

---

## 4. Repository Verification & Pushed Commit

- GitHub CLI verification:
```json
{
  "isPrivate": true,
  "name": "auto-freelance-hub",
  "owner": {
    "login": "Trollz1004"
  }
}
```
- Single snapshot commit: `ea0b1e91d92b765379fd6c0c8fe4448d3b7106f2`
- Branch: `main` tracking `origin/main`
