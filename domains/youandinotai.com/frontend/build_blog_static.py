#!/usr/bin/env python3
"""Prerender public/blog/*.md into static HTML that crawlers can actually read.

WHY THIS EXISTS
---------------
`ops/growth-engine/seo_blog_engine.py` writes one markdown post per cycle into
`public/blog/`. Nothing ever turned those into HTML. The frontend is a React SPA
with no `/blog` route and no catch-all, and nginx's `try_files $uri $uri/ /index.html`
rewrites every unmatched path to the SPA shell with HTTP 200. So every post URL
returned 200 while serving an empty `<div id="root">` — measured: 0 characters of
`innerText`, 0 `<h1>` elements — and the post text appeared in none of the three
delivery paths (live HTML, raw .md, SPA bundle). Crawlers saw nothing. Six posts
and 34 engine cycles produced zero organic value.

WHAT IT DOES
------------
For each `public/blog/<slug>.md`:
  * parse the YAML-ish front matter (title, description, date, keyword, canonical)
  * convert the body's simple markdown to HTML
  * write `public/blog/<slug>/index.html` — a complete standalone document, so
    `/blog/<slug>/` serves real content and no JavaScript is required

Then write `public/sitemap.xml` listing every post, because `robots.txt` already
advertises that URL and it currently 404s into the SPA shell.

Runs automatically as part of `npm run build` (see package.json).

Deliberately dependency-free: the posts use only h1/h2, ordered lists, plain
paragraphs and bare URLs, so a small converter is more predictable than adding a
markdown library to the frontend bundle.

Usage:
    python build_blog_static.py           # generate
    python build_blog_static.py --check   # verify, exit 1 if not generated
"""
from __future__ import annotations

import argparse
import html
import json
import os
import re

HERE = os.path.dirname(os.path.abspath(__file__))
PUBLIC = os.path.join(HERE, "public")
BLOG_DIR = os.path.join(PUBLIC, "blog")
CITIES_DIR = os.path.join(PUBLIC, "cities")

SITE = "https://youandinotai.com"
BRAND = "YouAndINotAI"
TAGLINE = "Human Connection. No Bot Noise."

# The site palette, taken from the live CSS.
ORANGE = "#ff4f00"
BLACK = "#111111"
CREAM = "#fffaf2"

FRONT_MATTER = re.compile(r"^---\s*\n(.*?)\n---\s*\n", re.DOTALL)
MD_LINK_RE = re.compile(r"\[([^\]]+)\]\((https?://[^\s)]+|/[^\s)]*)\)")
URL_RE = re.compile(r"(?<![\"'>=])(https?://[^\s<>\"']+[^\s<>\"'.,;:)])")
ORDERED_RE = re.compile(r"^\s*(\d+)\.\s+(.*)$")


def parse_front_matter(text: str) -> tuple[dict[str, str], str]:
    """Split a post into its front matter and body.

    Only the flat `key: "value"` shape the engine emits is supported; anything
    more complex is left in the body rather than guessed at.
    """
    m = FRONT_MATTER.match(text)
    if not m:
        return {}, text

    meta: dict[str, str] = {}
    for line in m.group(1).splitlines():
        if ":" not in line:
            continue
        key, _, value = line.partition(":")
        value = value.strip().strip('"').strip("'")
        if key.strip():
            meta[key.strip()] = value
    return meta, text[m.end():]


def slug_from_filename(name: str) -> str:
    return name[:-3] if name.endswith(".md") else name


def inline(text: str) -> str:
    """Escape, then convert markdown [label](url) links and bare URLs into anchors."""
    escaped = html.escape(text, quote=False)

    def md_link(m: re.Match[str]) -> str:
        label = m.group(1)
        raw_url = html.unescape(m.group(2))
        safe_url = raw_url.replace('"', "%22")
        if raw_url.startswith("/register?"):
            return f'<a class="cta-button" role="button" href="{safe_url}">{label}</a>'
        return f'<a href="{safe_url}">{label}</a>'

    escaped = MD_LINK_RE.sub(md_link, escaped)

    def link(m: re.Match[str]) -> str:
        url = m.group(1)
        return f'<a href="{url}">{url}</a>'

    return URL_RE.sub(link, escaped)


def render_body(body: str) -> str:
    """Convert the post body to HTML.

    Supports what the engine actually writes: `# `, `## `, `1. ` lists, and
    paragraphs. Everything else is emitted as a paragraph so no text is dropped —
    losing text silently is worse than rendering it plainly.
    """
    out: list[str] = []
    para: list[str] = []
    items: list[str] = []

    def flush_para() -> None:
        if para:
            out.append(f"<p>{inline(' '.join(para))}</p>")
            para.clear()

    def flush_list() -> None:
        if items:
            lis = "".join(f"<li>{inline(i)}</li>" for i in items)
            out.append(f"<ol>{lis}</ol>")
            items.clear()

    for raw in body.splitlines():
        line = raw.rstrip()
        if not line.strip():
            flush_para()
            flush_list()
            continue

        ordered = ORDERED_RE.match(line)
        if ordered:
            flush_para()
            items.append(ordered.group(2).strip())
            continue

        flush_list()

        if line.startswith("### "):
            flush_para()
            out.append(f"<h3>{inline(line[4:].strip())}</h3>")
        elif line.startswith("## "):
            flush_para()
            out.append(f"<h2>{inline(line[3:].strip())}</h2>")
        elif line.startswith("# "):
            flush_para()
            out.append(f"<h1>{inline(line[2:].strip())}</h1>")
        else:
            para.append(line.strip())

    flush_para()
    flush_list()
    return "\n".join(out)


def page(meta: dict[str, str], body_html: str, canonical: str) -> str:
    title = meta.get("title") or "Untitled"
    description = meta.get("description") or ""
    post_date = meta.get("date") or "2026-10-01"
    og_image = f"{SITE}/og-image.png"
    og_image_alt = "YouAndINotAI 18+ verified-human dating and social platform with $1 Bot-Shield check"
    ld_json = json.dumps(
        {
            "@context": "https://schema.org",
            "@type": "BlogPosting",
            "headline": title,
            "description": description,
            "datePublished": post_date,
            "mainEntityOfPage": canonical,
            "author": {"@type": "Organization", "name": BRAND, "url": f"{SITE}/"},
            "publisher": {
                "@type": "Organization",
                "name": BRAND,
                "url": f"{SITE}/",
                "logo": {"@type": "ImageObject", "url": f"{SITE}/logo.png"},
            },
        },
        ensure_ascii=False,
    )

    return f"""<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>{html.escape(title)} | {BRAND}</title>
    <meta name="description" content="{html.escape(description, quote=True)}" />
    <link rel="canonical" href="{canonical}" />
    <meta property="og:type" content="article" />
    <meta property="og:site_name" content="{BRAND}" />
    <meta property="og:title" content="{html.escape(title, quote=True)}" />
    <meta property="og:description" content="{html.escape(description, quote=True)}" />
    <meta property="og:url" content="{canonical}" />
    <meta property="og:image" content="{og_image}" />
    <meta property="og:image:alt" content="{html.escape(og_image_alt, quote=True)}" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="{html.escape(title, quote=True)}" />
    <meta name="twitter:description" content="{html.escape(description, quote=True)}" />
    <meta name="twitter:image" content="{og_image}" />
    <meta name="twitter:image:alt" content="{html.escape(og_image_alt, quote=True)}" />
    <script type="application/ld+json">{ld_json}</script>
    <style>
      :root {{ color-scheme: light; }}
      * {{ box-sizing: border-box; }}
      body {{
        margin: 0; padding: 2.5rem 1.25rem 5rem;
        background: {CREAM}; color: {BLACK};
        font: 17px/1.65 ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, sans-serif;
      }}
      main {{ max-width: 44rem; margin: 0 auto; }}
      .kicker {{
        display: inline-block; margin-bottom: 1.75rem;
        font-weight: 800; letter-spacing: .12em; text-transform: uppercase;
        font-size: .75rem; color: {ORANGE}; text-decoration: none;
      }}
      h1 {{ font-size: 2rem; line-height: 1.2; margin: 0 0 1.25rem; }}
      h2 {{ font-size: 1.3rem; margin: 2.25rem 0 .75rem; }}
      h3 {{ font-size: 1.1rem; margin: 1.75rem 0 .5rem; }}
      p, li {{ margin: 0 0 1rem; }}
      ol {{ padding-left: 1.25rem; }}
      a {{ color: {ORANGE}; overflow-wrap: anywhere; }}
      a.cta-button {{
        display: inline-block; margin-top: .5rem; padding: .8rem 1.4rem;
        background: {ORANGE}; color: {CREAM}; font-weight: 700;
        border-radius: .45rem; text-decoration: none;
      }}
      footer {{
        margin-top: 3rem; padding-top: 1.25rem;
        border-top: 1px solid rgba(17,17,17,.12);
        font-size: .85rem; opacity: .75;
      }}
    </style>
  </head>
  <body>
    <main>
      <a class="kicker" href="/">{BRAND}</a>
      <article>
{body_html}
      </article>
      <footer>{TAGLINE} · <a href="/">youandinotai.com</a></footer>
    </main>
  </body>
</html>
"""


def canonical_for(meta: dict[str, str], slug: str) -> str:
    """Use the post's own canonical when present, else the directory URL.

    The trailing slash matters: nginx's `try_files $uri $uri/index.html $uri/`
    serves `/blog/<slug>/` directly with no redirect, so the canonical should
    name the URL that actually returns 200 without one.
    """
    declared = (meta.get("canonical") or "").strip()
    if declared:
        return declared if declared.endswith("/") else declared + "/"
    return f"{SITE}/blog/{slug}/"


def canonical_for_city(meta: dict[str, str], slug: str) -> str:
    declared = (meta.get("canonical") or "").strip()
    if declared:
        return declared if declared.endswith("/") else declared + "/"
    return f"{SITE}/cities/{slug}/"


def posts() -> list[tuple[str, dict[str, str], str]]:
    if not os.path.isdir(BLOG_DIR):
        return []
    found = []
    for name in sorted(os.listdir(BLOG_DIR)):
        if not name.endswith(".md"):
            continue
        with open(os.path.join(BLOG_DIR, name), encoding="utf-8") as fh:
            meta, body = parse_front_matter(fh.read())
        found.append((slug_from_filename(name), meta, body))
    return found


def cities() -> list[tuple[str, dict[str, str], str]]:
    if not os.path.isdir(CITIES_DIR):
        return []
    found = []
    for name in sorted(os.listdir(CITIES_DIR)):
        if not name.endswith(".md"):
            continue
        with open(os.path.join(CITIES_DIR, name), encoding="utf-8") as fh:
            meta, body = parse_front_matter(fh.read())
        found.append((slug_from_filename(name), meta, body))
    return found


def cities_index(found: list[tuple[str, dict[str, str], str]]) -> str:
    cards = []
    for slug, meta, _body in found:
        title = html.escape(meta.get("title") or slug)
        desc = html.escape(meta.get("description") or "", quote=True)
        cards.append(
            f'      <li><a href="/cities/{slug}/"><strong>{title}</strong></a>'
            f'<span>{desc}</span></li>'
        )

    hub_title = f"Dating Without Bots by City | {BRAND}"
    hub_desc = "City guides on verified human dating, the timed question, the $1 Bot-Shield check, and the USA group chat on YouAndINotAI."
    og_image = f"{SITE}/og-image.png"
    og_image_alt = "YouAndINotAI 18+ verified-human dating and social platform with $1 Bot-Shield check"

    return f"""<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>{html.escape(hub_title)}</title>
    <meta name="description" content="{html.escape(hub_desc, quote=True)}" />
    <link rel="canonical" href="{SITE}/cities/" />
    <meta property="og:type" content="website" />
    <meta property="og:site_name" content="{BRAND}" />
    <meta property="og:title" content="{html.escape(hub_title, quote=True)}" />
    <meta property="og:description" content="{html.escape(hub_desc, quote=True)}" />
    <meta property="og:url" content="{SITE}/cities/" />
    <meta property="og:image" content="{og_image}" />
    <meta property="og:image:alt" content="{html.escape(og_image_alt, quote=True)}" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="{html.escape(hub_title, quote=True)}" />
    <meta name="twitter:description" content="{html.escape(hub_desc, quote=True)}" />
    <meta name="twitter:image" content="{og_image}" />
    <meta name="twitter:image:alt" content="{html.escape(og_image_alt, quote=True)}" />
    <style>
      :root {{ color-scheme: light; }}
      * {{ box-sizing: border-box; }}
      body {{
        margin: 0; padding: 2.5rem 1.25rem 5rem;
        background: {CREAM}; color: {BLACK};
        font: 17px/1.65 ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, sans-serif;
      }}
      main {{ max-width: 44rem; margin: 0 auto; }}
      .kicker {{
        display: inline-block; margin-bottom: 1.75rem;
        font-weight: 800; letter-spacing: .12em; text-transform: uppercase;
        font-size: .75rem; color: {ORANGE}; text-decoration: none;
      }}
      h1 {{ font-size: 2rem; line-height: 1.2; margin: 0 0 1.5rem; }}
      ul {{ list-style: none; padding: 0; }}
      li {{ margin: 0 0 1.5rem; }}
      li a {{ color: {ORANGE}; font-size: 1.1rem; }}
      li span {{ display: block; opacity: .8; }}
      footer {{
        margin-top: 3rem; padding-top: 1.25rem;
        border-top: 1px solid rgba(17,17,17,.12);
        font-size: .85rem; opacity: .75;
      }}
    </style>
  </head>
  <body>
    <main>
      <a class="kicker" href="/">{BRAND}</a>
      <h1>Dating Without Bots by City</h1>
      <ul>
{chr(10).join(cards)}
      </ul>
      <footer>{TAGLINE} · <a href="/">youandinotai.com</a></footer>
    </main>
  </body>
</html>
"""


def blog_index(found: list[tuple[str, dict[str, str], str]]) -> str:
    """An index page for /blog/.

    Without it, /blog/ is the one URL in this tree that still resolves to the SPA
    shell — nginx has no file or directory to match, so `try_files` falls through
    to /index.html and a crawler gets an empty <div id="root">.
    """
    cards = []
    for slug, meta, _body in sorted(
        found, key=lambda f: f[1].get("date", ""), reverse=True
    ):
        title = html.escape(meta.get("title") or slug)
        desc = html.escape(meta.get("description") or "", quote=True)
        cards.append(
            f'      <li><a href="/blog/{slug}/"><strong>{title}</strong></a>'
            f'<span>{desc}</span></li>'
        )

    hub_title = f"Verified Human Dating & Safety Guides | {BRAND}"
    hub_desc = "Guides on real people, verified profiles and avoiding bots in online dating."
    og_image = f"{SITE}/og-image.png"
    og_image_alt = "YouAndINotAI 18+ verified-human dating and social platform with $1 Bot-Shield check"

    return f"""<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>{html.escape(hub_title)}</title>
    <meta name="description" content="{html.escape(hub_desc, quote=True)}" />
    <link rel="canonical" href="{SITE}/blog/" />
    <meta property="og:type" content="website" />
    <meta property="og:site_name" content="{BRAND}" />
    <meta property="og:title" content="{html.escape(hub_title, quote=True)}" />
    <meta property="og:description" content="{html.escape(hub_desc, quote=True)}" />
    <meta property="og:url" content="{SITE}/blog/" />
    <meta property="og:image" content="{og_image}" />
    <meta property="og:image:alt" content="{html.escape(og_image_alt, quote=True)}" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="{html.escape(hub_title, quote=True)}" />
    <meta name="twitter:description" content="{html.escape(hub_desc, quote=True)}" />
    <meta name="twitter:image" content="{og_image}" />
    <meta name="twitter:image:alt" content="{html.escape(og_image_alt, quote=True)}" />
    <style>
      :root {{ color-scheme: light; }}
      * {{ box-sizing: border-box; }}
      body {{
        margin: 0; padding: 2.5rem 1.25rem 5rem;
        background: {CREAM}; color: {BLACK};
        font: 17px/1.65 ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, sans-serif;
      }}
      main {{ max-width: 44rem; margin: 0 auto; }}
      .kicker {{
        display: inline-block; margin-bottom: 1.75rem;
        font-weight: 800; letter-spacing: .12em; text-transform: uppercase;
        font-size: .75rem; color: {ORANGE}; text-decoration: none;
      }}
      h1 {{ font-size: 2rem; line-height: 1.2; margin: 0 0 1.5rem; }}
      ul {{ list-style: none; padding: 0; }}
      li {{ margin: 0 0 1.5rem; }}
      li a {{ color: {ORANGE}; font-size: 1.1rem; }}
      li span {{ display: block; opacity: .8; }}
      footer {{
        margin-top: 3rem; padding-top: 1.25rem;
        border-top: 1px solid rgba(17,17,17,.12);
        font-size: .85rem; opacity: .75;
      }}
    </style>
  </head>
  <body>
    <main>
      <a class="kicker" href="/">{BRAND}</a>
      <h1>Verified Human Dating &amp; Safety Guides</h1>
      <ul>
{chr(10).join(cards)}
      </ul>
      <footer>{TAGLINE} · <a href="/">youandinotai.com</a></footer>
    </main>
  </body>
</html>
"""


def sitemap(entries: list[tuple[str, str, str]]) -> str:
    """entries: (url, lastmod, priority)"""
    lines = [
        '<?xml version="1.0" encoding="UTF-8"?>',
        '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ]
    for url, lastmod, priority in entries:
        lines.append("  <url>")
        lines.append(f"    <loc>{html.escape(url)}</loc>")
        if lastmod:
            lines.append(f"    <lastmod>{lastmod}</lastmod>")
        lines.append(f"    <priority>{priority}</priority>")
        lines.append("  </url>")
    lines.append("</urlset>")
    return "\n".join(lines) + "\n"


def build() -> int:
    found = posts()
    if not found:
        print("no blog posts found — nothing to prerender")
        return 0

    latest_date = max((m.get("date") or "" for _, m, _ in found), default="") or "2026-10-01"
    written = 0
    sitemap_entries: list[tuple[str, str, str]] = [
        (f"{SITE}/", latest_date, "1.0"),
        (f"{SITE}/support", latest_date, "0.8"),
        (f"{SITE}/blog/", latest_date, "0.9"),
    ]

    with open(os.path.join(BLOG_DIR, "index.html"), "w", encoding="utf-8") as fh:
        fh.write(blog_index(found))
    print("prerendered blog index -> blog/index.html")

    for slug, meta, body in found:
        body_html = render_body(body)
        url = canonical_for(meta, slug)
        out_dir = os.path.join(BLOG_DIR, slug)
        os.makedirs(out_dir, exist_ok=True)
        with open(os.path.join(out_dir, "index.html"), "w", encoding="utf-8") as fh:
            fh.write(page(meta, body_html, url))
        sitemap_entries.append((url, meta.get("date") or latest_date, "0.8"))
        written += 1
        print(f"prerendered {slug} -> blog/{slug}/index.html")

    found_cities = cities()
    city_written = 0
    if found_cities:
        os.makedirs(CITIES_DIR, exist_ok=True)
        with open(os.path.join(CITIES_DIR, "index.html"), "w", encoding="utf-8") as fh:
            fh.write(cities_index(found_cities))
        sitemap_entries.append((f"{SITE}/cities/", latest_date, "0.8"))
        print("prerendered cities index -> cities/index.html")

        for slug, meta, body in found_cities:
            body_html = render_body(body)
            url = canonical_for_city(meta, slug)
            out_dir = os.path.join(CITIES_DIR, slug)
            os.makedirs(out_dir, exist_ok=True)
            with open(os.path.join(out_dir, "index.html"), "w", encoding="utf-8") as fh:
                fh.write(page(meta, body_html, url))
            sitemap_entries.append((url, meta.get("date") or latest_date, "0.8"))
            city_written += 1
            print(f"prerendered city {slug} -> cities/{slug}/index.html")

    with open(os.path.join(PUBLIC, "sitemap.xml"), "w", encoding="utf-8") as fh:
        fh.write(sitemap(sitemap_entries))

    print(
        f"{written} post(s) + {city_written} city page(s) + sitemap.xml ({len(sitemap_entries)} urls) written to public"
    )
    return 0


def check() -> int:
    """Verify every post and city page has generated HTML containing its own text."""
    found = posts()
    found_cities = cities()
    problems: list[str] = []

    for slug, _meta, body in found:
        index = os.path.join(BLOG_DIR, slug, "index.html")
        if not os.path.exists(index):
            problems.append(f"{slug}: no blog/{slug}/index.html")
            continue
        with open(index, encoding="utf-8") as fh:
            rendered = fh.read()

        # The first real sentence of the body must survive into the HTML.
        first = next(
            (ln.strip() for ln in body.splitlines() if ln.strip() and not ln.startswith("#")),
            "",
        )
        probe = first[:60]
        if probe and probe not in rendered:
            problems.append(f"{slug}: body text absent from generated HTML")

        if "<div id=\"root\">" in rendered:
            problems.append(f"{slug}: served the SPA shell instead of content")

    for slug, _meta, body in found_cities:
        index = os.path.join(CITIES_DIR, slug, "index.html")
        if not os.path.exists(index):
            problems.append(f"city {slug}: no cities/{slug}/index.html")
            continue
        with open(index, encoding="utf-8") as fh:
            rendered = fh.read()

        first = next(
            (ln.strip() for ln in body.splitlines() if ln.strip() and not ln.startswith("#")),
            "",
        )
        probe = first[:60]
        if probe and probe not in rendered:
            problems.append(f"city {slug}: body text absent from generated HTML")

        if "<div id=\"root\">" in rendered:
            problems.append(f"city {slug}: served the SPA shell instead of content")

    sm = os.path.join(PUBLIC, "sitemap.xml")
    if not os.path.exists(sm):
        problems.append("sitemap.xml missing")
    else:
        with open(sm, encoding="utf-8") as fh:
            content = fh.read()
        if "<!doctype html>" in content.lower():
            problems.append("sitemap.xml contains the SPA shell")
        for slug, _meta, _body in found:
            if f"/blog/{slug}" not in content:
                problems.append(f"sitemap.xml omits /blog/{slug}")
        for slug, _meta, _body in found_cities:
            if f"/cities/{slug}/" not in content:
                problems.append(f"sitemap.xml omits /cities/{slug}/")

    # /blog/ is served from blog/index.html. Without it that URL falls through
    # to the SPA shell, which is the exact defect this script exists to fix.
    blog_index_path = os.path.join(BLOG_DIR, "index.html")
    if not os.path.exists(blog_index_path):
        problems.append("/blog/ has no index.html — falls through to the SPA shell")
    else:
        with open(blog_index_path, encoding="utf-8") as fh:
            hub = fh.read()
        if "<div id=\"root\">" in hub:
            problems.append("/blog/ serves the SPA shell")
        for slug, _meta, _body in found:
            if f'href="/blog/{slug}/"' not in hub:
                problems.append(f"/blog/ hub does not link /blog/{slug}/")

    if found_cities:
        cities_index_path = os.path.join(CITIES_DIR, "index.html")
        if not os.path.exists(cities_index_path):
            problems.append("/cities/ has no index.html — falls through to the SPA shell")
        else:
            with open(cities_index_path, encoding="utf-8") as fh:
                city_hub = fh.read()
            if "<div id=\"root\">" in city_hub:
                problems.append("/cities/ serves the SPA shell")
            for slug, _meta, _body in found_cities:
                if f'href="/cities/{slug}/"' not in city_hub:
                    problems.append(f"/cities/ hub does not link /cities/{slug}/")

    print(f"checked {len(found)} post(s) and {len(found_cities)} city page(s)")
    if problems:
        for p in problems:
            print(f"  FAIL {p}")
        return 1
    print("PASS — every post and city page has static HTML containing its own text, and the sitemap covers them")
    return 0


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--check", action="store_true", help="verify instead of generate")
    args = ap.parse_args()
    return check() if args.check else build()


if __name__ == "__main__":
    raise SystemExit(main())
