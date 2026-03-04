"""
TikTok Poster — Posts images/videos to TikTok via Playwright browser automation.
Uses the TikTok web upload interface.
"""
import logging
import os

from social_engine.platforms.base_poster import BasePoster

log = logging.getLogger("social-engine")


class TikTokPoster(BasePoster):
    name = "tiktok"
    method = "browser"

    def post(self, text, image_path=None, **kwargs):
        """
        Upload an image or video to TikTok with caption.
        Returns (success: bool, result_message: str).
        """
        if not image_path or not os.path.isfile(image_path):
            return False, "TikTok requires an image_path or video_path to upload"

        from social_engine.browser_manager import get_context, close_context

        context = get_context(self.name)
        page = context.new_page()
        try:
            # Step 1: Navigate to TikTok upload page
            log.info(f"[{self.name}] Navigating to tiktok.com/upload")
            page.goto("https://www.tiktok.com/upload", wait_until="domcontentloaded")
            page.wait_for_timeout(3000)

            # Check login status
            if not self._check_browser_login(page):
                from social_engine.platforms.base_poster import NOT_LOGGED_IN
                return False, f"{NOT_LOGGED_IN} TikTok — run: python scripts/daemon-login.py"

            # Step 2: Upload file via file input
            log.info(f"[{self.name}] Uploading file: {image_path}")
            file_input = page.wait_for_selector(
                'input[type="file"]', timeout=10000
            )
            file_input.set_input_files(image_path)
            page.wait_for_timeout(5000)

            # Step 3: Wait for upload to process
            log.info(f"[{self.name}] Waiting for upload to process")
            page.wait_for_timeout(3000)

            # Step 4: Add caption text
            log.info(f"[{self.name}] Adding caption")
            caption_area = page.wait_for_selector(
                'div[contenteditable="true"][data-text="true"], '
                'div[class*="caption"] div[contenteditable="true"], '
                'div[class*="DraftEditor-root"] div[contenteditable="true"], '
                '.notranslate[contenteditable="true"]',
                timeout=10000,
            )
            caption_area.click()
            page.wait_for_timeout(500)
            # Clear existing placeholder text
            page.keyboard.press("Control+a")
            page.keyboard.press("Delete")
            page.wait_for_timeout(300)
            page.keyboard.type(text, delay=30)
            page.wait_for_timeout(2000)

            # Step 5: Click Post button
            log.info(f"[{self.name}] Clicking Post button")
            post_btn = page.wait_for_selector(
                'button:has-text("Post"), '
                'button[class*="post-button"], '
                'div[class*="btn-post"]',
                timeout=10000,
            )
            post_btn.click()
            page.wait_for_timeout(5000)

            # Step 6: Check for success
            try:
                page.wait_for_selector(
                    'text="Your video has been uploaded", '
                    'text="Your post is being processed", '
                    'text="Uploaded"',
                    timeout=30000,
                )
                log.info(f"[{self.name}] Upload confirmed")
            except Exception:
                log.warning(f"[{self.name}] Could not confirm upload — may still have succeeded")

            return True, "Posted successfully"

        except Exception as e:
            log.error(f"[{self.name}] Post failed: {e}")
            return False, str(e)
        finally:
            try:
                page.close()
            except Exception:
                pass
