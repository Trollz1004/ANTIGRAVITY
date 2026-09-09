# Until No Kid In Need — landing page

A single-file static landing page (`index.html`) for the "Until No Kid In Need" mission
brand, operated by Trash or Treasure Online Recycler LLC. It introduces the mission and
links out to the family of platforms (Online Recycle, AI Solutions Store, DREAM Online)
and to the public Open Collective page.

No build step. No frameworks. No CDN scripts. The only external requests are to
`fonts.googleapis.com` / `fonts.gstatic.com`, and every font declaration has a real
system-font fallback stack in case those don't load.

## Files

- `index.html` — the entire page (inline CSS + JS).
- `CNAME` — `untilnokidinneed.com`, for GitHub Pages custom-domain support.
- `README.md` — this file.

## Deploying to GitHub Pages

1. Push this directory's contents to the root of a dedicated repo (e.g.
   `Trollz1004/untilnokidinneed`), or to a `gh-pages` branch of an existing repo.
2. In the repo, go to **Settings → Pages**, set the source to the branch/folder
   containing `index.html` and `CNAME` (root, or `/docs` if you prefer that layout).
3. GitHub Pages reads the `CNAME` file automatically once the custom domain is
   configured in the Pages settings — it doesn't need to be committed to two places,
   but leaving it in the repo keeps the setting sticky across re-deploys.
4. Confirm HTTPS is enforced once the certificate provisions (can take a few minutes
   to a few hours after DNS is correct).

## Deploying to Cloudflare Pages

1. Connect the repo in the Cloudflare dashboard (**Workers & Pages → Create → Pages →
   Connect to Git**).
2. Framework preset: **None**. Build command: none. Output directory: `/` (or wherever
   `index.html` lives if you nest it).
3. Add `untilnokidinneed.com` as a custom domain under the Pages project's
   **Custom domains** tab. Cloudflare will offer to manage DNS for you if the zone is
   already on Cloudflare; otherwise it gives you the target to point at.
4. Do **not** commit the `CNAME` file's presence as a GitHub-Pages-only artifact — it's
   harmless on Cloudflare Pages (ignored), so the same repo can serve either host.

## DNS records needed

The domain `untilnokidinneed.com` currently sits at **IONOS**. To point it at either
host, the DNS records need to be changed at the IONOS registrar/DNS panel (or the zone
needs to be delegated elsewhere, e.g. to Cloudflare, if going the Cloudflare Pages route).

- **GitHub Pages (apex domain):**
  - `A` records for `@` → GitHub Pages' current IP set (look up the current four IPs in
    GitHub's Pages documentation at deploy time — they do change occasionally).
  - `AAAA` records for `@` → GitHub Pages' current IPv6 set, same caveat.
  - `CNAME` for `www` → `trollz1004.github.io.`
- **Cloudflare Pages:**
  - `CNAME` for `@` (Cloudflare supports CNAME flattening at the apex) or `www` →
    the `<project>.pages.dev` hostname Cloudflare gives you, per its custom-domain
    instructions.

Whichever host is chosen, only one should hold the live DNS records at a time to avoid
a split/flapping domain.

## Facts still needing Joshua's confirmation

- [ ] Which host (GitHub Pages vs. Cloudflare Pages) is the intended long-term home for
      `untilnokidinneed.com`.
- [ ] Whether `onlinerecycle.net`, `ai-solutions.store`, and `dream-online.net` should
      all link back to this page, or whether cross-linking should go the other way too.
- [ ] How the mission is funded is described only by linking to the Open Collective ledger — no allocation wording on this page (repo canonical-guard rule)
      (this draft deliberately omits one, per instructions).
- [ ] Whether `untilnokidinneed.org` / `.online` / `.store` should redirect to
      `.com`, or serve separate content.
- [ ] Contact/support email or form, if one should be added later.
