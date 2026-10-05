#!/usr/bin/env python3
"""
24/7 SEO BLOG ENGINE FOR YOUANDINOTAI.COM
=========================================
Writes one long-tail SEO article per cycle into the public blog directory
so it can be indexed. Free-only organic acquisition. No paid ads.

Each article:
  - targets one dating long-tail keyword
  - links to https://youandinotai.com and the $1 Bot-Shield / $14.99 plan
  - is plain markdown, business-only, adults 18+
  - is logged to ops/growth-engine/SEO_BLOG_LOG.md

Run: python ops/growth-engine/seo_blog_engine.py
"""

from __future__ import annotations

import datetime as dt
import re
from pathlib import Path

ROOT = Path(r"C:/ANTIGRAVITY")
GROWTH_DIR = ROOT / "ops" / "growth-engine"
BLOG_DIR = ROOT / "domains" / "youandinotai.com" / "frontend" / "public" / "blog"
LOG = GROWTH_DIR / "SEO_BLOG_LOG.md"
USED = GROWTH_DIR / "seo_topics_used.txt"

SITE = "https://youandinotai.com"
FOOTER = "youandinotai.com is for adults 18 and over."

TOPICS = [
    ("dating app without bots", "Why a dating app without bots is worth paying a dollar for"),
    ("verified dating profiles", "What verified dating profiles actually change for you"),
    ("dating app scams", "How to spot a dating app scam before you waste a week"),
    ("fake profiles on dating apps", "Fake profiles on dating apps and the one fix that works"),
    ("how to spot a bot on a dating app", "How to spot a bot on a dating app in under a minute"),
    ("safe online dating", "Safe online dating starts with proof the other person is real"),
    ("dating app identity verification", "What dating app identity verification should actually check"),
    ("best dating app for serious relationships 2026", "What to look for in a dating app for serious relationships in 2026"),
    ("dating app profile tips", "Dating app profile tips that get replies from real people"),
    ("online dating conversation tips", "Online dating conversation tips that lead to a real date"),
    ("dating app catfishing", "Dating app catfishing: the signs and the one-dollar fix"),
    ("dating after divorce over 40", "Dating after divorce over 40 without wading through fake profiles"),
    ("online dating for introverts", "Online dating for introverts who want real replies, not noise"),
    ("long distance dating app", "A long distance dating app only works if the person is real"),
    ("is online dating worth it 2026", "Is online dating worth it in 2026 if most profiles are bots"),
    ("dating app for professionals", "A dating app for professionals should not waste your time"),
    ("dating app conversation starters", "Dating app conversation starters that get an answer"),
    ("real people dating app", "A real people dating app is the only kind worth opening"),
    ("dating app review reddit", "What a dating app review on Reddit will not tell you"),
    ("first date ideas online dating", "First date ideas when you actually met someone real online"),
]


def used_topics() -> set[str]:
    if not USED.exists():
        return set()
    return {ln.strip().lower() for ln in USED.read_text(encoding="utf-8").splitlines() if ln.strip()}


def next_topic() -> tuple[str, str]:
    done = used_topics()
    for key, title in TOPICS:
        if key.lower() not in done:
            return key, title
    idx = dt.datetime.now().day % len(TOPICS)
    return TOPICS[idx]


def slug(text: str) -> str:
    s = re.sub(r"[^a-z0-9]+", "-", text.lower()).strip("-")
    return s[:80]


def article(keyword: str, title: str) -> str:
    today = dt.date.today().isoformat()
    return f"""---
title: "{title}"
description: "{keyword} — a practical guide, plus how {SITE} uses a $1 Bot-Shield so every profile is a real person."
date: {today}
keyword: "{keyword}"
canonical: "{SITE}/blog/{slug(keyword)}"
---

# {title}

If you have used a dating app lately you already know the problem. A large share of the profiles you see are not real people. Some are scripts. Some are stolen photos. Some exist only to pull you off the app and into a scam. That is the whole reason searching for "{keyword}" brings up so much frustration.

## What actually fixes it

Filters and report buttons do not fix it. The account costs the operator nothing, so they make another one. The fix is to make a fake profile cost something and prove the person is real before they can message anyone.

That is what {SITE} does with a one-time $1 Bot-Shield. One dollar, once, tied to a real identity check. It is not a subscription and it is not a trick to keep you swiping. It exists so the people you match with had to prove they are human.

## What you should do

1. Stop spending time on apps where a new account is free and unverified.
2. Look for identity verification that happens before messaging, not after you have already been burned.
3. Treat any profile that pushes you to another app or asks for money as a scam, full stop.

## A simpler option

{SITE} is built around one idea: real people only. The $1 Bot-Shield keeps bots out. If you want help once you are in, there is optional AI profile optimization at $14.99 and conversation help after that. None of it is required to meet someone.

Start here: {SITE}

{FOOTER}
"""


def main() -> int:
    BLOG_DIR.mkdir(parents=True, exist_ok=True)
    keyword, title = next_topic()
    path = BLOG_DIR / f"{slug(keyword)}.md"
    path.write_text(article(keyword, title), encoding="utf-8")
    with USED.open("a", encoding="utf-8") as f:
        f.write(keyword.lower() + "\n")
    line = f"- {dt.datetime.now().isoformat(timespec='seconds')} | {keyword} | {path}\n"
    if not LOG.exists():
        LOG.write_text("# SEO Blog Log\n\n", encoding="utf-8")
    with LOG.open("a", encoding="utf-8") as f:
        f.write(line)
    print(f"WROTE {path}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
