"""
Medium Poster — Publishes articles on Medium via Playwright browser automation.
Creates a new story with title and body, then publishes.
"""
import logging

from social_engine.platforms.base_poster import BasePoster

log = logging.getLogger("social-engine")


class MediumPoster(BasePoster):
    name = "medium"
    method = "browser"

    def post(self, text, image_path=None, **kwargs):
        """
        Create a short post on Medium (uses post_article flow with text as body).
        Returns (success: bool, result_message: str).
        """
        title = kwargs.get("title", "")
        if not title:
            # Split first line as title if no explicit title given
            lines = text.strip().split("\n", 1)
            title = lines[0][:100]
            body = lines[1] if len(lines) > 1 else ""
        else:
            body = text
        return self.post_article(title, body)

    def post_article(self, title, body, tags=None, **kwargs):
        """
        Publish a full article on Medium.
        Returns (success: bool, result_message: str).
        """
        from social_engine.browser_manager import get_context, close_context

        tags = tags or ["dating", "technology", "startup"]

        context = get_context(self.name)
        page = context.new_page()
        try:
            # Step 1: Navigate to new story page
            log.info(f"[{self.name}] Navigating to medium.com/new-story")
            page.goto("https://medium.com/new-story", wait_until="domcontentloaded")
            page.wait_for_timeout(3000)

            # Check login status
            if not self._check_browser_login(page):
                from social_engine.platforms.base_poster import NOT_LOGGED_IN
                return False, f"{NOT_LOGGED_IN} Medium — run: python scripts/daemon-login.py"

            # Step 2: Type the title
            log.info(f"[{self.name}] Typing title: {title[:50]}...")
            title_area = page.wait_for_selector(
                'h3[data-default-value="Title"], '
                'div[data-testid="storyTitle"] h3, '
                'h3.graf--title, '
                'div[role="textbox"][data-placeholder="Title"]',
                timeout=10000,
            )
            title_area.click()
            page.wait_for_timeout(500)
            page.keyboard.type(title, delay=15)
            page.wait_for_timeout(1000)

            # Step 3: Move to body and type content
            log.info(f"[{self.name}] Typing article body")
            page.keyboard.press("Enter")
            page.wait_for_timeout(500)

            # Find the body editor area
            body_area = page.wait_for_selector(
                'div[data-default-value="Tell your story..."], '
                'p.graf--p:first-of-type, '
                'div[role="textbox"][data-placeholder="Tell your story..."], '
                'section[data-field="body"] div[contenteditable="true"]',
                timeout=10000,
            )
            body_area.click()
            page.wait_for_timeout(500)

            # Type body paragraph by paragraph for natural formatting
            paragraphs = body.strip().split("\n\n")
            for i, para in enumerate(paragraphs):
                page.keyboard.type(para.strip(), delay=10)
                if i < len(paragraphs) - 1:
                    page.keyboard.press("Enter")
                    page.keyboard.press("Enter")
                page.wait_for_timeout(500)
            page.wait_for_timeout(2000)

            # Step 4: Click Publish button (opens publish dialog)
            log.info(f"[{self.name}] Clicking Publish button")
            publish_btn = page.wait_for_selector(
                'button:has-text("Publish"), '
                'button[data-action="publish"]',
                timeout=10000,
            )
            publish_btn.click()
            page.wait_for_timeout(2000)

            # Step 5: Add tags in the publish dialog
            log.info(f"[{self.name}] Adding tags")
            try:
                tag_input = page.wait_for_selector(
                    'input[placeholder*="Add a tag"], '
                    'input[placeholder*="tag"], '
                    'input[class*="tag-input"]',
                    timeout=5000,
                )
                for tag in tags[:5]:  # Medium allows up to 5 tags
                    tag_input.fill(tag)
                    page.wait_for_timeout(500)
                    page.keyboard.press("Enter")
                    page.wait_for_timeout(500)
            except Exception:
                log.warning(f"[{self.name}] Could not add tags — continuing without them")

            # Step 6: Confirm publish (the final "Publish now" button)
            log.info(f"[{self.name}] Confirming publish")
            confirm_btn = page.wait_for_selector(
                'button:has-text("Publish now"), '
                'button[data-action="publish"]:not([disabled])',
                timeout=10000,
            )
            confirm_btn.click()
            page.wait_for_timeout(5000)

            # Step 7: Check for success (redirected to article page)
            if "/p/" in page.url or "medium.com/@" in page.url:
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
