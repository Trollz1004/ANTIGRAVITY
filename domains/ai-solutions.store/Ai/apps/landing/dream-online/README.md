# DREAM Online — landing page

A single-file static landing page (`index.html`) for DREAM Online, an open-world MMO in
development. It covers the current design pillars, what's actively being worked on, and
how to follow development or back it — without inventing a release date, price, or
player count.

No build step. No frameworks. No CDN scripts. The only external requests are to
`fonts.googleapis.com` / `fonts.gstatic.com`, and every font declaration has a real
system-font fallback stack in case those don't load.

## Domain note

Joshua referred to the domain verbally as `dreamonline.net`, but the domain actually
registered in his panel is **`dream-online.net`** (hyphenated). The `CNAME` file here
uses the hyphenated, registered domain. If a matching `dreamonline.net` is ever
registered too, it should redirect to the hyphenated domain rather than serve a
duplicate copy of this page.

## Crowdfunding link

The "Back development" / "Support development" buttons both point at one JavaScript
constant, `CROWDFUND_URL`, defined near the bottom of `index.html`:

```js
var CROWDFUND_URL = "https://opencollective.com/until-no-kid-in-need";
```

It currently points at the shared family Open Collective (`until-no-kid-in-need`)
because DREAM Online doesn't have its own collective yet. When one exists, change this
one line and both links update.

## Files

- `index.html` — the entire page (inline CSS + JS).
- `CNAME` — `dream-online.net`, for GitHub Pages custom-domain support.
- `README.md` — this file.

## Deploying to GitHub Pages

1. Push this directory's contents to the root of a dedicated repo (e.g.
   `Trollz1004/dream-online-site`, distinct from the `dream-online` code repo unless
   you intend to serve the site from a `gh-pages` branch of that same repo), or to a
   `gh-pages` branch of an existing repo.
2. In the repo, go to **Settings → Pages**, set the source to the branch/folder
   containing `index.html` and `CNAME`.
3. GitHub Pages reads the `CNAME` file automatically once the custom domain is
   configured in the Pages settings.
4. Confirm HTTPS is enforced once the certificate provisions.

## Deploying to Cloudflare Pages

1. Connect the repo in the Cloudflare dashboard (**Workers & Pages → Create → Pages →
   Connect to Git**).
2. Framework preset: **None**. Build command: none. Output directory: `/` (or wherever
   `index.html` lives if nested).
3. Add `dream-online.net` as a custom domain under the Pages project's **Custom
   domains** tab.
4. The `CNAME` file is harmless (ignored) on Cloudflare Pages, so the same repo can
   serve either host without changes.

## DNS records needed

The domain `dream-online.net` currently sits at **IONOS**. To point it at either host,
DNS needs to change at the IONOS registrar/DNS panel (or the zone needs to be delegated
elsewhere, e.g. to Cloudflare, for the Cloudflare Pages route).

- **GitHub Pages (apex domain):**
  - `A` records for `@` → GitHub Pages' current IP set (check GitHub's Pages docs at
    deploy time — the IPs are stable but do change occasionally).
  - `AAAA` records for `@` → GitHub Pages' current IPv6 set.
  - `CNAME` for `www` → `trollz1004.github.io.`
- **Cloudflare Pages:**
  - `CNAME` for `@` (via CNAME flattening) or `www` → the `<project>.pages.dev`
    hostname Cloudflare provides, per its custom-domain instructions.

Only one host should hold the live DNS records at a time.

## Facts still needing Joshua's confirmation

- [ ] Confirm `dream-online.net` (hyphenated) is in fact the domain in his registrar
      panel, and that `dreamonline.net` either isn't registered or should redirect here.
- [ ] Which host (GitHub Pages vs. Cloudflare Pages) is the intended long-term home.
- [ ] Whether DREAM Online should get its own Open Collective, at which point
      `CROWDFUND_URL` in `index.html` should be updated.
- [ ] Whether any of the named internal design canon (companion-sphere lore, named
      NPCs, anti-cheat lore, in-game currency name) is ready to appear in public copy —
      this draft intentionally kept those out and described systems generically.
- [ ] Whether a press kit, screenshots, or concept art exist yet to add visual interest
      beyond the current text-only layout.
- [ ] Contact/support email or a "join the community" link (Discord, etc.), if one
      should be added.
