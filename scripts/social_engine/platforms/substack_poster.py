"""
Substack Poster — Publishes articles on Substack via Playwright browser automation.
Navigates to the user's Substack dashboard to create and publish a new post.
"""
import logging
import os

from social_engine.platforms.base_poster import BasePoster

log = logging.getLogger("social-engine")


class SubstackPoster(BasePoster):
    name = "substack"
    method = "browser"

    def _check_config(self):
        """Check for Substack subdomain config."""
        self._subdomain = os.getenv("SUBSTACK_SUBDOMAIN", "")
        if not self._subdomain:
            log.warning(
                "SubstackPoster: SUBSTACK_SUBDOMAIN not set — "
                "will try to navigate to generic substack.com/publish"
            )

    def post(self, text, image_path=None, **kwargs):
        """
        Create a short post on Substack (uses post_article flow).
        Returns (success: bool, result_message: str).
        """
        title = kwargs.get("title", "")
        if not title:
            lines = text.strip().split("\n", 1)
            title = lines[0][:100]
            body = lines[1] if len(lines) > 1 else ""
        else:
            body = text
        return self.post_article(title, body, **kwargs)

    def post_article(self, title, body, tags=None, **kwargs):
        """
        Publish a full article on Substack.
        Returns (success: bool, result_message: str).
        """
        from social_engine.browser_manager import get_context, close_context

        context = get_context(self.name)
        page = context.new_page()
        try:
            # Step 1: Navigate to Substack dashboard
            if self._subdomain:
                dashboard_url = f"https://{self._subdomain}.substack.com/publish/post"
                log.info(f"[{self.name}] Navigating to {dashboard_url}")
            else:
                dashboard_url = "https://substack.com/publish/post"
                log.info(f"[{self.name}] Navigating to substack.com/publish/post")
            page.goto(dashboard_url, wait_until="domcontentloaded")
            page.wait_for_timeout(3000)

            # Check login status
            if not self._check_browser_login(page):
                from social_engine.platforms.base_poster import NOT_LOGGED_IN
                return False, f"{NOT_LOGGED_IN} Substack — run: python scripts/daemon-login.py"

            # Step 2: Type the title
            log.info(f"[{self.name}] Typing title: {title[:50]}...")
            title_area = page.wait_for_selector(
                'div[role="textbox"][data-placeholder*="Title"], '
                'textarea[placeholder*="Title"], '
                'h2[contenteditable="true"], '
                'div[class*="post-title"] div[contenteditable="true"], '
                'div[data-testid="post-title"][contenteditable="true"]',
                timeout=10000,
            )
            title_area.click()
            page.wait_for_timeout(500)
            page.keyboard.type(title, delay=15)
            page.wait_for_timeout(1000)

            # Step 3: Move to body area and type content
            log.info(f"[{self.name}] Typing article body")
            # Tab or click into body
            page.keyboard.press("Tab")
            page.wait_for_timeout(500)

            body_area = page.wait_for_selector(
                'div[class*="body"] div[contenteditable="true"], '
                'div[data-testid="post-body"][contenteditable="true"], '
                'div[class*="ProseMirror"][contenteditable="true"], '
                'div[role="textbox"][data-placeholder*="Write"]',
                timeout=10000,
            )
            body_area.click()
            page.wait_for_timeout(500)

            # Type body paragraph by paragraph
            paragraphs = body.strip().split("\n\n")
            for i, para in enumerate(paragraphs):
                page.keyboard.type(para.strip(), delay=10)
                if i < len(paragraphs) - 1:
                    page.keyboard.press("Enter")
                    page.keyboard.press("Enter")
                page.wait_for_timeout(500)
            page.wait_for_timeout(2000)

            # Step 4: Click "Continue" or "Publish" to open publish dialog
            log.info(f"[{self.name}] Clicking Publish/Continue button")
            publish_trigger = page.wait_for_selector(
                'button:has-text("Continue"), '
                'button:has-text("Publish"), '
                'button[class*="publish"]',
                timeout=10000,
            )
            publish_trigger.click()
            page.wait_for_timeout(2000)

            # Step 5: Confirm publish in the dialog
            log.info(f"[{self.name}] Confirming publish")
            try:
                confirm_btn = page.wait_for_selector(
                    'button:has-text("Publish now"), '
                    'button:has-text("Send"), '
                    'button:has-text("Publish"):not([disabled])',
                    timeout=10000,
                )
                confirm_btn.click()
                page.wait_for_timeout(5000)
            except Exception:
                log.warning(f"[{self.name}] No publish confirmation dialog — first button may have published directly")

            # Step 6: Check for success
            if "/p/" in page.url:
                log.info(f"[{self.name}] Article published at: {page.url}")
                return True, page.url
            else:
                log.info(f"[{self.name}] Publish submitted — current URL: {page.url}")
                return True, "Posted successfully"

        except Exception as e:
            log.error(f"[{self.name}] Post failed: {e}")
            return False, str(e)
        finally:
            try:
                page.close()
            except Exception:
                pass
