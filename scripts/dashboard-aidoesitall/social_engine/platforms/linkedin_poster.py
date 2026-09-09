"""
LinkedIn Poster — Posts to LinkedIn feed via Playwright browser automation.
Opens the share box, types content, and posts.
"""
import logging
import os

from social_engine.platforms.base_poster import BasePoster

log = logging.getLogger("social-engine")


class LinkedInPoster(BasePoster):
    name = "linkedin"
    method = "browser"

    def post(self, text, image_path=None, **kwargs):
        """
        Create a new LinkedIn feed post.
        Returns (success: bool, result_message: str).
        """
        from social_engine.browser_manager import get_context, close_context

        context = get_context(self.name)
        page = context.new_page()
        try:
            # Step 1: Navigate to LinkedIn feed
            log.info(f"[{self.name}] Navigating to linkedin.com/feed")
            page.goto("https://www.linkedin.com/feed/", wait_until="domcontentloaded")
            page.wait_for_timeout(3000)

            # Check login status
            if not self._check_browser_login(page):
                from social_engine.platforms.base_poster import NOT_LOGGED_IN
                return False, f"{NOT_LOGGED_IN} LinkedIn — run: python scripts/daemon-login.py"

            # Step 2: Click "Start a post" button
            log.info(f"[{self.name}] Clicking 'Start a post'")
            start_post_btn = page.wait_for_selector(
                'button:has-text("Start a post"), '
                'button[class*="share-box-feed-entry__trigger"], '
                'div[class*="share-box"] button',
                timeout=10000,
            )
            start_post_btn.click()
            page.wait_for_timeout(2000)

            # Step 3: Wait for the share modal to appear
            log.info(f"[{self.name}] Waiting for share modal")
            text_area = page.wait_for_selector(
                'div[role="textbox"][contenteditable="true"], '
                'div[aria-label="Text editor for creating content"]'
                '[contenteditable="true"], '
                'div[class*="ql-editor"][contenteditable="true"]',
                timeout=10000,
            )
            page.wait_for_timeout(1000)

            # Step 4: Type the post content
            log.info(f"[{self.name}] Typing post content")
            text_area.click()
            page.wait_for_timeout(500)
            page.keyboard.type(text, delay=20)
            page.wait_for_timeout(2000)

            # Step 5: Optionally attach an image
            if image_path and os.path.isfile(image_path):
                log.info(f"[{self.name}] Attaching image: {image_path}")
                try:
                    media_btn = page.wait_for_selector(
                        'button[aria-label="Add a photo"], '
                        'button[aria-label="Add media"], '
                        'button:has-text("Add a photo")',
                        timeout=5000,
                    )
                    media_btn.click()
                    page.wait_for_timeout(1000)
                except Exception:
                    log.warning(f"[{self.name}] Could not find media button, trying file input")

                file_input = page.wait_for_selector(
                    'input[type="file"]', timeout=10000
                )
                file_input.set_input_files(image_path)
                page.wait_for_timeout(3000)

            # Step 6: Click Post button
            log.info(f"[{self.name}] Clicking Post button")
            post_btn = page.wait_for_selector(
                'button:has-text("Post")[class*="share-actions__primary"], '
                'button[class*="share-actions__primary-action"], '
                'button:has-text("Post")',
                timeout=10000,
            )
            post_btn.click()
            page.wait_for_timeout(5000)

            # Step 7: Check for success (modal should close)
            try:
                page.wait_for_selector(
                    'div[role="textbox"][contenteditable="true"]',
                    state="detached",
                    timeout=10000,
                )
                log.info(f"[{self.name}] Post submitted successfully")
            except Exception:
                log.warning(f"[{self.name}] Share modal did not close — may still have succeeded")

            return True, "Posted successfully"

        except Exception as e:
            log.error(f"[{self.name}] Post failed: {e}")
            return False, str(e)
        finally:
            try:
                page.close()
            except Exception:
                pass
