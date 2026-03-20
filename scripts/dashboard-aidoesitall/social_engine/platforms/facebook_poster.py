"""
Facebook Poster — Posts to Facebook feed via Playwright browser automation.
Opens the composer, types text, optionally attaches an image, and posts.
"""
import logging
import os

from social_engine.platforms.base_poster import BasePoster

log = logging.getLogger("social-engine")


class FacebookPoster(BasePoster):
    name = "facebook"
    method = "browser"

    def post(self, text, image_path=None, **kwargs):
        """
        Create a new Facebook post.
        Returns (success: bool, result_message: str).
        """
        from social_engine.browser_manager import get_context, close_context

        context = get_context(self.name)
        page = context.new_page()
        try:
            # Step 1: Navigate to Facebook
            log.info(f"[{self.name}] Navigating to facebook.com")
            page.goto("https://www.facebook.com/", wait_until="domcontentloaded")
            page.wait_for_timeout(3000)

            # Check login status
            if not self._check_browser_login(page):
                from social_engine.platforms.base_poster import NOT_LOGGED_IN
                return False, f"{NOT_LOGGED_IN} Facebook — run: python scripts/daemon-login.py"

            # Step 2: Click "What's on your mind?" to open the composer
            log.info(f"[{self.name}] Opening post composer")
            composer_trigger = page.wait_for_selector(
                'div[role="button"]:has-text("What\'s on your mind"), '
                'span:has-text("What\'s on your mind"), '
                'div[class*="x1i10hfl"]:has-text("What\'s on your mind")',
                timeout=10000,
            )
            composer_trigger.click()
            page.wait_for_timeout(2000)

            # Step 3: Wait for the full composer dialog to appear
            log.info(f"[{self.name}] Waiting for composer dialog")
            text_area = page.wait_for_selector(
                'div[role="dialog"] div[contenteditable="true"][role="textbox"], '
                'form div[contenteditable="true"][role="textbox"], '
                'div[aria-label="What\'s on your mind?"][contenteditable="true"]',
                timeout=10000,
            )
            page.wait_for_timeout(1000)

            # Step 4: Type the post text
            log.info(f"[{self.name}] Typing post text")
            text_area.click()
            page.wait_for_timeout(500)
            page.keyboard.type(text, delay=20)
            page.wait_for_timeout(2000)

            # Step 5: Optionally attach an image
            if image_path and os.path.isfile(image_path):
                log.info(f"[{self.name}] Attaching image: {image_path}")
                # Click the photo/video button to reveal file input
                try:
                    photo_btn = page.wait_for_selector(
                        'div[aria-label="Photo/video"], '
                        'div[role="button"]:has-text("Photo/video"), '
                        'svg[aria-label="Photo/Video"]',
                        timeout=5000,
                    )
                    photo_btn.click()
                    page.wait_for_timeout(1000)
                except Exception:
                    log.warning(f"[{self.name}] Could not find photo button, trying file input directly")

                file_input = page.wait_for_selector(
                    'input[type="file"][accept*="image"], input[type="file"]',
                    timeout=10000,
                )
                file_input.set_input_files(image_path)
                page.wait_for_timeout(3000)

            # Step 6: Click Post button
            log.info(f"[{self.name}] Clicking Post button")
            post_btn = page.wait_for_selector(
                'div[role="dialog"] div[aria-label="Post"][role="button"], '
                'div[role="dialog"] button:has-text("Post"), '
                'form div[aria-label="Post"][role="button"]',
                timeout=10000,
            )
            post_btn.click()
            page.wait_for_timeout(5000)

            # Step 7: Wait for composer to close (indicates success)
            try:
                page.wait_for_selector(
                    'div[role="dialog"] div[contenteditable="true"]',
                    state="detached",
                    timeout=15000,
                )
                log.info(f"[{self.name}] Post submitted successfully")
            except Exception:
                log.warning(f"[{self.name}] Composer did not close — post may still have succeeded")

            return True, "Posted successfully"

        except Exception as e:
            log.error(f"[{self.name}] Post failed: {e}")
            return False, str(e)
        finally:
            try:
                page.close()
            except Exception:
                pass
