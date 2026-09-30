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
import os
import re
import sys
from datetime import date

HERE = os.path.dirname(os.path.abspath(__file__))
PUBLIC = os.path.join(HERE, "public")
BLOG_DIR = os.path.join(PUBLIC, "blog")

SITE = "https://youandinotai.com"
BRAND = "YouAndiNotAi"
TAGLINE = "Human Connection. No Bot Noise."

# The site palette, taken from the live CSS.
ORANGE = "#ff4f00"
BLACK = "#111111"
CREAM = "#fffaf2"

FRONT_MATTER = re.compile(r"^---\s*\n(.*?)\n---\s*\n", re.DOTALL)
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
    """Escape, then autolink bare URLs so they are clickable in the output."""
    escaped = html.escape(text, quote=False)

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

    return f"""<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>{html.escape(title)} | {BRAND}</title>
    <meta name="description" content="{html.escape(description, quote=True)}" />
    <link rel="canonical" href="{canonical}" />
    <meta property="og:type" content="article" />
    <meta property="og:title" content="{html.escape(title, quote=True)}" />
    <meta property="og:description" content="{html.escape(description, quote=True)}" />
    <meta property="og:url" content="{canonical}" />
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

    return f"""<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Writing | {BRAND}</title>
    <meta name="description" content="Guides on real people, verified profiles and avoiding bots in online dating." />
    <link rel="canonical" href="{SITE}/blog/" />
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
      <h1>Writing</h1>
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

    written = 0
    sitemap_entries: list[tuple[str, str, str]] = [
        (f"{SITE}/", date.today().isoformat(), "1.0"),
        (f"{SITE}/blog/", date.today().isoformat(), "0.9"),
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
        sitemap_entries.append((url, meta.get("date") or date.today().isoformat(), "0.8"))
        written += 1
        print(f"prerendered {slug} -> blog/{slug}/index.html")

    with open(os.path.join(PUBLIC, "sitemap.xml"), "w", encoding="utf-8") as fh:
        fh.write(sitemap(sitemap_entries))

    print(f"{written} post(s) + sitemap.xml ({len(sitemap_entries)} urls) written to {PUBLIC}")
    return 0


def check() -> int:
    """Verify every post has generated HTML containing its own text."""
    found = posts()
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

    print(f"checked {len(found)} post(s)")
    if problems:
        for p in problems:
            print(f"  FAIL {p}")
        return 1
    print("PASS — every post has static HTML containing its own text, and the sitemap covers them")
    return 0


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--check", action="store_true", help="verify instead of generate")
    args = ap.parse_args()
    return check() if args.check else build()


if __name__ == "__main__":
    raise SystemExit(main())
