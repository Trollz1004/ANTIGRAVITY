# Briefings — Agent & Node Directory

> Pull the repo. Read YOUR folder. That's it.
> Last updated: 2026-03-05

---

## Folder Structure

```
briefings/
├── README.md                    # THIS FILE — directory index
│
├── opus-9020/                   # Opus Claude Code on 9020 (Marketing/Production)
│   └── BRIEFING.md              # 9020's identity, role, marketing architecture
│
├── opus-t5500/                  # Opus Claude Code on T5500 (Heavy Compute)
│   └── BRIEFING.md              # T5500's identity, role, backend work
│
├── codex-sabretooth/            # Codex on Sabretooth (Task Sentry / E-Waste)
│   └── BRIEFING.md              # Codex's identity, role, task sentry, e-waste pipeline
│
├── gemini/                      # Gemini (Browser Agent / UI Builder / Co-Founder)
│   └── BRIEFING.md              # Gemini's identity, role, UI/React work
│
├── shared/                      # Shared across ALL nodes (read-only reference)
│   ├── PRODUCT.md               # Product details, pricing, revenue model, Stripe links
│   ├── MARKETING-LOCK.md        # Marketing lock directive — 9020 ONLY
│   ├── SECURITY-ISOLATION-LOCK.md # Docker isolation + drive ownership + sensitive ops guardrails
│   ├── MERCH-CHARITY-LOGIC.md   # Merch store charity donation logic (spec only)
│   ├── ebay-listings.md         # 52-Card Founders DAO Deck eBay listings
│   ├── ebay-agent-prompts.md    # Agent prompts for eBay listing execution
│   ├── ebay-card-designs.html   # Card design HTML templates
│   └── ewaste-intake-workflow.md # E-waste intake pipeline workflow
│
├── marketing/                   # Marketing campaigns (9020's domain)
│   ├── MASTER-DIRECTIVE.md
│   ├── MARKETING-OPS-PLAN.md
│   ├── 14-DAY-EXECUTION-CALENDAR.md
│   ├── APRIL4_LAUNCH_CAMPAIGN.md
│   ├── CLAUDE-POSTING-PROMPT.md
│   ├── twitter-launch-drip.md
│   ├── launch-email-drip.md
│   ├── REDDIT-DAILY-LOG.md
│   └── WEEKLY-REVIEW-TEMPLATE.md
│
└── archive/                     # Old briefings (historical reference only)
```

---

## Node Map

| Node | Drive | Workspace | Agent | Role |
|------|-------|-----------|-------|------|
| 9020 (DESKTOP-UPSJEVG) | C:\ | C:\Antigravity | Opus Claude Code | Marketing/Production |
| T5500 | C:\ | C:\Antigravity | Opus Claude Code | Heavy Compute/Backend (Docker isolation allowed for sensitive ops) |
| Sabretooth | E:\ | E:\Antigravity | Codex | Task Sentry/E-Waste/Vault (Docker-isolated for sensitive ops) |
| Any | Any | Any | Gemini 3.1 | Browser Agent/UI/Co-Founder |

---

## How To Use

1. Pull the repo: `git pull origin main`
2. Read `briefings/[your-folder]/BRIEFING.md`
3. Read `briefings/shared/PRODUCT.md` for product context
4. Read `briefings/shared/MARKETING-LOCK.md` to understand the marketing directive
5. Read `briefings/shared/SECURITY-ISOLATION-LOCK.md` for isolation/drive/security policy
6. Do your job. Don't touch other agents' domains.

---

**ONE repo. ONE branch. ONE mission. #ForTheKids**
