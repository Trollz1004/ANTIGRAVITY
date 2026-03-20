"""
Twitter/X Poster — Browser-based posting via Playwright.
Falls back to Tweepy API if credentials exist.
"""
import logging
import os
import time
from pathlib import Path

from social_engine.platforms.base_poster import BasePoster

log = logging.getLogger("social-engine")


class TwitterPoster(BasePoster):
    name = "twitter"
    method = "browser"

    def _check_config(self):
        # Browser-only — Twitter API rate limits are brutal
        self._has_api = False
        log.info("TwitterPoster: Browser mode (API rate limits too strict)")

    def post(self, text, image_path=None, **kwargs):
        return self._post_browser(text, image_path)

    def _post_api(self, text, image_path):
        """Post via Tweepy API."""
        try:
            import tweepy
            auth = tweepy.OAuth1UserHandler(
                os.getenv("TWITTER_API_KEY"), os.getenv("TWITTER_API_SECRET"),
                os.getenv("TWITTER_ACCESS_TOKEN"), os.getenv("TWITTER_ACCESS_SECRET"),
            )
            api = tweepy.API(auth)
            client = tweepy.Client(
                consumer_key=os.getenv("TWITTER_API_KEY"),
                consumer_secret=os.getenv("TWITTER_API_SECRET"),
                access_token=os.getenv("TWITTER_ACCESS_TOKEN"),
                access_token_secret=os.getenv("TWITTER_ACCESS_SECRET"),
            )
            media_ids = None
            if image_path and os.path.isfile(image_path):
                media = api.media_upload(filename=image_path)
                media_ids = [media.media_id]
            response = client.create_tweet(text=text, media_ids=media_ids)
            return True, str(response.data["id"])
        except Exception as e:
            log.error(f"Twitter API failed: {e}")
            return False, str(e)

    def _post_hashtag_reply(self, page):
        """Post hashtags as first reply to hack the algorithm."""
        try:
            hashtag_file = Path(__file__).parent.parent.parent.parent / "data" / "hashtag-comments.json"
            if not hashtag_file.exists():
                return
            import json
            with open(hashtag_file, encoding="utf-8") as f:
                hashtags = json.load(f)
            tags = hashtags.get("twitter", "")
            if not tags:
                return

            # Click on the tweet we just posted (should be at top of timeline)
            page.goto("https://x.com/YouAndiNotAi", wait_until="domcontentloaded")
            page.wait_for_timeout(3000)

            # Click first tweet to open it
            first_tweet = page.query_selector('article[data-testid="tweet"]')
            if first_tweet:
                first_tweet.click(force=True)
                page.wait_for_timeout(2000)

                # Find reply box
                reply_box = page.query_selector('div[data-testid="tweetTextarea_0"]')
                if reply_box:
                    reply_box.click(force=True)
                    page.wait_for_timeout(500)
                    page.keyboard.type(tags, delay=15)
                    page.wait_for_timeout(1000)

                    # Click Reply button
                    reply_btn = page.query_selector('div[data-testid="tweetButtonInline"]')
                    if reply_btn:
                        reply_btn.click(force=True)
                        page.wait_for_timeout(3000)
                        log.info(f"[{self.name}] Hashtag reply posted")
        except Exception as e:
            log.warning(f"[{self.name}] Hashtag reply failed: {e}")

    def _post_browser(self, text, image_path):
        """Post via browser automation."""
        from social_engine.browser_manager import get_page

        page = get_page(self.name)
        try:
            # Navigate to X home
            log.info(f"[{self.name}] Navigating to x.com")
            page.goto("https://x.com/home", wait_until="domcontentloaded")
            page.wait_for_timeout(4000)

            # Check if logged in (look for compose area or login redirect)
            if not self._check_browser_login(page):
                from social_engine.platforms.base_poster import NOT_LOGGED_IN
                return False, f"{NOT_LOGGED_IN} Twitter/X — run: python scripts/daemon-login.py"

            # Find the compose box on the home page
            log.info(f"[{self.name}] Finding compose box")
            compose = None
            selectors = [
                'div[data-testid="tweetTextarea_0"]',
                'div[role="textbox"][data-testid="tweetTextarea_0"]',
                'div.public-DraftEditor-content[role="textbox"]',
                'div[aria-label="Post text"]',
                'div[data-testid="tweetTextarea_0_label"]',
            ]
            for sel in selectors:
                try:
                    compose = page.wait_for_selector(sel, timeout=5000)
                    if compose:
                        log.info(f"[{self.name}] Found compose box with: {sel}")
                        break
                except Exception:
                    continue

            if not compose:
                # Try clicking the compose button first
                try:
                    compose_btn = page.wait_for_selector(
                        'a[data-testid="SideNav_NewTweet_Button"], '
                        'a[href="/compose/post"], '
                        'a[aria-label="Post"]',
                        timeout=5000,
                    )
                    compose_btn.click()
                    page.wait_for_timeout(2000)
                    compose = page.wait_for_selector(
                        'div[data-testid="tweetTextarea_0"], '
                        'div[role="textbox"]',
                        timeout=8000,
                    )
                except Exception:
                    # Take screenshot for debugging
                    debug_path = str(page.context.browser.contexts[0].pages[0].url if False else "")
                    page.screenshot(path="C:/ANTIGRAVITY/data/twitter-debug.png")
                    return False, "Could not find compose box — screenshot saved to data/twitter-debug.png"

            # Type the text
            log.info(f"[{self.name}] Typing tweet")
            compose.click(force=True)
            page.wait_for_timeout(500)
            # Use keyboard.type for reliable input
            page.keyboard.type(text, delay=30)
            page.wait_for_timeout(2000)

            # Attach image if provided
            if image_path and os.path.isfile(image_path):
                try:
                    file_input = page.wait_for_selector(
                        'input[data-testid="fileInput"], input[type="file"]',
                        timeout=5000,
                    )
                    file_input.set_input_files(image_path)
                    page.wait_for_timeout(3000)
                except Exception as e:
                    log.warning(f"[{self.name}] Image upload failed: {e}")

            # Click the Post button
            log.info(f"[{self.name}] Clicking Post button")
            post_btn = None
            post_selectors = [
                'div[data-testid="tweetButtonInline"]',
                'button[data-testid="tweetButtonInline"]',
                'div[data-testid="tweetButton"]',
                'button[data-testid="tweetButton"]',
            ]
            for sel in post_selectors:
                try:
                    post_btn = page.wait_for_selector(sel, timeout=3000)
                    if post_btn:
                        break
                except Exception:
                    continue

            if not post_btn:
                page.screenshot(path="C:/ANTIGRAVITY/data/twitter-debug.png")
                return False, "Could not find Post button"

            # Dismiss any overlays/notifications first
            try:
                for dismiss_sel in [
                    'div[data-testid="sheetDialog"] button[aria-label="Close"]',
                    'div[role="dialog"] button[aria-label="Close"]',
                    'div[data-testid="toast"] button',
                ]:
                    dismiss = page.query_selector(dismiss_sel)
                    if dismiss:
                        dismiss.click(force=True)
                        page.wait_for_timeout(500)
            except Exception:
                pass

            # Force click to bypass any overlay divs
            post_btn.click(force=True)
            page.wait_for_timeout(4000)

            # Post hashtag comment as reply (algorithm hack)
            self._post_hashtag_reply(page)

            log.info(f"[{self.name}] Tweet posted successfully")
            return True, "Posted via browser"

        except Exception as e:
            log.error(f"[{self.name}] Browser post failed: {e}")
            try:
                page.screenshot(path="C:/ANTIGRAVITY/data/twitter-debug.png")
            except Exception:
                pass
            return False, str(e)
        finally:
            try:
                page.close()
            except Exception:
                pass
