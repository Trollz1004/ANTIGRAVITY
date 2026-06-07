# Consolidation Manifest — 2026-06-07

## ONE REPO, ONE ROOT, ONE BRANCH

**Primary Repo**: `Trollz1004/ANTIGRAVITY` (main branch)

### Migrated Into `/apps/`

1. **`command-center`** → `apps/command-center/`
   - Social approval desk (Next.js + TypeScript)
   - GitHub: https://github.com/Trollz1004/command-center
   - Status: Migrated ✓

2. **`antigravity-dashboard`** → `apps/dashboard/`
   - Mission Control (Cloudflare Pages)
   - GitHub: https://github.com/Trollz1004/antigravity-dashboard
   - Status: Migrated ✓

3. **`income-engine`** → `apps/income-engine/`
   - Lead-gen pipeline (archived, for-profit)
   - GitHub: https://github.com/Trollz1004/income-engine
   - Status: Migrated ✓

### To Be Deleted (Noise Repos)

- `ANTIGRAVITYclip` — No purpose
- `Electrician-who-lies-i-KNIOW-CODE-ELECTRICAL-CODE---ForTheKIDS-` (x2) — Noise
- `OpenclawDash` — Abandoned proposal

### Kept (Not Touched)

- `9020-hermes-backup` — Disaster recovery
- `sabretooth-hermes-backup` — Disaster recovery
- `t5500-hermes-backup` — Disaster recovery
- `Trollz1004` — Profile repo (standard)

### Hard Isolation Rules

- **ANTIGRAVITY/main** = single source of truth (all apps + infra)
- **command-center + dashboard** = kids' platforms (T5500 nodes)
- **income-engine** = for-profit (separate GitHub account: `AidoesitAll`)
- **OMEGA/OMEGA 365/aicollab4kids** = NEVER referenced from for-profit code

### Next Steps

1. ✓ Branch created: `consolidate-repos-2026-06-07`
2. ✓ Files migrated to `/apps/`
3. → Merge to main
4. → Delete noise repos
5. → Archive backup repos (optional)

### Why It Matters

- **One root = no confusion**: All ops pull from `Trollz1004/ANTIGRAVITY/main`
- **No scatter**: Hermes, CI/CD, deployments all reference one place
- **Long-term survival**: When you're gone, one repo = one handoff point
