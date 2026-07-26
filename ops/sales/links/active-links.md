# Active links

All distributed checkout links MUST carry `?ref=clean-repo` (+utm) for attribution.

| Updated | Channel | Campaign | Product URL | Checkout URL (with ref) |
|---------|---------|----------|-------------|--------------------------|
| 2026-07-23 | No-login (repo README) | Founding Member | https://youandinotai.com | https://square.link/u/cxwjcn0s?ref=clean-repo&utm_source=clean-repo&utm_medium=web&utm_campaign=founding |
| 2026-07-23 | No-login (repo README) | Bot-Shield $1 | https://youandinotai.com | https://square.link/u/Qc5mxUy7?ref=clean-repo&utm_source=clean-repo&utm_medium=web&utm_campaign=founding |
| 2026-07-23 | Frontend (constants.ts) | 3-Month Prepaid | https://youandinotai.com | https://square.link/u/oY7qEfRM?ref=clean-repo&utm_source=clean-repo&utm_medium=web&utm_campaign=founding |
| 2026-07-23 | Frontend (constants.ts) | 12-Month Prepaid | https://youandinotai.com | https://square.link/u/6GHpbvvl?ref=clean-repo&utm_source=clean-repo&utm_medium=web&utm_campaign=founding |
| 2026-07-23 | Frontend (constants.ts) | Royalty Card | https://youandinotai.com | https://square.link/u/CafhorUS?ref=clean-repo&utm_source=clean-repo&utm_medium=web&utm_campaign=founding |

## Public no-login surfaces
- **https://trollz1004.github.io/youandinotai-join/** → **200 LIVE** (public GitHub Pages, no login required)
  - Serves all 5 ref-tagged Square links (grep=5 `ref=clean-repo` hits confirmed on live HTML)
  - Source: public repo https://github.com/Trollz1004/youandinotai-join (private `clean` repo stays private)
  - Traffic (GitHub API, 14d as of tick #12): 0 views / 0 uniques / 0 referrers
- **https://gist.github.com/Trollz1004/5b471b3a62bbac134977b0f534a8b1d5** → **200 LIVE** (public Gist, tick #12)
  - Raw serves ref-tagged Founding + Bot-Shield Square links (grep=2 `ref=clean-repo`)
- **https://github.com/Trollz1004/youandinotai-join** → **200 LIVE** (public repo landing page, no login; tick #15)
  - README now serves ref-tagged Founding + Bot-Shield Square links (grep=2 `ref=clean-repo`, commit 8c44b5a on `master`)
- **SEO (tick #14):** `robots.txt`=200 LIVE + `sitemap.xml`=200 LIVE at trollz1004.github.io/youandinotai-join/ (commit 79d1d58) — search engines can now crawl/index the no-login surface for organic discovery.

## Live-link verification (this tick — #84, 2026-07-24)
- `square.link/u/cxwjcn0s` → **303** → checkout.square.site/merchant/ML3C7FMTQS5KX/order/... (LIVE)
- `square.link/u/Qc5mxUy7` → **303** → checkout.square.site/merchant/ML3C7FMTQS5KX/order/... (LIVE)
- `https://youandinotai.com` → **200** (public surface LIVE)

## Attribution caveat
Square short links (`square.link/u/*`) 303-redirect to `checkout.square.site` and may strip
appended query params. `?ref=clean-repo` therefore guarantees intent-tagging at distribution
but does NOT by itself guarantee Square-side attribution. True conversion proof requires a
Square Dashboard order/payment record or a webhook/log reachable without secrets.

Last verified: 2026-07-25 (tick #102) — cxwjcn0s=303, Qc5mxUy7=303, Pages=200 (5 ref links), youandinotai.com=200, IndexNow=200, traffic 14d: 0 views / 0 uniques / no referrers
| 2026-07-24 (tick #85) | no-login (Pages/site) | Founding Member Launch | https://trollz1004.github.io/youandinotai-join/ | https://square.link/u/cxwjcn0s?ref=clean-repo (303 LIVE) / https://square.link/u/Qc5mxUy7?ref=clean-repo (303 LIVE) |

Last verified: 2026-07-24 (tick #86) — Founding cxwjcn0s=303, Bot-Shield Qc5mxUy7=303, Pages=200 (5 ref links), youandinotai.com=200, IndexNow POST=200.

Last verified: 2026-07-24 (tick #87) — Founding cxwjcn0s=303, Bot-Shield Qc5mxUy7=303, Pages=200 (5 ref links), youandinotai.com=200, IndexNow POST=200, traffic 14d=0/0.
Last verified: 2026-07-24 (tick #88) — Founding cxwjcn0s=303, Bot-Shield Qc5mxUy7=303, Pages=200 (5 ref links), youandinotai.com=200, IndexNow POST=200, traffic 14d=0/0.
Last verified: 2026-07-24 (tick #89) — Founding cxwjcn0s=303, Bot-Shield Qc5mxUy7=303, Pages=200 (5 ref links), youandinotai.com=200, IndexNow POST=200, traffic 14d=0/0.
Last verified: 2026-07-24 (tick #90) — Founding cxwjcn0s=303, Bot-Shield Qc5mxUy7=303, Pages=200 (5 ref links), youandinotai.com=200, IndexNow POST=200, traffic 14d=0/0.
Last verified: 2026-07-25 (tick #93) — Founding cxwjcn0s=303, Bot-Shield Qc5mxUy7=303, Pages=200 (5 ref links), youandinotai.com=200, IndexNow POST=200, traffic 14d=0/0.
Last verified: 2026-07-25 (tick #94) — Founding cxwjcn0s=303, Bot-Shield Qc5mxUy7=303, Pages=200 (5 ref links), youandinotai.com=200, IndexNow POST=200, traffic 14d=0/0.
Last verified: 2026-07-25 (tick #96) — Founding cxwjcn0s=303, Bot-Shield Qc5mxUy7=303, Pages=200 (5 ref links), youandinotai.com=200, IndexNow POST=200, traffic 14d=0/0.

Last verified: 2026-07-25 (tick #97) — Founding cxwjcn0s=303, Bot-Shield Qc5mxUy7=303, Pages=200 (5 ref links), youandinotai.com=200, IndexNow POST=200, traffic 14d=0/0.
Last verified: 2026-07-25 (tick #98) — Founding cxwjcn0s=303, Bot-Shield Qc5mxUy7=303, Pages=200 (5 ref links), youandinotai.com=200, IndexNow POST=200, traffic 14d=0/0.
Last verified: 2026-07-25 (tick #99) — Founding cxwjcn0s=303, Bot-Shield Qc5mxUy7=303, Pages=200 (5 ref links), youandinotai.com=200, IndexNow POST=200, traffic 14d=0/0.
Last verified: 2026-07-25 (tick #100) — Founding cxwjcn0s=303, Bot-Shield Qc5mxUy7=303, Pages=200 (5 ref links), youandinotai.com=200, IndexNow POST=200, traffic 14d=0/0.
Last verified: 2026-07-25 (tick #101) — Founding cxwjcn0s=303, Bot-Shield Qc5mxUy7=303, Pages=200 (5 ref links), youandinotai.com=200, IndexNow POST=200, traffic 14d=0/0.
Last verified: 2026-07-25 (tick #103) — Founding cxwjcn0s=303, Bot-Shield Qc5mxUy7=303, Pages=200 (5 ref links), youandinotai.com=200, IndexNow POST=200, traffic 14d=0/0.
Last verified: 2026-07-25 (tick #104) — Founding cxwjcn0s=303, Bot-Shield Qc5mxUy7=303, Pages=200 (5 ref links), youandinotai.com=200, IndexNow POST=200, traffic 14d=0/0.
Last verified: 2026-07-25 (tick #105) — Founding cxwjcn0s=303, Bot-Shield Qc5mxUy7=303, Pages=200 (5 ref links), youandinotai.com=200, IndexNow POST=200, traffic 14d=0/0, referrers=[].
