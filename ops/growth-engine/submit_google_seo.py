#!/usr/bin/env python3
"""
GOOGLE & BING SEARCH INDEXING PINGER
====================================
Submits sitemap.xml and key URLs to Google Search and Bing Search Webmaster indexing endpoints.
Run: python ops/growth-engine/submit_google_seo.py
"""

import urllib.request
import urllib.parse
import json
import logging
from pathlib import Path
from datetime import datetime, timezone

ROOT = Path(r"C:/ANTIGRAVITY")
GROWTH_DIR = ROOT / "ops" / "growth-engine"
LOG_FILE = GROWTH_DIR / "google_seo.log"

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [GOOGLE-SEO] %(levelname)s: %(message)s",
    handlers=[
        logging.FileHandler(str(LOG_FILE), encoding="utf-8"),
    ],
)
log = logging.getLogger("google-seo")

SITEMAP_URL = "https://youandinotai.com/sitemap.xml"

INDEXING_ENDPOINTS = [
    f"https://www.google.com/ping?sitemap={urllib.parse.quote(SITEMAP_URL)}",
    f"https://www.bing.com/ping?sitemap={urllib.parse.quote(SITEMAP_URL)}",
]

def ping_search_engines():
    print(f"=== PINGING GOOGLE & BING SEARCH INDEXING FOR {SITEMAP_URL} ===")
    results = []

    for endpoint in INDEXING_ENDPOINTS:
        engine = "Google" if "google" in endpoint else "Bing"
        try:
            req = urllib.request.Request(endpoint, headers={"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"})
            with urllib.request.urlopen(req, timeout=10) as resp:
                status = resp.status
                print(f"[{engine} Search Index Ping] HTTP {status} OK")
                log.info(f"{engine} Search index ping returned HTTP {status}")
                results.append({"engine": engine, "status": status, "success": True})
        except Exception as e:
            print(f"[{engine} Search Index Ping] Error: {e}")
            log.error(f"{engine} Search index ping error: {e}")
            results.append({"engine": engine, "error": str(e), "success": False})

    return results

if __name__ == "__main__":
    ping_search_engines()
