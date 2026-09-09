# LLC Crosslisting OS — provenance

**Author:** Manus. **Delivered:** 2026-08-26 as `Cross-Listing on eBay Guide.zip`
(334 KB, 42 files) to `~/Downloads`. **Folded into ANTIGRAVITY:** 2026-08-26 by the
Claude judge lane, on Joshua's instruction: *"manus was working on crosslister put
that in antigravity dont trash."*

## Why it lives here and not in its own repo

`Trollz1004/llc-crosslisting-os` exists on GitHub but is **empty** — zero commits,
zero bytes. The only copy of this work was the download. Under the consolidation
rule (one non-game repo), it belongs in ANTIGRAVITY; that empty repo can be
archived without loss now that these files are here.

## The export was flat — this layout is reconstructed

Manus exported all 42 files into a single directory with no folders. The tree here
was rebuilt from the paths named in the delivered docs:

- `README.md:50` — *"Database models live in `drizzle/schema.ts`. Backend procedures
  are defined under `server/routers/`; the internal dashboard is under
  `client/src/pages/`."*

Everything else was placed by file type and role. **File contents are byte-identical
to the export; only their paths were assigned.** Nothing was renamed, edited, merged,
or dropped — all 42 files are present.

Placements that were inferred rather than documented, and so are the ones to
re-check if something fails to resolve:

| Path | Files | Basis |
|---|---|---|
| `server/` | `db.ts`, `index.ts`, `storage.ts`, `env.ts`, `llm.ts`, `ebayOAuth.ts` | server-side modules, imported by routers |
| `server/__tests__/` | `operations.test.ts`, `ebay.credentials.test.ts` | test naming |
| `client/src/layouts/` | `DashboardLayout.tsx` | layout component, sibling of `pages/` |
| `research/` | `crosslistebay`, `Code.gs`, `pasted_content.txt`, `2026-08-26_*.txt` | raw research inputs, not application code |
| `tools/` | three `*.py` scripts | build/validate helpers, not shipped code |
| `assets/` | `.xlsx` template, `crosslisting_package.zip` | binary deliverables |

## State: not wired up

This is a delivered source drop, **not a running application**. There is no
`package.json`, no lockfile, no `drizzle.config.ts`, and no dependency install.
It does not build in place. Treat it as preserved input for a later integration
pass, and see `docs/todo.md` for what Manus left pending.

## Verified on intake

- No credential material. Scanned for `sk-ant-`/`sk-or-v1-`/`gsk_`/`nvapi-`/`xai-`/
  `AIza`/`ghp_`/`github_pat_`/`EAAA`/`sk_live_`/`AKIA`/private-key headers, and for
  hardcoded secret assignments. Zero hits. Secrets are referenced via `process.env`
  only — consistent with `SECRETS.md`.
- `docs/ARCHITECTURE.md` is approval-gated by design: no marketplace action is
  implicitly authorized, the activity ledger is append-only, and secret values stay
  server-side. That matches this repo's governance rather than fighting it.

## Related, already in the tree

Loose eBay/recycling scripts predate this and are **not** superseded by it — they
are a different, smaller thing:
`scripts/onlinerecycle/ewaste-crosslister-pipeline.js`,
`scripts/onlinerecycle/ebay-to-square-csv.js`,
`scripts/onlinerecycle/export-ebay-ready-html.js`.
Reconciling the two is open work, not done here.
