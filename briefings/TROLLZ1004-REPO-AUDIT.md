# Trollz1004 GitHub — 1-Repo Invariant Audit

**Generated:** 2026-05-19 (design-bundle-v1 commit phase)
**Authority:** Joshua override 2026-05-19 — _"only 1 repo 1 branch 1 folder root no matter what node Antigravity is name and the 1 repo name 1 branch."_
**Reference doctrine:** `CLAUDE.md` § _Repos to Archive (not delete yet — await migration confirmation)_

---

## The invariant

**ONE repo: `Trollz1004/ANTIGRAVITY`. ONE branch off main: `claude/<short-description>`. ONE root per node: `C:\ANTIGRAVITY` on Sabretooth · `/home/user/ANTIGRAVITY` in containers.**

Per Joshua: _"no damn ai can alter this setup after."_ This audit is a one-time enforcement pass; future Claude sessions should treat the invariant as load-bearing and refuse any request that would create a sibling repo.

---

## Archive these (CLAUDE.md authoritative list)

I cannot click the archive button from this sandbox — GitHub archive is auth-walled and the GitHub MCP is not loaded in this Cowork session. The list below is the canonical archive-pending list from CLAUDE.md. **Joshua actions each archive in the GitHub UI.**

| # | Repo | Status per CLAUDE.md | Reason | Archive link (one click) |
|---|---|---|---|---|
| 1 | `Trollz1004/antigravity-dashboard` | Pending archive | Migrated → `apps/dashboard/` in ANTIGRAVITY | https://github.com/Trollz1004/antigravity-dashboard/settings#danger-zone |
| 2 | `Trollz1004/OpenclawDash` | Pending archive | Migrated → `apps/openclaw/` (when added) | https://github.com/Trollz1004/OpenclawDash/settings#danger-zone |
| 3 | `Trollz1004/command-center` | Pending archive | Migrated → `apps/dashboard/` in ANTIGRAVITY | https://github.com/Trollz1004/command-center/settings#danger-zone |
| 4 | `Trollz1004/youandinotai-com` | **Archive now** | Only contained a README; live code lives in `apps/youandinotai-frontend/` | https://github.com/Trollz1004/youandinotai-com/settings#danger-zone |
| 5 | `Trollz1004/sandbox-repo-new-code-nothing-new-goes-on-antigravity` | Pending archive | Migrate unique code first: hermes, manus-meta-guardian, anythingllm-bridges, marketing-assets | https://github.com/Trollz1004/sandbox-repo-new-code-nothing-new-goes-on-antigravity/settings#danger-zone |

### How to archive (per repo)

1. Open the archive link in the table above.
2. Scroll to **Danger Zone** at the bottom.
3. Click **Archive this repository**.
4. Type the full repo name to confirm.
5. Click **I understand the consequences, archive this repository**.

Archived repos remain visible and clonable, but become read-only. This satisfies the 1-repo invariant without losing history.

---

## Pre-archive migration checklist (for repos 1-3 and 5 only — #4 ready now)

### `antigravity-dashboard` → `apps/dashboard/`
- [ ] `git log Trollz1004/antigravity-dashboard..main` shows zero commits in the legacy repo that aren't already in ANTIGRAVITY
- [ ] `apps/dashboard/` builds cleanly: `pnpm -C apps/dashboard build`
- [ ] Cloudflare Pages target `dashboard.aidoesitall.website` resolves from ANTIGRAVITY's `_deploy/dashboard-gateway/`

### `OpenclawDash` → `apps/openclaw/`
- [ ] Confirm whether `apps/openclaw/` is actually wanted as a new app dir (CLAUDE.md mentions it but the dir doesn't exist today)
- [ ] If yes: copy unique OpenclawDash code into a feature branch in ANTIGRAVITY, then archive
- [ ] If no: archive directly — content is duplicated by Cockpit (`tools/cockpit/`)

### `command-center` → `apps/dashboard/`
- [ ] Same check as `antigravity-dashboard` — confirm `apps/dashboard/` covers both

### `sandbox-repo-new-code-nothing-new-goes-on-antigravity`
- [ ] Diff this repo against ANTIGRAVITY: `git diff sandbox..ANTIGRAVITY -- hermes manus-meta-guardian anythingllm-bridges marketing-assets`
- [ ] Pull any unique commits into ANTIGRAVITY on a feature branch
- [ ] Archive once diff is empty

---

## What I'd do next (if you want one of these handled now)

I can prepare the migration PRs for repos 1, 2, 3, or 5 — but each requires Joshua to grant me read access to that legacy repo from this Cowork session (currently I only see `C:\ANTIGRAVITY`). Easiest path: do the archive button for #4 (`youandinotai-com`) right now since CLAUDE.md flags it as "archive now," and queue the others for a separate session where I can clone each into the workspace and diff against `main`.

---

## Cross-reference

This audit complements `briefings/DESIGN-BUNDLE-V1-VERIFICATION.md` (the design-bundle commit). Both ship together so the next session has a clean view of (a) what just landed and (b) what's still drift outside the 1-repo boundary.
