# OPUS Skills — Command Library
**These are Claude Code skill prompts. Paste into Claude CLI to execute.**

---

## health — Platform Health Check (Sabretooth)

```
Run diagnostics on the SABRETOOTH platform services (192.168.0.8).
Check all 4 ports in the dependency chain:

1. Ollama (11434) — curl http://192.168.0.8:11434/api/tags
2. OpenClaw/Clawdbot (18789) — port check
3. HEMORzoid API (8001) — curl http://192.168.0.8:8001/health
4. Dashboard (3001) — port check

Report:
  Ollama (11434):     [UP/DOWN] — [detail]
  OpenClaw (18789):   [UP/DOWN] — [detail]
  HEMORzoid (8001):   [UP/DOWN] — [detail]
  Dashboard (3001):   [UP/DOWN] — [detail]

Bottom-up diagnosis — if Ollama is down, everything downstream is irrelevant.
SABRETOOTH only. Never touch .5 or .15 nodes.
```

---

## status — Quick Status Summary

```
Quick status check. Read OPUS-STATUS.md if it exists in C:\ANTIGRAVITY.
Give Josh a 3-bullet summary:
1. Current focus — what we're working on right now
2. Blockers — what's stuck (or "none")
3. Next action — single most important thing to do next

Under 10 lines. No novel.
```

---

## launch-checklist — Launch Readiness Check

```
Review the YouAndINotAI launch checklist. Check each category:

Technical: V8 verification, registration/login, profile creation,
  payments (Square), messaging, SSL/TLS, error handling
Business: Privacy Policy, Terms of Service, Refund policy, Support channel
Marketing: Launch announcement, email list, social posts
Revenue: Pre-orders vs $19,990 target, Founding Members count, Bot-Shield count

Report as checklist with DONE/NOT DONE/BLOCKED for each item.
Flag top 3 priorities.
```

---

## deploy-check — Cloudflare Pages Health

```
Check deployment status across all Cloudflare Pages sites.
Verify each site is reachable (HTTP 200):
  https://youandinotai.com
  https://onlinerecycle.org
  https://ai-solutions.store
  https://dashboard.aidoesitall.website

For each site report:
  - HTTP status code
  - Whether #ForTheKids text is present
  - Whether payment links point to square.link (not buy.stripe.com)
  - Page load time

Also check for §496.405 violations — scan for "donate" or "donation"
outside of legal disclaimers.
```

---

## donate-scan — §496.405 Compliance Scan

```
Scan all frontend code for Florida §496.405 violations.

Scan files:
  youandinotai/src/**/*.{tsx,ts,jsx,html}
  antigravity/**/*.{tsx,ts,jsx,html} (excluding node_modules)
  _deploy/**/*.{html,js}

For each match classify as:
  VIOLATION: implies we are soliciting donations
  SAFE: used in legal disclaimer context
  EXTERNAL: links to third-party charity using their own language

Also scan for: "charitable contribution", "tax-deductible", "501(c)(3)"
used to describe us (we are an LLC, not a nonprofit).

Report: total violations, file:line for each, suggested replacement.

Approved replacements:
  "donation" → "disbursement" or "revenue split"
  "donate" → "support" or "give back"
  "charitable contribution" → "contractual revenue disbursement"
  "tax-deductible" → REMOVE
```

---

## security-review — Pre-Push Security Check

```
Run a security review on recently changed files.

1. Get recently modified files:
   git diff --name-only HEAD~1 HEAD

2. For each changed file check:
   - Zero Secrets: scan for API keys, tokens, passwords
     (patterns: sk-live_, Bearer , hardcoded URLs with keys)
   - Auth on every new endpoint (FastAPI routers need auth dependency)
   - Doctrine boundary: no retired 60/30/10 or charity-side routing claims
   - Revenue policy: 10% minimum reserve hardcoded, not from env/config
   - PII isolation: no emails/names/user IDs leaking from /metrics/ endpoints
   - No raw SQL (f-string or string interpolation in queries)
   - Input validation: new POST/PUT endpoints must use Pydantic schemas
   - CORS: only youandinotai.com and localhost:3000 allowed

3. Report PASS/FAIL for each invariant, with file:line for violations.
```

---

## policy-boundary — Doctrine Drift Scan

```
Run the doctrine-boundary verification scan.
Check that active operational files do not carry stale split-routing claims,
retired repo assumptions, or unsupported charity-side language.

Boundary rules:
  - No active file may present LLC-controlled revenue above 10% minimum reserve
  - No file may reference 60/30/10, 100% charity, or 100% DAO as current truth
  - No file may reference named beneficiary charity as revenue destination
  - No file may mix historical chain artifacts with live product or payment claims

Check current workspace for:
  - historical split wallets or 60/30/10 claims
  - 100% charity / 100% DAO language
  - charity-side routing claims on live commercial surfaces

If drift found: STOP, report exact file + line to Josh. Do NOT modify until source of truth is clear.
```

---

## cost-check — Model Cost Review

```
Review the current task and suggest the most cost-effective approach.

Cost model:
  Ollama local / HEMORzoid (Sabretooth :8001): $0 — use for 90%
  Claude Haiku API: ~$0.01/task — use for 5% (quick structured tasks)
  Claude Sonnet/Opus (subscription): $200/mo flat — use for 5% (strategic only)
  Gemini CLI: $0 — research, long context
  Codex API: per-token — code review only

HEMORzoid endpoints (all $0):
  /crosslist/describe /crosslist/title /social/tweet
  /social/caption /support/respond /dating/bio/generate

Report: what the current task costs, what it SHOULD cost, recommended approach.
```

---

## square-status — Payment Infrastructure Check

```
Check Square payment infrastructure status.

1. Verify API access via Square API (load SQUARE_ACCESS_TOKEN from .env).
2. Check all 5 checkout links are reachable (HTTP 200):
   Bot-Shield $1:           https://square.link/u/Qc5mxUy7
   Founding Member $14.99:  https://square.link/u/cxwjcn0s
   3-Month Founder $39.99:  https://square.link/u/oY7qEfRM
   12-Month Founder $99.99: https://square.link/u/6GHpbvvl
   Royalty Card $2,500:     https://square.link/u/CafhorUS
3. Pull recent orders (last 7 days) from Square Orders API.
4. Report: token status, each link status, order count, total revenue last 7 days.
```
