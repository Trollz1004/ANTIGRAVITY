# FINDING — the SEO blog engine writes content that no visitor and no crawler can ever see

**Status:** FIXED — commit `bf936c08` (prerender + sitemap + hub, mutation-proved)
**Date:** 2026-09-30
**Discovered by:** Hermes (Sabretooth), while checking whose untracked files were in the tree
**Severity:** High — 34 cycles of organic-acquisition content had produced zero measurable SEO value

## Resolution

`domains/youandinotai.com/frontend/build_blog_static.py` prerenders each markdown post
into a self-contained `public/blog/<slug>/index.html`, plus a `public/blog/index.html`
hub for `/blog/` and a real `public/sitemap.xml`. It runs as part of `npm run build`
ahead of `vite build`, so any deploy regenerates the lot; `npm run blog:check` verifies
it and exits 1 on regressions.

Verified after the fix by serving `public/` over HTTP and reading the response:
`/blog/safe-online-dating/` returned **1660 characters of visible text, exactly one
`<h1>`, no `<div id="root">`, canonical present** — against 0 characters before.
Screenshots: `blog-prerender-proof.png`, `blog-hub-proof.png`.

The checker was mutation-proved three ways (post swapped for the SPA shell, sitemap
deleted, article body stripped); each is caught and exits 1, while a clean tree exits 0.

## What was true (the original defect)

`ops/growth-engine/seo_blog_engine.py` runs on a cron every 240 minutes ("24/7 SEO Blog
Engine", job `52a517af3e35`, 34 completed cycles, last run 2026-09-30 09:33 local, status
`ok`). Each cycle writes one markdown article:

```
WROTE C:\ANTIGRAVITY\domains\youandinotai.com\frontend\public\blog\safe-online-dating.md
```

Six such files now exist in `domains/youandinotai.com/frontend/public/blog/`. They are
well-formed and correctly targeted — front-matter with `title`, `description`, `keyword`,
`canonical`, and a body that carries the $1 Bot-Shield product story.

**Not one of them is reachable by any client.**

## The three stacked faults

**Fault 1 — no route in the SPA.**
The frontend is a React SPA whose router has NO `/blog` path and NO catch-all. Twenty
routes exist (`/`, `/login`, `/register`, `/support`, and the `/app/*` surface). A
request for `/blog/<slug>` matches nothing, so `<div id="root">` mounts empty.

Measured live, with JavaScript actually running:

| Page | `document.body.innerText` length | `<h1>` count | `#root` children |
|---|---|---|---|
| `https://youandinotai.com/` | **3307** | 1 (`real people. zero bot noise.`) | 1 |
| `https://youandinotai.com/blog/safe-online-dating` | **0** | 0 | **0** |

A full-page screenshot of the blog URL is a blank cream field. The homepage renders fine,
so this is not a site outage and not a slow-render artifact — the blog URL specifically
renders nothing.

**Fault 2 — the raw `.md` is not served either.**
`nginx.conf.template` line 28 is `try_files $uri $uri/ /index.html;`. Every unmatched path
is quietly rewritten to the SPA shell and served `200`. So `/blog/safe-online-dating.md`
returns 200 with the **SPA HTML**, not the file. Confirmed: the response body contains
`<!doctype html>` and zero occurrences of the article's own text. The article text is
absent from all three possible delivery paths:

```
live HTML  : 0 matches
live .md   : 0 matches
SPA bundle : 0 matches   (assets/index-C0bPVwLZ.js, 817 KB)
```

**Fault 3 — nothing is committed or built.**
The engine only writes files. `grep` for `git`/`commit`/`subprocess` in the engine returns
nothing. Five of the six files are **untracked** in git; the only commit touching that
directory is `bc3f7637`, which added the engine itself. So even if the SPA had a blog
route, the content would not be in a build.

## Consequence

All blog URLs return **200 OK** while serving nothing. Any status-code check — a monitor,
a health cron, a link checker — reports these pages green. That is worse than a 404:
a 404 is honest, and a monitor catches it. This returns 200 and renders a blank page.

There is no `sitemap.xml` either — that path also falls through to the SPA shell — so there
is no channel by which any crawler could discover these URLs.

Worse, the site **advertises** the missing sitemap. `https://youandinotai.com/robots.txt`
serves real content (it is a real file) and its last line is:

```
Sitemap: https://youandinotai.com/sitemap.xml
```

That URL returns `200` with a `0`-byte body and a `<!doctype html>` payload — the SPA shell,
not a sitemap. So every crawler that obeys robots.txt is being directed to a resource that
does not exist and cannot be parsed. `robots.txt` works, `sitemap.xml` is a phantom, and
nothing in the system reports an error for either.

## What fixes it (not done; Joshua's call on priority)

The narrowest fix is a prerender/SSG step at build time: render each `public/blog/*.md`
into a static `blog/<slug>/index.html` that nginx serves directly ahead of the
`try_files` catch-all, plus a generated `sitemap.xml`. That keeps the SPA untouched and
makes the content visible to crawlers and to visitors without JS. Markdown → HTML must
happen at build, because nginx serving `.md` as `text/html` would not give a crawler a
document it can index.

Alternative, larger: add a real `/blog/:slug` route plus prerendering. Slower to land and
it re-couples marketing content to the app bundle.

## Evidence handles

- Cron job: `~/AppData/Local/hermes/cron/jobs.json` → id `52a517af3e35`, 34 completed,
  last run `2026-09-30T09:33:53-04:00`, `last_status: ok`
- Cron output: `~/AppData/Local/hermes/cron/output/52a517af3e35/2026-09-30_09-33-52.md`
- Engine: `ops/growth-engine/seo_blog_engine.py` (writes `path.write_text(article(...))`,
  prints `WROTE {path}`; no git anywhere in the file)
- Catch-all: `domains/youandinotai.com/frontend/nginx.conf.template` line 28
- Router: `domains/youandinotai.com/frontend/src/` — 20 routes, no `/blog`, no catch-all
- Live measurements taken 2026-09-30 ~13:46 UTC with Playwright (JS executing) and curl
- Screenshot of the blank render: committed alongside this note
