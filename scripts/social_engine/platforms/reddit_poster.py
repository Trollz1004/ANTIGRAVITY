"""
Reddit Poster — Browser-based posting with PRAW API fallback.
Reddit aggressively filters promotional content — keep posts genuine.
"""
import logging
import os
import random

from social_engine.platforms.base_poster import BasePoster

log = logging.getLogger("social-engine")

DEFAULT_SUBREDDITS = [
    "SideProject",
    "startups",
    "OnlineDating",
    "dating",
    "datingapps",
    "ChatGPT",
    "SaaS",
]


class RedditPoster(BasePoster):
    name = "reddit"
    method = "browser"

    def _check_config(self):
        self._client_id = os.getenv("REDDIT_CLIENT_ID")
        self._has_api = bool(self._client_id and os.getenv("REDDIT_CLIENT_SECRET")
                            and os.getenv("REDDIT_USERNAME") and os.getenv("REDDIT_PASSWORD"))
        if self._has_api:
            self.method = "api"
            log.info("RedditPoster: API mode (praw)")
        else:
            log.info("RedditPoster: Browser mode (no API keys)")

    def post(self, text, image_path=None, **kwargs):
        if self._has_api:
            return self._post_api(text, image_path, **kwargs)
        return self._post_browser(text, image_path, **kwargs)

    def _post_api(self, text, image_path, **kwargs):
        """Post via PRAW API."""
        try:
            import praw
            reddit = praw.Reddit(
                client_id=os.getenv("REDDIT_CLIENT_ID"),
                client_secret=os.getenv("REDDIT_CLIENT_SECRET"),
                username=os.getenv("REDDIT_USERNAME"),
                password=os.getenv("REDDIT_PASSWORD"),
                user_agent="social-engine:v1.0",
            )
            subreddit_name = kwargs.get("subreddit") or random.choice(DEFAULT_SUBREDDITS)
            subreddit = reddit.subreddit(subreddit_name)
            title = kwargs.get("title")
            if not title:
                lines = text.strip().split("\n")
                title = lines[0][:300]
                body = "\n".join(lines[1:]).strip() if len(lines) > 1 else ""
            else:
                body = text
            submission = subreddit.submit(title=title, selftext=body)
            return True, f"r/{subreddit_name}/{submission.id}"
        except Exception as e:
            log.error(f"Reddit API failed: {e}")
            return False, str(e)

    def _post_browser(self, text, image_path=None, **kwargs):
        """Post via browser automation."""
        from social_engine.browser_manager import get_page

        subreddit = kwargs.get("subreddit") or random.choice(DEFAULT_SUBREDDITS)
        page = get_page(self.name)
        try:
            url = f"https://www.reddit.com/r/{subreddit}/submit"
            log.info(f"[{self.name}] Navigating to {url}")
            page.goto(url, wait_until="domcontentloaded")
            page.wait_for_timeout(4000)

            # Check login status
            if not self._check_browser_login(page):
                from social_engine.platforms.base_poster import NOT_LOGGED_IN
                return False, f"{NOT_LOGGED_IN} Reddit — run: python scripts/daemon-login.py"

            # Extract title from text
            title = kwargs.get("title")
            if not title:
                lines = text.strip().split("\n")
                title = lines[0][:300]
                body = "\n".join(lines[1:]).strip() if len(lines) > 1 else text
            else:
                body = text

            # Reddit new UI submit form
            # Title input
            log.info(f"[{self.name}] Filling title")
            title_input = None
            title_selectors = [
                'textarea[placeholder*="title" i]',
                'input[placeholder*="title" i]',
                'div[slot="title"] textarea',
                'textarea[name="title"]',
            ]
            for sel in title_selectors:
                try:
                    title_input = page.wait_for_selector(sel, timeout=5000)
                    if title_input:
                        break
                except Exception:
                    continue

            if not title_input:
                page.screenshot(path="C:/ANTIGRAVITY/data/reddit-debug.png")
                return False, "Could not find title field"

            title_input.click(force=True)
            title_input.fill(title)
            page.wait_for_timeout(1000)

            # Body text area
            log.info(f"[{self.name}] Filling body")
            body_input = None
            body_selectors = [
                'div[contenteditable="true"][role="textbox"]',
                'textarea[placeholder*="text" i]',
                'div.public-DraftEditor-content',
                'shreddit-composer div[contenteditable="true"]',
            ]
            for sel in body_selectors:
                try:
                    body_input = page.wait_for_selector(sel, timeout=5000)
                    if body_input:
                        break
                except Exception:
                    continue

            if body_input:
                body_input.click(force=True)
                page.keyboard.type(body, delay=15)
                page.wait_for_timeout(1000)

            # Click Post/Submit
            log.info(f"[{self.name}] Clicking submit")
            submit_btn = None
            submit_selectors = [
                'button[type="submit"]:has-text("Post")',
                'button:has-text("Post")',
                'button:has-text("Submit")',
                'faceplate-tracker button',
            ]
            for sel in submit_selectors:
                try:
                    submit_btn = page.wait_for_selector(sel, timeout=5000)
                    if submit_btn:
                        break
                except Exception:
                    continue

            if not submit_btn:
                page.screenshot(path="C:/ANTIGRAVITY/data/reddit-debug.png")
                return False, "Could not find submit button"

            submit_btn.click(force=True)
            page.wait_for_timeout(5000)

            log.info(f"[{self.name}] Posted to r/{subreddit}")
            return True, f"r/{subreddit} via browser"

        except Exception as e:
            log.error(f"[{self.name}] Browser post failed: {e}")
            try:
                page.screenshot(path="C:/ANTIGRAVITY/data/reddit-debug.png")
            except Exception:
                pass
            return False, str(e)
        finally:
            try:
                page.close()
            except Exception:
                pass

    def post_article(self, title, body, tags=None, **kwargs):
        return self.post(body, title=title, **kwargs)
