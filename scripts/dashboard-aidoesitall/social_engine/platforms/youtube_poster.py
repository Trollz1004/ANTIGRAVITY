"""
YouTube Poster — Posts community tab updates via Playwright browser automation.
Navigates to the channel's community tab and creates a post.
"""
import logging
import os

from social_engine.platforms.base_poster import BasePoster

log = logging.getLogger("social-engine")


class YouTubePoster(BasePoster):
    name = "youtube"
    method = "browser"

    def post(self, text, image_path=None, **kwargs):
        """
        Create a YouTube community post.
        Returns (success: bool, result_message: str).
        """
        from social_engine.browser_manager import get_context, close_context

        context = get_context(self.name)
        page = context.new_page()
        try:
            # Step 1: Navigate to YouTube Studio or channel community tab
            log.info(f"[{self.name}] Navigating to YouTube Studio community")
            page.goto(
                "https://studio.youtube.com/channel/UC/community",
                wait_until="domcontentloaded",
            )
            page.wait_for_timeout(3000)

            # Check login status
            if not self._check_browser_login(page):
                from social_engine.platforms.base_poster import NOT_LOGGED_IN
                return False, f"{NOT_LOGGED_IN} YouTube — run: python scripts/daemon-login.py"

            # Fallback: try the main youtube.com community creation path
            if "studio.youtube.com" not in page.url:
                log.info(f"[{self.name}] Redirected, trying youtube.com channel page")
                page.goto(
                    "https://www.youtube.com/channel/me/community",
                    wait_until="domcontentloaded",
                )
                page.wait_for_timeout(3000)

            # Step 2: Click "Create post" or find the community text area
            log.info(f"[{self.name}] Looking for community post composer")
            text_area = page.wait_for_selector(
                'div[contenteditable="true"][aria-label*="community"], '
                'div[contenteditable="true"][id*="community"], '
                'div#contenteditable-root[contenteditable="true"], '
                'ytcp-social-suggestions-textbox div[contenteditable="true"], '
                'div[aria-label="Create a community post"]',
                timeout=10000,
            )
            text_area.click()
            page.wait_for_timeout(1000)

            # Step 3: Type the post text
            log.info(f"[{self.name}] Typing community post")
            page.keyboard.type(text, delay=20)
            page.wait_for_timeout(2000)

            # Step 4: Optionally attach an image
            if image_path and os.path.isfile(image_path):
                log.info(f"[{self.name}] Attaching image: {image_path}")
                try:
                    image_btn = page.wait_for_selector(
                        'button[aria-label="Add image"], '
                        'tp-yt-iron-icon[icon*="image"], '
                        'button:has(svg[aria-label="Image"])',
                        timeout=5000,
                    )
                    image_btn.click()
                    page.wait_for_timeout(1000)
                except Exception:
                    log.warning(f"[{self.name}] Could not find image button, trying file input")

                file_input = page.wait_for_selector(
                    'input[type="file"]', timeout=10000
                )
                file_input.set_input_files(image_path)
                page.wait_for_timeout(3000)

            # Step 5: Click Post button
            log.info(f"[{self.name}] Clicking Post button")
            post_btn = page.wait_for_selector(
                'button:has-text("Post"), '
                'ytcp-button:has-text("Post"), '
                '#post-button button',
                timeout=10000,
            )
            post_btn.click()
            page.wait_for_timeout(5000)

            log.info(f"[{self.name}] Community post submitted successfully")
            return True, "Posted successfully"

        except Exception as e:
            log.error(f"[{self.name}] Post failed: {e}")
            return False, str(e)
        finally:
            try:
                page.close()
            except Exception:
                pass
