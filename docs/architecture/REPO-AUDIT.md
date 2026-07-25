# ANTIGRAVITY Repo Consolidation Audit

> **Policy**: 1 repo · 1 folder tree · 1 Node policy.  
> **Canonical repo**: `Trollz1004/ANTIGRAVITY`  
> All other repos listed below should be archived or deleted after their unique code is migrated here.

---

## Inventory of All 9 Repos

### 1. `ANTIGRAVITY` — THE MONOREPO (KEEPER)

| Folder | What it is |
|--------|------------|
| `antigravity/` | Next.js 14 main frontend app |
| `contracts/src/` | Hardhat + 3 Solidity contracts (see DAO section) |
| `crossfire/` | Backend + frontend sub-app |
| `ClawX/` | ClawX sub-project |
| `CodeX/` | CodeX sub-project |
| `youandinotai/` | YouAndINotAI Next.js app |
| `youandinotai-api/` | YouAndINotAI API server |
| `brain-mcp/` | MCP brain server |
| `mcp-server/` | MCP server |
| `paperclip/` | Paperclip AI platform (older version — see duplicate note) |
| `paperclip-adapters/` | Paperclip adapters |
| `ai-solutions/` | AI solutions module |
| `customer-support/` | Customer support module |
| `social-command-center/` | Social command center |
| `revenue-core/` | Revenue core |
| `briefings/` | Briefing docs |
| `memory/` | AI agent memory files |
| `research/` | Research docs |
| `data/` | Data files |
| `content/` | Content files |
| `design-specs/` | Design specs |
| `assets/` | Static assets |
| `infra/` | Infrastructure configs |
| `_deploy/` | Deploy scripts |
| `scripts/` | Helper scripts |
| Root Python files | 8+ Square webhook/payment scripts scattered at root — should move to `scripts/square/` |
| `square_catalog.json` | 224KB catalog file — should move to `data/square/` |

---

### 2. `antigravity-dashboard` — FOLD IN → `apps/dashboard/`

| File | What it is |
|------|------------|
| `index.html` | 43KB Cloudflare Workers static dashboard |
| `functions/` | Cloudflare Worker edge functions |
| `wrangler.toml` | Cloudflare deployment config |

**Action**: Migrate to `ANTIGRAVITY/apps/dashboard/` then archive this repo.

---

### 3. `OpenclawDash` — FOLD IN → `apps/openclaw/`

| File | What it is |
|------|------------|
| `client/` | React frontend (Vite, Radix UI, tRPC) |
| `server/` | Express backend |
| `shared/` | Shared types |
| `drizzle/` | Drizzle ORM migrations |

**Package name**: `openai-proposal` (temp name — needs renaming to `openclaw-dash`)  
**Stack**: React 19 · tRPC · Express · Drizzle · MySQL · pnpm  
**Action**: Migrate to `ANTIGRAVITY/apps/openclaw/` then archive this repo.

---

### 4. `command-center` — FOLD IN → `apps/dashboard/` or `apps/command-center/`

| File | What it is |
|------|------------|
| `app/` | Next.js app directory |
| `lib/` | Shared utilities |

**Stack**: Next.js  
**Action**: Determine overlap with `antigravity-dashboard`. Merge unique routes into `apps/dashboard/` then archive this repo.

---

### 5. `youandinotai-com` — ARCHIVE (empty)

Contains only a README.  
Code already lives in `ANTIGRAVITY/youandinotai/`.  
**Action**: Archive/delete immediately.

---

### 6. `sandbox-repo-new-code-nothing-new-goes-on-antigravity` — MIGRATE UNIQUE CODE THEN ARCHIVE

| Folder | What it is | Status |
|--------|------------|--------|
| `dao-patches/` | **Paperclip AI platform** (package name = `paperclip`, pnpm workspace, 446KB lockfile) — newer/more complete version of `ANTIGRAVITY/paperclip/` | **DUPLICATE** — migrate newer version to `packages/paperclip/` |
| `openclaw/` | OpenClaw app code | **DUPLICATE** of `OpenclawDash` repo |
| `paperclip-antigravity/` | Paperclip adapters | **DUPLICATE** of `ANTIGRAVITY/paperclip-adapters/` |
| `hermes/` | Messaging dispatch system | **UNIQUE** — migrate to `services/hermes/` |
| `migrated-claws-from-c/` | C→JS migrated code | **UNIQUE** — migrate to `tools/migrated-claws/` |
| `anythingllm-bridges/` | AnythingLLM integration | **UNIQUE** — migrate to `packages/anythingllm-bridges/` |
| `manus-meta-guardian/` | Meta guardian agent | **UNIQUE** — migrate to `tools/manus-meta-guardian/` |
| `marketing-assets/` | Marketing materials | **UNIQUE** — migrate to `docs/marketing/` |

> ⚠️ `dao-patches/` is NOT a DAO/staking contract. It's the Paperclip AI coding assistant platform. The name is misleading.

---

### 7. `Electrician-who-lies-i-KNIOW-CODE-ELECTRICAL-CODE---ForTheKIDS-` — KEEP SEPARATE

Educational electrical code reference docs.  
No overlap with the ANTIGRAVITY tech stack. Keep as a standalone repo.

---

### 8. `Electrician-who-lies-i-KNIOW-CODE-ELECTRICAL-CODE---ForTheKIDS-2` — KEEP SEPARATE

Same — educational/docs only. Keep separate.

---

### 9. `Trollz1004` — KEEP (GitHub profile)

Standard GitHub profile README repo. Keep as-is.

---

## DAO / Staking Duplicate Findings

### Smart Contracts (Solidity)

**SINGLE canonical location**: `ANTIGRAVITY/contracts/src/`

| Contract | Purpose |
|----------|---------|
| `Router100.sol` |  revenue routing |
| `DatingRevenueRouter.sol` | Dating platform revenue routing |
| `Gospelpayment.sol` | payment contract |

**Result**: ✅ No duplicate smart contracts found across repos. These live in exactly one place.

### Governance / DAO Docs

| File | Location |
|------|----------|
| `GOVERNANCE.md` | `ANTIGRAVITY/` root only |
| `DAO-RECOVERY-CANDIDATES.md` | `ANTIGRAVITY/briefings/` only |

**Result**: ✅ No duplicate governance docs.

### Paperclip AI Platform (misnamed "dao-patches" in sandbox)

| Location | Status | Notes |
|----------|--------|-------|
| `ANTIGRAVITY/paperclip/` | Older version | Keep for reference during migration |
| `ANTIGRAVITY/paperclip-adapters/` | Adapters | Merge into canonical packages/paperclip |
| `sandbox/dao-patches/` | **Newer/more complete** | pnpm workspace, full test suite, evals, CLI | 
| `sandbox/paperclip-antigravity/` | Duplicate of adapters | Archive after migration |

**Action**: Use `sandbox/dao-patches/` as the canonical source, migrate to `ANTIGRAVITY/packages/paperclip/`. Archive all others.

---

## Clean Target Structure

```
ANTIGRAVITY/
├── package.json            ← monorepo root (pnpm workspaces)
├── pnpm-workspace.yaml     ← workspace globs
├── .gitignore
├── .env.example
├── CLAUDE.md               ← 1-repo policy
├── README.md
│
├── apps/
│   ├── web/                ← was: antigravity/  (Next.js main frontend)
│   ├── dashboard/          ← fold in: antigravity-dashboard + command-center
│   └── openclaw/           ← fold in: OpenclawDash + sandbox/openclaw
│
├── packages/
│   ├── contracts/          ← keep: Hardhat + 3 Solidity contracts
│   ├── paperclip/          ← consolidate: sandbox/dao-patches (primary source)
│   ├── brain-mcp/          ← keep
│   ├── mcp-server/         ← keep
│   └── anythingllm-bridges/ ← migrate from sandbox
│
├── services/
│   ├── crossfire/          ← keep
│   ├── youandinotai/       ← keep
│   ├── youandinotai-api/   ← keep
│   ├── revenue-core/       ← keep
│   └── hermes/             ← migrate from sandbox
│
├── tools/
│   ├── ClawX/              ← keep
│   ├── CodeX/              ← keep
│   ├── ai-solutions/       ← keep
│   └── manus-meta-guardian/ ← migrate from sandbox
│
├── docs/
│   ├── briefings/          ← keep
│   ├── content/            ← keep
│   ├── design-specs/       ← keep
│   ├── research/           ← keep
│   └── marketing/          ← migrate from sandbox/marketing-assets
│
├── data/
│   └── square/             ← move square_catalog.json here
│
└── scripts/
    └── square/             ← move all root Python Square scripts here
```

---

## Action Checklist

### Immediate (no migration needed)
- [ ] Archive `youandinotai-com` — nothing unique in it
- [ ] Rename `apps/web/` (was `antigravity/`) in ANTIGRAVITY structure
- [ ] Move root Python scripts → `scripts/square/`
- [ ] Move `square_catalog.json` → `data/square/`
- [ ] Move `docker-compose.yml`, `litellm-config.yaml`, `Dockerfile` → `.infra/`

### Migration required (from other repos)
- [ ] `antigravity-dashboard` → `apps/dashboard/`
- [ ] `command-center` → `apps/dashboard/` (merge routes)
- [ ] `OpenclawDash` → `apps/openclaw/`
- [ ] `sandbox/hermes/` → `services/hermes/`
- [ ] `sandbox/anythingllm-bridges/` → `packages/anythingllm-bridges/`
- [ ] `sandbox/manus-meta-guardian/` → `tools/manus-meta-guardian/`
- [ ] `sandbox/migrated-claws-from-c/` → `tools/migrated-claws/`
- [ ] `sandbox/marketing-assets/` → `docs/marketing/`
- [ ] `sandbox/dao-patches/` (Paperclip) → `packages/paperclip/` ← PRIMARY SOURCE

### Archive after migration confirmed
- [ ] `antigravity-dashboard`
- [ ] `OpenclawDash`
- [ ] `command-center`
- [ ] `youandinotai-com`
- [ ] `sandbox-repo-new-code-nothing-new-goes-on-antigravity`

### Keep separate forever
- `Electrician-who-lies-i-KNIOW-CODE-ELECTRICAL-CODE---ForTheKIDS-` (unrelated)
- `Electrician-who-lies-i-KNIOW-CODE-ELECTRICAL-CODE---ForTheKIDS-2` (unrelated)
- `Trollz1004` (GitHub profile)

---

## Why So Many Repos?

Based on the scan, the sprawl happened because:
1. **AI agents created new repos** instead of working in ANTIGRAVITY branches
2. **Dashboard was built externally** (Cloudflare Workers) without integrating back
3. **OpenclawDash** was scaffolded from a template (`openai-proposal` name) as a throwaway that became real
4. **Sandbox repo** became a staging area but never got merged back
5. **`dao-patches/` naming** confused the Paperclip platform with DAO contracts

The fix is to enforce the 1-repo rule in CLAUDE.md so AI agents always branch inside ANTIGRAVITY.
