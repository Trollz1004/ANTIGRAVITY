# OPUS DISPATCH — FROM GEMINI ANTIGRAVITY
# Paste into Claude Code CLI at C:\OPUSONLY

Resume session. T5500, C:\OPUSONLY. Read CLAUDE.md and .env first.

## TASK 1: GIT INIT (I already deleted C:\.git — the whole C: drive was a repo)

```bash
cd C:\OPUSONLY
git init
git remote add origin https://github.com/Trollz1004/ANTIGRAVITY.git
```

Then update .gitignore — remove the `GEMINI-STATUS.md` line (we want it tracked). Add:
```
.env
.env.*
!.env.example
.vault/
node_modules/
.next/
dist/
__pycache__/
*.pyc
*.log
.wwebjs_auth/
.wwebjs_cache/
qdrant-data/
package-lock.json
Thumbs.db
.DS_Store
```

Then:
```bash
git add -A
git commit -m "T5500 workspace: OpenClaw + dashboards + data + plugin (Feb 23)"
git push -u origin main --force
```

## TASK 2: COPY ALL SECRETS TO ANTIGRAVITY REPO

Read C:\OPUSONLY\.env and C:\OPUSONLY\_ARCHIVE\dot-dirs\.vault\MASTER-ENV.env. Push EVERY key=value pair as a GitHub secret:

```bash
# For each KEY=VALUE in the .env files:
echo "VALUE" | gh secret set KEY --repo Trollz1004/ANTIGRAVITY
```

Also push these from the .env that are already there:
- STRIPE_PUBLIC_KEY, STRIPE_SECRET_KEY
- TWITTER_API_KEY, TWITTER_API_SECRET, TWITTER_BEARER_TOKEN, TWITTER_ACCESS_TOKEN, TWITTER_ACCESS_TOKEN_SECRET, TWITTER_CLIENT_SECRET
- All STRIPE_LINK_* values
- GEMINI_API_KEY from the vault file (AIzaSyDDtwMRbuKLHCPVBDWzJntF1PL6An6pZys)

Verify with: `gh secret list --repo Trollz1004/ANTIGRAVITY`

## TASK 3: FIX YOUANDINOTAI.COM SITE

The site source is at C:\OPUSONLY\youandinotai (or check _ARCHIVE if moved). Find the index.html.

Replace the entire `<head>` block with:

```html
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>YouAndINotAI | AI-Powered Dating for a Cause</title>
  <meta name="description" content="The world's first AI dating app that proves your match is real. Bot-Shield verification, Gemini AI matchmaking, and every dollar funds kids' tech education.">
  <link rel="canonical" href="https://youandinotai.com">
  
  <!-- Open Graph -->
  <meta property="og:type" content="website">
  <meta property="og:title" content="YouAndINotAI | AI-Powered Dating for a Cause">
  <meta property="og:description" content="Real people. Real connections. AI-verified. Every subscription funds kids' tech education.">
  <meta property="og:url" content="https://youandinotai.com">
  <meta property="og:image" content="https://youandinotai.com/og-image.png">
  <meta property="og:site_name" content="YouAndINotAI">
  
  <!-- Twitter Card -->
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="YouAndINotAI | AI-Powered Dating for a Cause">
  <meta name="twitter:description" content="Real people. Real connections. AI-verified.">
  <meta name="twitter:image" content="https://youandinotai.com/og-image.png">
  
  <link rel="icon" href="/favicon.ico">
</head>
```

## TASK 4: FIX NETLIFY.TOML

Find or create netlify.toml in the site root:

```toml
[build]
  publish = "dist"
  command = "npm run build"

[build.environment]
  NODE_VERSION = "20"

[[redirects]]
  from = "/api/*"
  to = "https://youandinotai-com-731395189513.us-west1.run.app/:splat"
  status = 200
  force = true

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200

[[headers]]
  for = "/*"
  [headers.values]
    X-Frame-Options = "DENY"
    X-Content-Type-Options = "nosniff"
    Referrer-Policy = "strict-origin-when-cross-origin"
```

## TASK 5: MOVE GEMINI_API_KEY TO NETLIFY ENV

Do NOT put GEMINI_API_KEY in netlify.toml or any committed file. Run:

```bash
netlify env:set GEMINI_API_KEY AIzaSyDDtwMRbuKLHCPVBDWzJntF1PL6An6pZys
```

Then remove any GEMINI_API_KEY reference from netlify.toml build.environment section.

## TASK 6: DEPLOY TO NETLIFY

```bash
cd C:\OPUSONLY\youandinotai
netlify link --id thunderous-sawine-9753d5
netlify build
netlify deploy --prod
```

## TASK 7: VERIFY

1. `curl -I https://youandinotai.com` — confirm 200, check title
2. Open each Stripe link in browser — confirm checkout loads:
   - https://buy.stripe.com/3cI3cwcR6c3910p18peEo09
   - https://buy.stripe.com/00w8wQaIYgjp5gF2cteEo0a
   - https://buy.stripe.com/9B67sM7wM7MT9wV7wNeEo0b
   - https://buy.stripe.com/3cI5kEbN22szgZnaIZeEo0c
   - https://buy.stripe.com/dRmcN604kebheRf2cteEo0d
3. `gh secret list --repo Trollz1004/ANTIGRAVITY | Measure-Object -Line` — should be 30+
4. `git -C C:\OPUSONLY log --oneline -1` — confirm pushed

## TASK 8: REPORT BACK

Write results to C:\OPUSONLY\briefings\opus-report-feb23-late.md so Gemini can read it next session.

---
*From Gemini Antigravity | 2026-02-23 23:19 EST | Only Gemini or Opus touches this repo.*
