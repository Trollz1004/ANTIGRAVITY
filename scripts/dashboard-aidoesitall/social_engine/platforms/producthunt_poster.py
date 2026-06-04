"""
Product Hunt Poster — Creates discussion posts on Product Hunt via Playwright.
"""
import logging

from social_engine.platforms.base_poster import BasePoster

log = logging.getLogger("social-engine")


class ProductHuntPoster(BasePoster):
    name = "producthunt"
    method = "browser"

    def post(self, text, image_path=None, **kwargs):
        """
        Create a new discussion post on Product Hunt.
        kwargs can include: title, topic (e.g. "ask", "show", "discussion").
        Returns (success: bool, result_message: str).
        """
        from social_engine.browser_manager import get_context, close_context

        title = kwargs.get("title", "YouAndINotAI — Real People Dating, Not Bots")

        context = get_context(self.name)
        page = context.new_page()
        try:
            # Step 1: Navigate to new discussion page
            log.info(f"[{self.name}] Navigating to producthunt.com/discussions/new")
            page.goto(
                "https://www.producthunt.com/discussions/new",
                wait_until="domcontentloaded",
            )
            page.wait_for_timeout(3000)

            # Check login status
            if not self._check_browser_login(page):
                from social_engine.platforms.base_poster import NOT_LOGGED_IN
                return False, f"{NOT_LOGGED_IN} ProductHunt — run: python scripts/daemon-login.py"

            # Step 2: Set the discussion title
            log.info(f"[{self.name}] Setting title: {title[:50]}...")
            title_input = page.wait_for_selector(
                'input[name="title"], '
                'input[placeholder*="Title"], '
                'input[placeholder*="title"], '
                'input[class*="title"]',
                timeout=10000,
            )
            title_input.click()
            title_input.fill(title)
            page.wait_for_timeout(1000)

            # Step 3: Type the discussion body
            log.info(f"[{self.name}] Typing discussion body")
            body_area = page.wait_for_selector(
                'div[contenteditable="true"], '
                'textarea[name="body"], '
                'textarea[placeholder*="body"], '
                'div[class*="editor"] div[contenteditable="true"], '
                'div[class*="ProseMirror"][contenteditable="true"]',
                timeout=10000,
            )
            body_area.click()
            page.wait_for_timeout(500)
            if body_area.evaluate("el => el.tagName") == "TEXTAREA":
                body_area.fill(text)
            else:
                page.keyboard.type(text, delay=15)
            page.wait_for_timeout(2000)

            # Step 4: Optionally select a topic/category
            topic = kwargs.get("topic")
            if topic:
                log.info(f"[{self.name}] Selecting topic: {topic}")
                try:
                    topic_select = page.wait_for_selector(
                        'select[name="topic"], '
                        'div[class*="topic-selector"], '
                        'button:has-text("Select topic")',
                        timeout=5000,
                    )
                    topic_select.click()
                    page.wait_for_timeout(500)
                    topic_option = page.wait_for_selector(
                        f'option[value="{topic}"], '
                        f'li:has-text("{topic}"), '
                        f'div[role="option"]:has-text("{topic}")',
                        timeout=5000,
                    )
                    topic_option.click()
                    page.wait_for_timeout(1000)
                except Exception:
                    log.warning(f"[{self.name}] Could not select topic — continuing without it")

            # Step 5: Click Post/Submit button
            log.info(f"[{self.name}] Clicking Post button")
            post_btn = page.wait_for_selector(
                'button:has-text("Post"), '
                'button:has-text("Submit"), '
                'button:has-text("Create Discussion"), '
                'button[type="submit"]',
                timeout=10000,
            )
            post_btn.click()
            page.wait_for_timeout(5000)

            # Step 6: Check for redirect to the new discussion
            if "/discussions/" in page.url:
                log.info(f"[{self.name}] Discussion created at: {page.url}")
                return True, page.url
            else:
                log.info(f"[{self.name}] Post submitted — current URL: {page.url}")
                return True, "Posted successfully"

        except Exception as e:
            log.error(f"[{self.name}] Post failed: {e}")
            return False, str(e)
        finally:
            try:
                page.close()
            except Exception:
                pass
