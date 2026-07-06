# T5500 Verified Repo Status — 2026-07-06

**Purpose:** current verified handoff so Opus, Codex, Claude, Gemini, or other agents can pull/inspect `Trollz1004/ANTIGRAVITY` from Sabretooth or another node without repeating discovery or rebuilding existing systems.

**Verified by:** Hermes Agent on Telegram session with Josh, 2026-07-06.

**Primary instruction:** **Do not rebuild the date app. It already exists. Focus revenue, Square alignment, and safe repo coordination.**

---

## 1. Verified environment / node

Current Hermes session verified the active machine as:

```text
Host/node: DESKTOP-H4B53GL
User: joshl
Home: /c/Users/joshl / C:\Users\joshl
Shell: MSYS/Git Bash on Windows
Node.js: v26.1.0
```

Main repo inspected:

```text
C:/ANTIGRAVITY
```

Remote:

```text
https://github.com/Trollz1004/ANTIGRAVITY.git
```

---

## 2. Current repo state warning

The local `C:/ANTIGRAVITY` checkout is **highly divergent** and must not be mutated casually.

Verified state:

```text
branch: main
local HEAD: 5093b6e4 fix: label public command center as PAPERWEIGHT
origin/main: e8474a0e feat(dream): NPC provider router + AnythingLLM support fallback (#193)
divergence after fetch: local ahead 762, behind 911
```

Important:

- Do **not** blindly `git pull`, `git reset`, `git merge`, or push from this checkout.
- There are many local modified files.
- Use a separate worktree/branch for safe verification or changes.

Safe clean origin/main worktree created/verified:

```text
C:/Users/joshl/_worktrees/antigravity-origin-main-dateapp
```

---

## 3. Active YouAndINotAI source/deploy truth

Do **not** scaffold a new date app. Current verified paths:

```text
Frontend source: frontend/react-app
Static artifact: apps/youandinotai-static
Backend: backend/fastapi-app
Runbook: briefings/YOUANDINOTAI-DEPLOY-RUNBOOK.md
```

Current deploy runbook says:

```text
Frontend: Cloudflare Pages project youandinotai
Backend: T5500 self-host FastAPI stack
Public domain: youandinotai.com
API domain: api.youandinotai.com
Payment rail: Square production checkout
```

Public endpoints verified:

```text
https://youandinotai.com
https://api.youandinotai.com/api/v1/health
```

Public API health returned healthy DB/Redis/Square configuration:

```json
{
  "status": "ok",
  "db_connected": true,
  "redis_connected": true,
  "square_connected": true,
  "square_signature_configured": true,
  "wallet_rails_proven": false,
  "wallet_rails_status": "unproven",
  "payment_proof_labels": [],
  "user_count": 3
}
```

Interpretation:

- API is live and Square config is present.
- `wallet_rails_proven` remains false/unproven, so payment/webhook proof is not fully established.
- Do not claim live payment/webhook state is proven until sandbox or final controlled live test confirms it.

---

## 4. Date app verification results

Hermes verified Date app behavior from the clean origin/main worktree:

```text
C:/Users/joshl/_worktrees/antigravity-origin-main-dateapp
HEAD: a4933532 origin/main
```

Results:

| Area | Result |
|---|---|
| Frontend install | `npm ci` passed |
| Frontend lint/type/build command | `npm run lint && npm run build` passed |
| Backend targeted billing/auth tests | passed with `--no-cov` |
| `backend/fastapi-app/tests/test_billing.py` | `3 passed` |
| Public frontend | `200` |
| Public API health | `200` JSON |
| Mobile smoke | passed no-horizontal-overflow checks on anonymous tested routes |
| Protected app routes | correctly redirect unauthenticated users to login |

Mobile/headless routes checked included:

```text
/
/register
/support
/login
```

Protected route behavior checked included:

```text
/app/verify
/app/profile
/app/support
/app/checkout/founding_member
```

These correctly require authentication.

---

## 5. Three-day launch trial is real

The current origin/main baseline includes a 3-day launch trial.

Backend truth:

```py
LAUNCH_TRIAL_TIER = "launch_trial"
```

Registration path assigns new users:

```py
subscription_tier = "launch_trial"
subscription_active = True
subscription_expires_at = now + 3 days
```

Frontend copy verified around register/homepage includes:

```text
three-day launch trial
3-DAY LAUNCH TRIAL
START TRIAL
Bot-Shield
Founding Member
```

Do not invent a new trial system. Work from the existing one.

---

## 6. Runtime issue: stale upstream fallback

`frontend/react-app/server.ts` has a stale fallback upstream:

```text
https://dateapp-backend-io5tscl75a-ue.a.run.app
```

Runtime/deploy should explicitly set:

```env
UPSTREAM_API_BASE_URL=https://api.youandinotai.com
```

Do not rely on the fallback Cloud Run URL.

---

## 7. Square payment products / direct links

Square remains the only payment rail for YouAndINotAI.

Known product links verified in repo context:

```text
Bot-Shield $1:       https://square.link/u/Qc5mxUy7
Founding Member:     https://square.link/u/cxwjcn0s
3-Month Founder:     https://square.link/u/oY7qEfRM
12-Month Founder:    https://square.link/u/6GHpbvvl
Royalty Card:        https://square.link/u/CafhorUS
```

User/Josh context:

```text
Past Square receipts reportedly all go to joshlcoleman@gmail.com regardless of checkout-origin email.
Bot-Shield could not reuse the same email while prior test DB/payment state existed.
Gemini previously wiped/reset the DB to free Josh’s test emails.
```

Operational instruction:

- Do not ask Josh to keep burning new real payments.
- Confirm sandbox alignment first.
- Use one final controlled live payment only if sandbox/webhooks prove alignment and Josh explicitly approves.

---

## 8. Critical Square sandbox / webhook finding

Josh wants sandbox verification with Square test card before another live charge.

Square sandbox test card:

```text
Visa: 4111 1111 1111 1111
CVV: 111
expiration: future date
```

Current local/prod env is production-oriented:

```env
SQUARE_API_BASE_URL=https://connect.squareup.com
```

No local Square sandbox token/config was found.

Sandbox test requires:

```env
SQUARE_API_BASE_URL=https://connect.squareupsandbox.com
SQUARE_ACCESS_TOKEN=<sandbox token>
SQUARE_LOCATION_ID=<sandbox location id>
```

Do **not** use `4111111111111111` against production Square config.

---

## 9. Webhook mismatch found

Current `.env` was observed pointing Square webhook notification URLs at the frontend/public host:

```env
SQUARE_PAYMENT_WEBHOOK_NOTIFICATION_URL=https://youandinotai.com/api/v1/webhooks/square
SQUARE_WEBHOOK_NOTIFICATION_URL=https://youandinotai.com/api/v1/webhooks/square
```

Testing showed frontend host routes are not the correct backend webhook target:

```text
https://youandinotai.com/api/v1/webhooks/square         -> 503
https://youandinotai.com/api/v1/webhooks/square-payment -> 503
```

Backend API host is the correct target:

```text
https://api.youandinotai.com/api/v1/webhooks/square
https://api.youandinotai.com/api/v1/webhooks/square-payment
```

Recommended canonical route:

```text
https://api.youandinotai.com/api/v1/webhooks/square-payment
```

Backend env and Square Dashboard should align to:

```env
SQUARE_PAYMENT_WEBHOOK_NOTIFICATION_URL=https://api.youandinotai.com/api/v1/webhooks/square-payment
SQUARE_WEBHOOK_NOTIFICATION_URL=https://api.youandinotai.com/api/v1/webhooks/square-payment
```

Code truth:

```py
@router.post("/square")
@router.post("/square-payment")
async def square_payment_webhook(...):
```

Router is included under:

```text
/api/v1
```

So both final routes exist:

```text
POST /api/v1/webhooks/square
POST /api/v1/webhooks/square-payment
```

Tests use `/square-payment`, so standardize on `/square-payment`.

---

## 10. Payment funnel / revenue findings

Fastest revenue path is existing YouAndINotAI checkout, not new product building.

Current issue:

- Public funnel over-promotes free trial relative to first-dollar revenue.
- Paid CTAs are gated behind auth/register and dynamic checkout.
- If dynamic Square checkout fails, the user can be blocked even though direct Square links exist.

Recommended revenue-first order:

```text
1. Bot-Shield $1
2. Founding Member $14.99/mo
3. 3-day trial
4. 3-month / 12-month prepaid
5. Royalty Card
```

Recommended immediate frontend change:

- Add direct Square fallback buttons for paid products.
- Keep account-bound checkout when it works.
- If checkout fails, show a direct Square fallback.

Fallback copy concept:

```text
Pay with Square directly. Receipt is immediate; account activation may be manual if automatic sync is unavailable.
```

Royalty Card note:

- Avoid vague “terms provided privately” copy.
- Either publish clear buyer terms or hide the $2,500 card until ready.

---

## 11. Revenue paths already present

Do not build new products before selling what exists.

Ranked fastest revenue paths from agent swarm:

1. **YouAndINotAI membership / Bot-Shield / Founding Member**
   - `$1`, `$14.99/mo`, `$39.99/3mo`, `$99.99/yr`, `$2,500 lifetime`.
2. **AI Solutions Store**
   - productized B2B/automation offers already staged in repo.
3. **OnlineRecycle / e-waste intake**
   - local pickup/resale/secure wipe opportunity.
4. **B2B service offers from existing revenue model**
   - checkout cleanup, storefront deployment, agent workflow, tech-debt sprint.
5. **Business Exchange marketplace**
   - use as concierge marketplace later, not first blocker.
6. **Income-engine organic growth**
   - traffic engine, not a product by itself.

Revenue doctrine:

```text
Sell what already exists.
Fix payments/webhooks.
Add direct checkout fallbacks.
Do not spend on paid infra until platforms generate funds.
```

---

## 12. Node map — corrected by Josh

Important: Josh corrected Sabretooth’s role.

Current active node map:

| Node | Role |
|---|---|
| T5500 / DESKTOP-H4B53GL | Public ANTIGRAVITY revenue/front-door node: domains, Cloudflare tunnels, payments, Wrangler, date-app backend/routing |
| Sabretooth | Dream Online MMORPG work/dev node |
| 9020 | ANTIGRAVITY standby/runtime/support/income node |
| New Windows 11 i5 24–32GB | Main ANTIGRAVITY revenue worker: builds, tests, lead generation, fulfillment, reports, outreach prep |
| New Windows 11 i5 16GB | Sales/customer ops worker: dashboards, CRM-like tables, support queue, monitoring, secondary jobs |
| Mini Asus 16GB laptop-RAM PC | Lightweight watchdog/backup/status appliance if needed; treat as laptop-RAM-class mini node, not full desktop-class PC |

Do not assign Sabretooth as ANTIGRAVITY control/watchdog/backup by default. Josh wants Sabretooth for Dream Online MMORPG.

---

## 13. Free self-hosted infrastructure rule

Josh cannot afford more paid platforms until revenue exists.

Default to free/self-hosted:

```text
Cloudflare Free DNS/Tunnel
Caddy or HAProxy
Docker Compose
self-hosted Postgres or Supabase Free with backups
self-hosted Redis/Valkey
Uptime Kuma
Restic/Kopia/Syncthing
Git scripts / Windows Task Scheduler
```

Avoid by default:

```text
paid Cloudflare Load Balancing
paid managed Redis
paid VPS
paid observability
paid deploy platforms
unnecessary Kubernetes
```

Supabase Free is acceptable only if backed up locally and not treated as an irreversible dependency.

---

## 14. Language / doctrine preference

Avoid customer-facing nonprofit/solicitation-style wording.

Do not use:

```text
charity
charitable
donation
donate
split
```

Prefer business/product-first terms:

```text
mission reserve
mission allocation
allocation
revenue allocation
```

---

## 15. Next actions for Opus/Codex

Before any code change:

1. Read this briefing.
2. Read `briefings/YOUANDINOTAI-DEPLOY-RUNBOOK.md`.
3. Check current branch/status; do not trust stale memory.
4. Work in a branch or clean worktree, not by mutating divergent `main` blindly.

Priority work:

1. Fix Square webhook URL alignment to `api.youandinotai.com/api/v1/webhooks/square-payment`.
2. Prepare local sandbox env with `connect.squareupsandbox.com`, sandbox token, sandbox location, sandbox webhook key.
3. Verify sandbox checkout with `4111 1111 1111 1111` before any new real charge.
4. Add direct Square fallback buttons to paid CTAs.
5. Make $1 Bot-Shield and $14.99 Founding Member more prominent than the free trial.
6. Keep the 3-day trial but stop making it the only dominant conversion path.
7. Add/verify an admin/test reset path so Josh does not need new emails or repeated live charges.

Do not charge Josh again until sandbox and webhook alignment are proven.

---

## 16. 2026-07-06 update after Josh merged PR #193

Safe fetch updated `origin/main` to:

```text
e8474a0e feat(dream): NPC provider router + AnythingLLM support fallback (#193)
```

A new clean updated worktree exists at:

```text
C:/Users/joshl/_worktrees/antigravity-origin-main-updated
```

Targeted verification after the merged PR:

```text
backend/fastapi-app tests/test_billing.py tests/test_support_service.py tests/test_support_routes.py -q --no-cov
=> 12 passed

services/dream-npc-router npm install --ignore-scripts && npm test
=> 3 test files passed, 10 tests passed
```

Workspace-level `pnpm install --frozen-lockfile` failed on this Windows/Node 26 host because `better-sqlite3` lacks a Node 26 prebuilt binary and node-gyp could not find a usable Visual Studio C++ workload.

Treat this as host toolchain friction, not proof that PR #193 is broken.

The seven open GitHub integrity-review issues were resolved per Josh's explicit instruction:

```text
#161 #162 #163 #164 #165 #172 #174
```

Hermes verified protected Paperclip CEO/Hermes hashes at `origin/main e8474a0e` against the latest watchdog baseline, commented on each issue, and closed them. `gh issue list --state open` returned no remaining open issues after closeout.
