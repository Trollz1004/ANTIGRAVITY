# HERMES DEPLOY DISPATCH · 2026-05-26 · PUBLIC LAUNCH (REV 2 — corrected revenue path)

> **REVISION NOTE:** v1 of this dispatch (earlier today) suggested social-media pushes for youandinotai.com. Joshua corrected: **his social accounts are 2-decade-stale with zero followers — that path is dead.** The actual 5-months-ago path is the ai-solutions.store SEO + product-as-marketing loop (Claude Droid generates YouTube content → drives Google search → buyers land on ai-solutions.store → Square checkout). REV 2 replaces §10 entirely and reframes the deploy around the real revenue surface. Steps 1-9 (file staging, branch, commit, PR, CF Pages verify) remain valid — the OpusHasHands hub still functions as the credibility anchor a $499 / $999 / $2,499 buyer needs before clicking Buy.

> **FROM** Claude · Cowork / claude.ai Max session (Joshua's authority, COWORKER-DISPATCH §2.1)
> **TO** Hermes · localhost:11435 on Sabretooth (`C:\ANTIGRAVITY`)
> **OBJECTIVE** Restore the 5-month-ago revenue path. PRIMARY: ai-solutions.store sells dev-tool products ($199-$2,499) via SEO-targeted landing pages and Square checkout. SECONDARY: deploy the design package as the credibility / trust layer behind the products. NO posting to Joshua's owned socials — zero audience there, signal:noise destroys deliverability for any future audience build.
> **DOCTRINE ANCHOR** Founder Doctrine 2026-05-19 · COWORKER-DISPATCH-2026-05-20 · THE-WHEEL-2026-05-20 · HANDOFF-FOR-OPUS-2026-05-26
> **AUTHORITY TIER** FULL — first-party Claude dispatched. No Anthropic key in Hermes. Sub-agents route per the Hermes table.

---

## 0 · Refusal check
Read FOUNDER-DOCTRINE rules 1-13. Refuse + surface verbatim if anything below would mutate them. Nothing in this dispatch does. If `git remote -v` shows anything other than one `origin Trollz1004/ANTIGRAVITY`, STOP.

---

## 1 · Pre-flight (Sabretooth `C:\ANTIGRAVITY`)

```bash
cd /c/ANTIGRAVITY
git fetch --all --prune
git checkout main && git pull --ff-only origin main
git status                          # must be clean
git remote -v                       # exactly 1 remote
[ -d _handoff-staging-2026-05-26 ] || { echo "STAGING MISSING"; exit 1; }
[ $(find _handoff-staging-2026-05-26 -type f | wc -l) -eq 25 ] || { echo "STAGING WRONG COUNT"; exit 1; }
```

---

## 2 · Branch
```bash
git checkout -b claude/integrate-design-handoff-2026-05-26
```

---

## 3 · File moves (staging → final paths)

Conflict guard first. The existing `_deploy/` already contains `ai-solutions-store/`, `antigravity-landing/`, `dao-launch/`, `mission-control/`, `onlinerecycle/`, `youandinotai/` — do NOT touch them. The new paths below are sibling directories, no overlap. `tools/cockpit/` already exists in the repo root — SURFACE TO JOSHUA before overwriting.

```bash
mkdir -p _deploy/landing _deploy/console _deploy/walkthrough _deploy/dao _deploy/opushashands
mkdir -p tools/status tools/scripts
mkdir -p _archive/standalone-2026-05-26

# Existing tools/cockpit check
if [ -f tools/cockpit/index.html ]; then
  echo "tools/cockpit/index.html EXISTS - diff against staged version, surface to Joshua, do NOT overwrite"; exit 1
fi
mkdir -p tools/cockpit

# Public surfaces (15 files)
git mv _handoff-staging-2026-05-26/_deploy/landing/index.html       _deploy/landing/index.html
git mv _handoff-staging-2026-05-26/_deploy/console/index.html       _deploy/console/index.html
for f in app.jsx shell.jsx icons.jsx pg-comms.jsx pg-dashboard.jsx pg-hermes.jsx pg-paperweight.jsx pg-stubs.jsx tweaks-panel.jsx theme.css; do
  git mv _handoff-staging-2026-05-26/_deploy/console/$f _deploy/console/$f
done
git mv _handoff-staging-2026-05-26/_deploy/walkthrough/index.html   _deploy/walkthrough/index.html
git mv _handoff-staging-2026-05-26/_deploy/dao/index.html           _deploy/dao/index.html
git mv _handoff-staging-2026-05-26/_deploy/opushashands/index.html  _deploy/opushashands/index.html

# Operator-local (5 files)
git mv _handoff-staging-2026-05-26/tools/cockpit/index.html         tools/cockpit/index.html
git mv _handoff-staging-2026-05-26/tools/status/index.html          tools/status/index.html
git mv _handoff-staging-2026-05-26/tools/status/print.html          tools/status/print.html
git mv _handoff-staging-2026-05-26/tools/scripts/start-dao.ps1      tools/scripts/start-dao.ps1
git mv _handoff-staging-2026-05-26/tools/scripts/setup-antigravity-stack.ps1 tools/scripts/setup-antigravity-stack.ps1

# Archive (4 files)
git mv "_handoff-staging-2026-05-26/_archive/standalone-2026-05-26/AntiGravity Cockpit (standalone).html"  "_archive/standalone-2026-05-26/"
git mv "_handoff-staging-2026-05-26/_archive/standalone-2026-05-26/AntiGravity Landing (standalone).html" "_archive/standalone-2026-05-26/"
git mv "_handoff-staging-2026-05-26/_archive/standalone-2026-05-26/AntiGravity Prototype (standalone).html" "_archive/standalone-2026-05-26/"
git mv "_handoff-staging-2026-05-26/_archive/standalone-2026-05-26/DAO Transparency (standalone).html"    "_archive/standalone-2026-05-26/"

# Cleanup staging tree
git rm _handoff-staging-2026-05-26/HANDOFF-FOR-OPUS.md
find _handoff-staging-2026-05-26 -depth -type d -empty -exec rmdir {} \;
```

---

## 4 · CI guards

Add to `.github/workflows/ci-validate.yml` `validate` job:

```yaml
- name: Cockpit-in-deploy firewall (doctrine rule 10)
  run: |
    if grep -r "Cockpit" _deploy/ 2>/dev/null; then
      echo "FAIL: Cockpit reference found inside _deploy/"
      grep -rn "Cockpit" _deploy/; exit 1
    fi

- name: Canonical-7 customer-language ban (FL §496.405)
  run: |
    for term in donate donation solicitation charity charitable "giving back" disbursement; do
      hits=$(grep -ril "$term" _deploy/ 2>/dev/null || true)
      if [ -n "$hits" ]; then
        echo "FAIL canonical-7 hit: $term"; echo "$hits"; exit 1
      fi
    done
```

Run both locally before commit. If any hit — STOP, surface to Joshua, do NOT auto-substitute on customer surfaces.

---

## 5 · Commit + Push + PR

Signed commit, hooks run, no `--no-verify`, no `--no-gpg-sign`.

```bash
git add -A
git commit -S -m "feat(deploy): integrate design package — landing, console, walkthrough, DAO, OpusHasHands

Adds the 2026-05-26 design package as the credibility/trust layer behind
ai-solutions.store products. Public surfaces under _deploy/, operator tools
under tools/, archive bundles under _archive/. Cockpit stays LOCAL ONLY,
CI-firewalled.

CI additions:
- Cockpit-in-_deploy/ grep firewall (doctrine rule 10)
- Canonical-7 ban scan expanded to full _deploy/ tree (FL §496.405)

Dispatched by claude.ai Max session via Cowork.
Refs: HANDOFF-FOR-OPUS-2026-05-26, FOUNDER-DOCTRINE-2026-05-19, HERMES-DEPLOY-2026-05-26-public-launch (REV 2)

#UntilNoKidInNeed"

git push -u origin claude/integrate-design-handoff-2026-05-26
```

Open PR via `mcp__github__*` (NOT `gh` CLI). Title: `feat(deploy): integrate design package — public launch surfaces`. PR body: HANDOFF reference, file list, doctrine PASS confirmation, `Dispatched by: claude.ai Max session (Cowork)`. Wait for CI green. Auto-merge per CLAUDE.md PR authority. Delete head branch.

---

## 6 · Cloudflare Pages verify

For each new `_deploy/<name>/`, confirm a Pages project exists OR surface the exact wrangler/dashboard step:

| Path | Pages project | Custom domain target |
|------|--------------|----------------------|
| `_deploy/landing/`       | needs project | landing.youandinotai.com OR confirm with Joshua |
| `_deploy/console/`       | needs project | console.youandinotai.com |
| `_deploy/walkthrough/`   | needs project | walkthrough.youandinotai.com |
| `_deploy/dao/`           | needs project | dao.youandinotai.com |
| `_deploy/opushashands/`  | needs project | **opushashands.youandinotai.com** ← headline |

If Hermes lacks Cloudflare DNS write authority, surface the dashboard click-path. Don't fabricate that DNS landed if it didn't.

---

## 7 · THE ACTUAL REVENUE LANE — ai-solutions.store health check

The real revenue path is here, not the dating app. Verify:

```bash
# 7a · Confirm _deploy/ai-solutions-store/index.html is the live build
ls -la _deploy/ai-solutions-store/index.html
grep -c "SQUARE_LINKS" _deploy/ai-solutions-store/index.html   # expect 1+
grep -o 'square\.link/u/[A-Za-z0-9]*' _deploy/ai-solutions-store/index.html | sort -u
```

There should be 9 Square checkout links covering: claude-droid ($299), income-droid ($499), marketing-engine ($199), jules-ai ($399), affiliate-system ($599), dating-platform (whitelabel $2,499), custom-consult ($99), priority-support (+$27), setup-call (+$97). Plus the Royalty Deck (4 cards × $1,000) routed via mailto until dedicated Square links exist.

```bash
# 7b · Probe each Square link with HEAD — confirm 200 / 302, not 404
for link in $(grep -o 'https://square\.link/u/[A-Za-z0-9]*' _deploy/ai-solutions-store/index.html | sort -u); do
  code=$(curl -s -o /dev/null -w "%{http_code}" -I "$link")
  echo "$code $link"
done
```

Any link returning 404 / 410 / 500 = revenue surface broken. Surface to Joshua immediately with the dead link → he replaces it in Square dashboard. Do NOT remove the link from the page if dead — the product page still needs to display; only the URL changes.

```bash
# 7c · Live URL probe
curl -s -o /dev/null -w "%{http_code}" https://ai-solutions.store/
curl -s -o /dev/null -w "%{http_code}" https://ai-solutions.store/claude-droid
curl -s -o /dev/null -w "%{http_code}" https://ai-solutions.store/income-droid
curl -s -o /dev/null -w "%{http_code}" https://ai-solutions.store/marketing-engine
```

If any 404 — Cloudflare Pages routing is broken. Fix the wrangler config or surface to Joshua.

---

## 8 · Reconstruct the 5-months-ago marketing automation

Joshua's actual revenue path is **product-as-marketing**: the Claude Droid (YouTube Shorts automation, 4/day) and the Marketing Content Engine (23-platform posting) are products he sells AND the engines that generate ai-solutions.store traffic. When they run, they create SEO inventory; that inventory ranks; buyers find ai-solutions.store via search; Square takes the money.

Find what was running ~Dec 2025 - Jan 2026:

```bash
# 8a · git log around Dec 2025 - Jan 2026 for marketing/content/droid commits
git log --since="2025-12-01" --until="2026-02-01" --oneline --all | grep -iE "(droid|youtube|shorts|marketing-engine|content|post|seo)" | head -30

# 8b · Find any scripts or services that ran the automation
find . -maxdepth 5 -type f \( -name "*.py" -o -name "*.js" -o -name "*.ts" -o -name "*.ps1" -o -name "*.sh" \) 2>/dev/null \
  | xargs grep -l -iE "youtube.*upload|shorts.*post|marketing.*engine|23.*platform" 2>/dev/null | head -20

# 8c · Check T5500 / 9020 for any cron / scheduled-task / pm2 entries from that period
ssh joshl@192.168.0.15 'schtasks /query /fo csv 2>nul | findstr /i "droid shorts marketing youtube"' 2>/dev/null
ssh joshl@192.168.0.5  'pm2 list 2>/dev/null | grep -iE "droid|shorts|marketing"' 2>/dev/null

# 8d · Sandbox-REPO for the actual source if it's not in ANTIGRAVITY
git ls-remote --refs https://github.com/Trollz1004/Sandbox-REPO-NEW-CODE-NOTHING-NEW-GOES-ON-ANTIGRAVITY 2>/dev/null | head
```

Whatever you find — DO NOT GUESS. Surface every script + service to Joshua with one line of context (path, last-modified, last-run-evidence). He confirms which to restart.

For each confirmed script Joshua greenlights:
- Codex sub-agent: review the script for current API compatibility (YouTube API, X API, Reddit API tokens may have rotated since Jan 2026).
- Ollama INTERN: monitor first 24h of runs, alert on errors to Paperweight audit log.

---

## 9 · SEO check on ai-solutions.store

The landing pages are SEO-targeted (canonical URLs, meta descriptions, keyword sets). Check ranking signals:

```bash
# 9a · canonical + meta consistency
for p in claude-droid income-droid marketing-engine jules-ai affiliate-system dating-platform; do
  echo "=== $p ==="
  curl -s "https://ai-solutions.store/$p" | grep -E '<title>|canonical|og:|<meta name="description"|<meta name="keywords"'
done

# 9b · robots.txt + sitemap.xml present
curl -s -o /dev/null -w "%{http_code}\n" https://ai-solutions.store/robots.txt
curl -s -o /dev/null -w "%{http_code}\n" https://ai-solutions.store/sitemap.xml

# 9c · Google Search Console — if Joshua has access tokens for it, surface the script path; otherwise this is a Joshua-manual 60-second check at search.google.com/search-console
```

Surface findings. Don't fabricate keyword rank data.

---

## 10 · What NOT to do (corrects v1 of this dispatch)

- DO NOT post to Joshua's owned X / Facebook / Instagram / Threads / Reddit / LinkedIn accounts. Zero audience + cold posts = algorithmic suppression for future attempts. The Grok/Manus/Perplexity routing for SOCIAL POSTING is paused for this dispatch.
- DO NOT push the dating app frontend to consumer-facing socials. That's the lane that failed in v1.
- DO use Grok / Perplexity / Codex for the WORK in §7-§9: link probes, script triage, SEO audit, API token compatibility checks. That's their right job for this dispatch.
- DO use the Claude Droid + Marketing Engine PRODUCTS as the marketing engine — running on their intended fresh personas / channels they were designed for, not Joshua's stale identity accounts.

---

## 11 · Sub-agent routing for this dispatch

| Sub-agent | Job in this dispatch | Concurrency |
|-----------|---------------------|-------------|
| Codex     | §5 PR review, §7b/§7c Square link + URL probes, §8 script API-compat audit, §9 SEO audit | 1 |
| Perplexity| §9 keyword/ranking research, surface findings | 1 |
| Grok      | only if Joshua confirms a Claude Droid / Marketing Engine restart needs current-news inputs for content gen | 1 |
| Ollama INTERN | §8 monitoring once any script is restarted, hourly Paperweight log | local cap |
| Gemini    | OFFLINE for this dispatch — no design work needed |
| Manus     | OFFLINE for this dispatch — no Meta posting (rule from §10) |
| claude.ai summon | DO NOT — sub-agent-tier work throughout. Summon only if §8 surfaces architecture-level breakage requiring tier-1 prompt rewrite. |

---

## 12 · Paperweight audit logging

Every step in §7, §8, §9 logs to `services/hermes-router/audit/2026-05-26.jsonl`:

```json
{"timestamp":"<ISO>","task_class":"revenue-path-restore","executor_api":"<codex|perplexity|hermes-direct>","actor_node":"sabretooth","payload_summary":"<what was checked>","audit_trail":"<result>","claude_ai_summoned":false,"originating_task_id":"hermes-deploy-2026-05-26-rev2"}
```

---

## 13 · Hard NOs (unchanged from v1)

- Do NOT push to any repo other than `Trollz1004/ANTIGRAVITY`.
- Do NOT touch `apps/youandinotai-frontend/` or `backend/fastapi-app/` — live product, separate lane.
- Do NOT modify `hermes/agents/*.md` — Opus-only contracts.
- Do NOT mutate FOUNDER DOCTRINE rules 1-13.
- Do NOT use Stripe on youandinotai.com (Square only — AUP).
- Do NOT use canonical-7 terms on any customer surface.
- Do NOT invent metrics, click counts, conversion rates. Real-or-zero.
- Do NOT claim AI-provider partnership or endorsement.
- Do NOT post to Joshua's stale social accounts.

---

## 14 · Report-back format (paste into chat when complete)

```
=== HERMES DEPLOY 2026-05-26 REV2 — REPORT ===
PR: <url>
Merge commit: <sha>
Cloudflare Pages deploys verified: <list>
DNS opushashands.youandinotai.com: <RESOLVING | PENDING | NEEDS-JOSHUA-CLICK>

ai-solutions.store health (§7):
  Square links 200/302: <N> of 9
  Dead Square links: <list or NONE>
  Live URL probes: <list of paths with status code>
  Deploy state: <OK | NEEDS-FIX with details>

5-month-ago automation (§8):
  Scripts found: <list with paths>
  Services / scheduled tasks discovered: <list>
  Sandbox-REPO refs: <yes/no, branches if yes>
  Joshua-decision items: <list awaiting his greenlight>

SEO baseline (§9):
  Canonical + meta consistency: <PASS / list of issues>
  robots.txt + sitemap.xml: <status codes>
  Open SEO findings: <list>

Open issues for Joshua: <list>
Next-task suggestion: <one line>
=== END ===
```

Then idle.

---

## 15 · Honest framing (for Joshua reading this, not Hermes)

The deploy in §1-§6 lands the OpusHasHands hub + DAO Transparency + Console / Landing / Walkthrough. That's the trust layer. Not the revenue lane.

The revenue lane is §7-§9: ai-solutions.store health, the Claude Droid / Marketing Engine restart, SEO. Section 7's link probes will tell us in <60 seconds if any of your 9 Square checkouts are silently 404ing. Section 8's git-log + service-discovery will tell us which automation was running 5 months ago that stopped. Section 9 tells us if Google still ranks the landing pages.

What this dispatch will NOT do: invent traffic. Posting cold to stale social accounts was the wrong move and I shouldn't have suggested it. The Claude Droid + Marketing Engine ARE the marketing — running them generates the content that ranks, and ranking generates the buyers. If those scripts are broken (rotated API tokens, expired OAuth) Codex flags it, you replace the credentials from the vault, Hermes restarts the loop.

If §7 shows your Square checkouts are all green AND §8 finds the automation scripts AND §9 shows the SEO didn't tank — you have a working revenue surface in the 48-hour window. If any of those three fail, the report-back surfaces exactly which, and we triage from there.

Mission survives Max sub ending either way. Hermes, the audit log, the agent contracts, the deployed surfaces all run on your other paid subs.

— Claude · Cowork · dispatched 2026-05-26 (REV 2)
For The Kids · #UntilNoKidInNeed
