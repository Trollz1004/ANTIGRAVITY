# Fable-Tier SEO — 15-Account Syndication Layer

> Joshua's directive, verbatim: "its 5 seperate blogg accounts posting their
> own 5 seperate blogs on each paperclip thats 15 seo posting agents needed
> automated on 15 accounts thats how you SEO."

Three brands x five syndication platforms each = 15 accounts, 15 posting
lanes. Each brand's own site publishes a post first, at its canonical URL;
the 15 syndicated copies each point their canonical tag back at that one URL
so search engines credit the brand site, not the syndication platform, while
the platform account still earns its own inbound-link and discovery value.

Brands:

| Code | Brand | Site | Draft source (do not touch — other agents write here) |
|---|---|---|---|
| DRE | DREAM Online | dream-online.net | `D:\CLAUDE's-N-Joshua's-Dream-Online-MMORPG\docs\blog\` |
| AIS | Ai-Solutions.Store | ai-solutions.store | `C:\Ai-Solutions.store\blog\` |
| ANT | YouAndINotAI | youandinotai.com | `C:\ANTIGRAVITY\content\blog\youandinotai\` |

Frontmatter shape observed in existing drafts (confirmed by sampling one file
per brand): `title, slug, description, keywords, date, author, canonical`.
`post.mjs` refuses to publish any draft missing `canonical` or `slug`.

## Platform selection

The brief asked for 5 platforms per brand chosen from those with a usable
write API **today**. Candidates considered, and the call on each:

| Platform | Verdict | Why |
|---|---|---|
| **Dev.to** | IN — VERIFIED | Simple API-key auth, `POST /api/articles`, native `canonical_url` field. Doc: https://developers.forem.com/api/v1#tag/articles/operation/createArticle |
| **Hashnode** | IN — VERIFIED | Personal Access Token, GraphQL `publishPost` mutation, native `originalArticleURL` field (their name for canonical). Doc: https://apidocs.hashnode.com/ |
| **WordPress.com** | IN — VERIFIED (post), UNVERIFIED (canonical) | OAuth2 bearer, `POST /rest/v1.1/sites/{site}/posts/new` reliably creates posts. Doc: https://developer.wordpress.com/docs/api/1.1/post/sites/%24site/posts/new/ — but that endpoint has **no native canonical field**. True cross-domain `rel=canonical` needs Yoast SEO or Jetpack SEO tools active on the site (Business-plan territory) exposing a meta endpoint we have not provisioned. Honest fallback implemented: `post.mjs` appends a visible "Originally published at `<canonical>`" link in the post body. That is real, working, and NOT the same as a `<link rel="canonical">` tag — documented as UNVERIFIED for true canonical enforcement. |
| **Tumblr** | IN — VERIFIED (post), UNVERIFIED (canonical) | OAuth 1.0a, `POST /v2/blog/{blog-identifier}/post`. Doc: https://www.tumblr.com/docs/en/api/v2#post--createreblog-legacy-postspublish-a-new-blog-post-legacy. `source_url` is a real parameter, but it is Tumblr's *source-attribution* field for reblogged media posts, not a rendered `rel=canonical` tag for text posts — used here as the honest best-effort canonical signal. |
| **Blogger** | IN — VERIFIED (post), UNVERIFIED (canonical) | Google OAuth2, `POST /v3/blogs/{blogId}/posts`. Doc: https://developers.google.com/blogger/docs/3.0/reference/posts/insert. No canonical field in the API; Blogger's own templates self-canonical every post. Same honest fallback as WordPress: an in-body attribution link. |
| **Ghost** | OUT of the 15 (adapter still built) | Admin API JWT auth, `canonical_url` is a genuine, documented field: https://ghost.org/docs/admin-api/#posts. VERIFIED as an API, but no brand currently has a provisioned Ghost instance (self-hosted or Ghost(Pro)) to post into. `post.mjs --platform ghost` is implemented and ready the day a `SEO_<BRAND>_GHOST_API_URL` exists; it is not one of the 15 live accounts. |
| **Medium** | EXCLUDED | Medium's public integration-token API has been closed to new tokens for most accounts since 2023 (`https://github.com/Medium/medium-api-docs` — issues confirm no new tokens are issued). Marked UNVERIFIED / likely unavailable per the brief; not built as a live lane. |
| **Substack** | EXCLUDED | No public write API exists for creating posts programmatically. |
| **LinkedIn** | EXCLUDED | The Marketing/Share API requires a reviewed partner app with `w_member_social` access; it is not self-serve for arbitrary third-party blog syndication, so it does not meet "usable write API today" for this build. |

**The 5 in production: Dev.to, Hashnode, WordPress.com, Tumblr, Blogger** —
identical set for all three brands, per the brief ("same 5 platforms for all
3 brands is fine").

## The 15-account matrix

| Brand | Platform | Account handle to create | Env vars |
|---|---|---|---|
| DRE | Dev.to | `dreamonline` | `SEO_DRE_DEVTO_TOKEN` |
| DRE | Hashnode | `dreamonline` (dreamonline.hashnode.dev) | `SEO_DRE_HASHNODE_TOKEN`, `SEO_DRE_HASHNODE_PUBLICATION_ID` |
| DRE | WordPress.com | `dreamonlinemmo` | `SEO_DRE_WORDPRESS_TOKEN`, `SEO_DRE_WORDPRESS_SITE` |
| DRE | Tumblr | `dream-online-mmo` | `SEO_DRE_TUMBLR_CONSUMER_KEY`, `SEO_DRE_TUMBLR_CONSUMER_SECRET`, `SEO_DRE_TUMBLR_TOKEN`, `SEO_DRE_TUMBLR_TOKEN_SECRET`, `SEO_DRE_TUMBLR_BLOG_ID` |
| DRE | Blogger | `dreamonlinemmo` | `SEO_DRE_BLOGGER_TOKEN`, `SEO_DRE_BLOGGER_BLOG_ID` |
| AIS | Dev.to | `aisolutionsstore` | `SEO_AIS_DEVTO_TOKEN` |
| AIS | Hashnode | `aisolutionsstore` | `SEO_AIS_HASHNODE_TOKEN`, `SEO_AIS_HASHNODE_PUBLICATION_ID` |
| AIS | WordPress.com | `aisolutionsstore` | `SEO_AIS_WORDPRESS_TOKEN`, `SEO_AIS_WORDPRESS_SITE` |
| AIS | Tumblr | `ai-solutions-store` | `SEO_AIS_TUMBLR_CONSUMER_KEY`, `SEO_AIS_TUMBLR_CONSUMER_SECRET`, `SEO_AIS_TUMBLR_TOKEN`, `SEO_AIS_TUMBLR_TOKEN_SECRET`, `SEO_AIS_TUMBLR_BLOG_ID` |
| AIS | Blogger | `aisolutionsstore` | `SEO_AIS_BLOGGER_TOKEN`, `SEO_AIS_BLOGGER_BLOG_ID` |
| ANT | Dev.to | `youandinotai` | `SEO_ANT_DEVTO_TOKEN` |
| ANT | Hashnode | `youandinotai` | `SEO_ANT_HASHNODE_TOKEN`, `SEO_ANT_HASHNODE_PUBLICATION_ID` |
| ANT | WordPress.com | `youandinotai` | `SEO_ANT_WORDPRESS_TOKEN`, `SEO_ANT_WORDPRESS_SITE` |
| ANT | Tumblr | `youandinotai` | `SEO_ANT_TUMBLR_CONSUMER_KEY`, `SEO_ANT_TUMBLR_CONSUMER_SECRET`, `SEO_ANT_TUMBLR_TOKEN`, `SEO_ANT_TUMBLR_TOKEN_SECRET`, `SEO_ANT_TUMBLR_BLOG_ID` |
| ANT | Blogger | `youandinotai` | `SEO_ANT_BLOGGER_TOKEN`, `SEO_ANT_BLOGGER_BLOG_ID` |

(36 env vars total across the 15 accounts — Tumblr needs 5 each, Hashnode and
WordPress need 2 each, Dev.to needs 1 each, Blogger needs 2 each: (1+2+2+5+2)
x 3 brands = 36. All 36 placeholder names were appended to `.env`; see bottom
of this doc.)

## Canonical rule

1. The brand's own site publishes the post first, at `https://<brand-domain>/blog/<slug>`. That URL is what goes in the draft's `canonical:` frontmatter field.
2. Every syndicated copy is told to use that exact URL as its canonical reference:
   - Dev.to, Hashnode, Ghost: a genuine API field (`canonical_url` / `originalArticleURL`) — search engines see the real tag. VERIFIED.
   - WordPress.com, Tumblr, Blogger: no genuine field exists via the plain API. `post.mjs` uses the platform's closest built-in hook where one exists (Tumblr's `source_url`) and otherwise appends a visible "Originally published at" link. This reduces but does not eliminate duplicate-content risk — documented here as UNVERIFIED, not glossed over.
3. `post.mjs` refuses to run at all if a draft's frontmatter lacks `canonical`.

## Cadence

- One post per platform per account per day, maximum.
- Within a brand, platforms are staggered 30-60 minutes apart.
- Across all 15 rows, no two share the same minute (see `docs/seo/schedule.json`).
- Default schedule (24h local time):

  | Time | Brand/Platform |
  |---|---|
  | 09:00 | DRE/devto |
  | 09:15 | AIS/devto |
  | 09:30 | ANT/devto |
  | 09:45 | DRE/hashnode |
  | 10:00 | AIS/hashnode |
  | 10:15 | ANT/hashnode |
  | 10:30 | DRE/wordpress |
  | 10:45 | AIS/wordpress |
  | 11:00 | ANT/wordpress |
  | 11:15 | DRE/tumblr |
  | 11:30 | AIS/tumblr |
  | 11:45 | ANT/tumblr |
  | 12:00 | DRE/blogger |
  | 12:15 | AIS/blogger |
  | 12:30 | ANT/blogger |

- `schedule.mjs` is meant to run once an hour and fires whatever rows fall in
  that hour. Windows Task Scheduler line (documented only, not executed):

  ```
  schtasks /Create /TN "FableTierSEO-Hourly" /TR "node C:\ANTIGRAVITY\scripts\seo\schedule.mjs" /SC HOURLY /ST 00:00 /F
  ```

## UTM parameters

Applied to a "Read more at `<brand>`" link appended inside each syndicated
copy's body (never on the `canonical_url` field itself — canonical URLs stay
clean for SEO purposes):

- `utm_source=<platform>` (`devto`, `hashnode`, `wordpress`, `tumblr`, `blogger`)
- `utm_medium=syndication`
- `utm_campaign=seo15`
- `utm_content=<brand>-<slug>`

## Definition of done

A post is "done" when:

1. The platform API returns 2xx and a URL for the created post (or `(unknown — check platform dashboard)` if the platform's response shape omits one).
2. That result is appended as one line to `docs/seo/published.jsonl`:
   `{"brand":"dre","platform":"devto","slug":"...","url":"...","timestamp":"..."}`
3. Future runs check that ledger and refuse to re-post the same
   `brand + platform + slug` triple.

## How a Paperclip "process" agent invokes this

See `scripts/seo/README.md` for the full CLI contract and exit codes. In
short: one Paperclip routine per account (15 total, or one per brand running
`--all-new` across its 5 platforms), invoking `post.mjs`, reading its exit
code, and treating anything other than `0` as "needs attention" rather than
silently retrying — exit `3` in particular means a credential still needs to
be filled in and rotated in, not retried.

## Env vars appended to `.env`

Names only, values left blank for Joshua to fill in via the normal secrets
import path (`ops/paperclip/import-env-secrets.py`). No secret was printed or
hardcoded anywhere in this build.
