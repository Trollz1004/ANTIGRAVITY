#!/usr/bin/env python3
"""
Yesterday's News Today - YouTube Automation Bot
Runs on 9020 node, generates daily news briefs from yesterday's headlines
Authority: Josh Coleman
Date: 2026-03-19
"""

import os
import sys
import json
import logging
import asyncio
from datetime import datetime, timedelta
from email.utils import parsedate_to_datetime
from pathlib import Path
from urllib.parse import urlencode
from urllib.request import urlopen, Request
import xml.etree.ElementTree as ET

# Paths
REPO_DIR = Path(__file__).resolve().parents[1]
RUNTIME_ROOT = Path(
    os.getenv(
        "ANTIGRAVITY_RUNTIME_ROOT",
        str(Path.home() / "Documents" / "ANTIGRAVITY-RUNTIME"),
    )
)
LOG_DIR = RUNTIME_ROOT / "logs"
DATA_DIR = RUNTIME_ROOT / "yesterday-news"
CONTENT_DIR = DATA_DIR / "content"
ARCHIVE_DIR = DATA_DIR / "archive"
STATE_FILE = DATA_DIR / "state.json"

# Ensure directories exist before logging starts
LOG_DIR.mkdir(parents=True, exist_ok=True)
DATA_DIR.mkdir(parents=True, exist_ok=True)
CONTENT_DIR.mkdir(parents=True, exist_ok=True)
ARCHIVE_DIR.mkdir(parents=True, exist_ok=True)

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    handlers=[
        logging.FileHandler(LOG_DIR / "yesterday-news-today.log"),
        logging.StreamHandler()
    ]
)
log = logging.getLogger("yesterday-news-today")


def load_local_env(env_path: Path) -> None:
    """Load simple KEY=VALUE pairs from a local .env file if present."""
    if not env_path.exists():
        return

    for raw_line in env_path.read_text(encoding="utf-8").splitlines():
        line = raw_line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue

        key, value = line.split("=", 1)
        key = key.strip()
        value = value.strip().strip('"').strip("'")
        if key and key not in os.environ:
            os.environ[key] = value


load_local_env(REPO_DIR / ".env")


class YesterdayNewsBot:
    """Bot that creates 'Yesterday's News Today' YouTube content."""
    
    def __init__(self):
        self.name = "Yesterday's News Today"
        self.version = "1.0.0"
        self.state = self._load_state()
        
    def _load_state(self):
        """Load bot state from JSON file."""
        if STATE_FILE.exists():
            try:
                with open(STATE_FILE, 'r') as f:
                    return json.load(f)
            except Exception as e:
                log.warning(f"Could not load state: {e}")
        return {
            "last_run": None,
            "last_post_date": None,
            "videos_created": 0,
            "videos_published": 0
        }
    
    def _save_state(self):
        """Save bot state to JSON file."""
        try:
            with open(STATE_FILE, 'w') as f:
                json.dump(self.state, f, indent=2)
        except Exception as e:
            log.error(f"Could not save state: {e}")
    
    def get_yesterday_date(self):
        """Get yesterday's date in various formats."""
        yesterday = datetime.now() - timedelta(days=1)
        return {
            "iso": yesterday.strftime("%Y-%m-%d"),
            "display": yesterday.strftime("%B %d, %Y"),
            "file": yesterday.strftime("%Y%m%d"),
            "short": yesterday.strftime("%b %d")
        }

    def _normalize_news_item(self, title: str, summary: str, source: str, published_at: str | None = None):
        return {
            "title": title.strip(),
            "summary": summary.strip(),
            "source": source.strip(),
            "published_at": published_at or "",
        }

    def _fetch_newsapi(self, limit: int = 5):
        """Fetch yesterday's news from NewsAPI if NEWSAPI_KEY is configured."""
        api_key = os.getenv("NEWSAPI_KEY", "").strip()
        if not api_key:
            log.info("NEWSAPI_KEY missing. Falling back to RSS feeds.")
            return []

        date = self.get_yesterday_date()
        query = urlencode(
            {
                "domains": "apnews.com,reuters.com,bbc.com,theverge.com,techcrunch.com",
                "language": "en",
                "sortBy": "publishedAt",
                "from": f"{date['iso']}T00:00:00",
                "to": f"{date['iso']}T23:59:59",
                "pageSize": max(limit * 2, 10),
                "apiKey": api_key,
            }
        )
        url = f"https://newsapi.org/v2/everything?{query}"

        try:
            with urlopen(url, timeout=20) as response:
                payload = json.loads(response.read().decode("utf-8"))
        except Exception as exc:
            log.warning(f"NewsAPI request failed: {exc}")
            return []

        if payload.get("status") != "ok":
            log.warning(f"NewsAPI returned non-ok status: {payload.get('status')}")
            return []

        items = []
        for article in payload.get("articles", []):
            title = (article.get("title") or "").strip()
            description = (article.get("description") or article.get("content") or "").strip()
            source = (article.get("source") or {}).get("name") or "NewsAPI"
            published_at = article.get("publishedAt") or ""
            if not title or not description:
                continue
            items.append(self._normalize_news_item(title, description, source, published_at))
            if len(items) >= limit:
                break

        if items:
            log.info(f"Fetched {len(items)} news items from NewsAPI")
        else:
            log.warning("NewsAPI returned no usable articles")
        return items

    # Feed sets. Verified live 2026-07-31 - the original three (Reuters, BBC,
    # AP) are all dead: Reuters retired public RSS entirely, the BBC URL now
    # redirects, and the AP hub path 404s. With no NEWSAPI_KEY the bot was
    # silently producing nothing.
    #
    # NEWS_MODE=good     constructive/solutions journalism (default)
    # NEWS_MODE=world    general world news
    # NEWS_MODE=both     everything
    FEED_SETS = {
        "good": [
            ("Good News Network", "https://www.goodnewsnetwork.org/feed/"),
            ("Reasons to be Cheerful", "https://reasonstobecheerful.world/feed/"),
        ],
        "world": [
            ("NPR World", "https://feeds.npr.org/1001/rss.xml"),
            ("Dow Jones World", "https://feeds.content.dowjones.io/public/rss/RSSWorldNews"),
        ],
    }

    def _fetch_rss(self, limit: int = 5):
        """Fallback news fetch using public RSS feeds."""
        mode = os.getenv("NEWS_MODE", "good").strip().lower()
        if mode == "both":
            feeds = self.FEED_SETS["good"] + self.FEED_SETS["world"]
        else:
            feeds = self.FEED_SETS.get(mode) or self.FEED_SETS["good"]
        log.info(f"RSS mode '{mode}': {len(feeds)} feed(s)")
        target_day = self.get_yesterday_date()["iso"]
        items = []

        for source_name, feed_url in feeds:
            try:
                # Many feeds reject urllib's default UA outright.
                req = Request(feed_url, headers={"User-Agent": "Mozilla/5.0 (compatible; ANTIGRAVITY-NewsBot/1.0)"})
                with urlopen(req, timeout=20) as response:
                    xml_bytes = response.read()
            except Exception as exc:
                log.warning(f"RSS fetch failed for {source_name}: {exc}")
                continue

            try:
                root = ET.fromstring(xml_bytes)
            except ET.ParseError as exc:
                log.warning(f"RSS parse failed for {source_name}: {exc}")
                continue

            for item in root.findall(".//item"):
                title = (item.findtext("title") or "").strip()
                summary = (item.findtext("description") or "").strip()
                published_raw = (item.findtext("pubDate") or "").strip()
                if not title or not summary:
                    continue

                if published_raw:
                    try:
                        published_dt = parsedate_to_datetime(published_raw)
                        if published_dt.strftime("%Y-%m-%d") != target_day:
                            continue
                    except Exception:
                        pass

                items.append(self._normalize_news_item(title, summary, source_name, published_raw))
                if len(items) >= limit:
                    break

            if len(items) >= limit:
                break

        if items:
            log.info(f"Fetched {len(items)} news items from RSS fallback")
        else:
            log.warning("RSS fallback returned no usable articles")
        return items

    def generate_content(self, news_items):
        """Generate YouTube video content from news items."""
        date = self.get_yesterday_date()
        
        # Title template
        title = f"Yesterday's News Today — {date['display']}"
        
        # Script/Description template
        script_lines = [
            f"Welcome to Yesterday's News Today for {date['display']}.",
            "",
            "Here are the top stories you might have missed:",
            ""
        ]
        
        for i, item in enumerate(news_items[:5], 1):
            script_lines.append(f"{i}. {item['title']}")
            script_lines.append(f"   {item['summary']}")
            script_lines.append("")
        
        script_lines.extend([
            "",
            "That's your news recap for today.",
            "Subscribe for daily updates.",
            "",
            "#YesterdaysNewsToday #DailyNews #NewsRecap"
        ])
        
        return {
            "title": title,
            "script": "\n".join(script_lines),
            "tags": ["news", "daily news", "yesterday's news", "news recap", "daily update"],
            "date": date["iso"]
        }
    
    def fetch_news(self):
        """
        Fetch yesterday's news from NewsAPI with RSS fallback.
        """
        log.info("Fetching yesterday's news...")
        news_items = self._fetch_newsapi(limit=5)
        if news_items:
            return news_items
        return self._fetch_rss(limit=5)
    
    def create_video_project(self, content):
        """Create video project files for editing."""
        date = self.get_yesterday_date()
        project_dir = CONTENT_DIR / date["file"]
        project_dir.mkdir(exist_ok=True)
        
        # Save script
        script_file = project_dir / "script.txt"
        with open(script_file, 'w', encoding='utf-8') as f:
            f.write(content["script"])
        
        # Save metadata
        meta_file = project_dir / "metadata.json"
        with open(meta_file, 'w', encoding='utf-8') as f:
            json.dump({
                "title": content["title"],
                "tags": content["tags"],
                "date": content["date"],
                "status": "draft"
            }, f, indent=2)
        
        log.info(f"Created video project in {project_dir}")
        return project_dir
    
    def post_to_youtube(self, content, video_path=None):
        """Post content to YouTube community tab or upload video."""
        try:
            # Import the poster from social_engine
            sys.path.insert(0, str(REPO_DIR / "scripts" / "social_engine"))
            from platforms.youtube_poster import YouTubePoster
            
            poster = YouTubePoster()
            
            # For now, post to community tab
            # Video uploads require video file
            success, result = poster.post(
                text=content["script"][:500],  # Truncate for community post
                image_path=None
            )
            
            if success:
                log.info(f"Posted to YouTube: {result}")
                return True
            else:
                log.error(f"YouTube post failed: {result}")
                return False
                
        except Exception as e:
            log.error(f"YouTube post error: {e}")
            return False
    
    def run_daily_cycle(self):
        """Run the full daily news cycle."""
        log.info("=" * 50)
        log.info(f"Starting {self.name} v{self.version}")
        log.info("=" * 50)
        
        # Fetch news
        news_items = self.fetch_news()
        if not news_items:
            log.warning("No news items fetched")
            return False
        
        # Generate content
        content = self.generate_content(news_items)
        log.info(f"Generated content: {content['title']}")
        
        # Create project files
        project_dir = self.create_video_project(content)
        
        # Update state
        self.state["last_run"] = datetime.now().isoformat()
        self.state["videos_created"] += 1
        self._save_state()
        
        log.info(f"Daily cycle complete. Project saved to {project_dir}")
        return True
    
    def run(self, mode="generate"):
        """Main entry point."""
        if mode == "generate":
            return self.run_daily_cycle()
        elif mode == "publish":
            # Load today's content and publish
            date = self.get_yesterday_date()
            project_dir = CONTENT_DIR / date["file"]
            
            if not project_dir.exists():
                log.error(f"No content found for {date['display']}")
                return False
            
            meta_file = project_dir / "metadata.json"
            if meta_file.exists():
                with open(meta_file, 'r') as f:
                    content = json.load(f)
                return self.post_to_youtube(content)
            
        return False


def main():
    """CLI entry point."""
    import argparse
    
    parser = argparse.ArgumentParser(description="Yesterday's News Today Bot")
    parser.add_argument("--mode", choices=["generate", "publish", "both"], 
                       default="generate", help="Operation mode")
    parser.add_argument("--daemon", action="store_true", 
                       help="Run as daemon (scheduled)")
    
    args = parser.parse_args()
    
    bot = YesterdayNewsBot()
    
    if args.daemon:
        log.info("Running in daemon mode")
        # Set up scheduled execution
        # This would integrate with Windows Task Scheduler
        while True:
            bot.run("generate")
            # Sleep until next scheduled run (e.g., 6 AM daily)
            import time
            time.sleep(3600)  # Check every hour
    else:
        if args.mode == "both":
            bot.run("generate")
            bot.run("publish")
        else:
            bot.run(args.mode)


if __name__ == "__main__":
    main()
