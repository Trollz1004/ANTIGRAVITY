"""
eBay Poster — Creates eBay listings for YouAndINotAI products via Playwright browser automation.
Supports Founding Member digital card ($14.99/mo) and Royalty Card ($2,500 collectible).
Always enabled — overrides _check_config.
"""
import logging
import os

from social_engine.platforms.base_poster import BasePoster

log = logging.getLogger("social-engine")

# --- Listing Templates ---

FOUNDING_MEMBER_TEMPLATE = {
    "title": "YouAndINotAI Founding Member Digital Card — $14.99/mo Lifetime Lock-In",
    "price": "14.99",
    "category_search": "Digital Goods",
    "condition": "New",
    "description": (
        "YouAndINotAI Founding Member — Lifetime Price Lock\n\n"
        "Be one of the first 1,000 Founding Members of YouAndINotAI, the dating app "
        "that proves every user is a real human.\n\n"
        "What you get:\n"
        "- Founding Member badge (permanent)\n"
        "- $14.99/mo locked forever — price will never increase for Founding Members\n"
        "- Early access to all new features\n"
        "- Priority matching in your area\n"
        "- Bot-Shield verification included ($1 value)\n\n"
        "After purchase, you'll receive a digital access code and onboarding link "
        "to activate your Founding Member account at youandinotai.com.\n\n"
        "60% of all revenue goes directly to Shriners Children's Hospitals.\n"
        "#ForTheKids\n\n"
        "Visit: https://youandinotai.com"
    ),
}

ROYALTY_CARD_TEMPLATE = {
    "title": "YouAndINotAI Royalty Card — Limited Edition Collectible ($2,500)",
    "price": "2500.00",
    "category_search": "Collectibles",
    "condition": "New",
    "description": (
        "YouAndINotAI Royalty Card — Ultra-Limited Collectible\n\n"
        "Own a piece of history. The YouAndINotAI Royalty Card is a limited-edition "
        "digital + physical collectible for true believers in human connection.\n\n"
        "What you get:\n"
        "- Physical Royalty Card (numbered, shipped worldwide)\n"
        "- Digital NFT certificate on Base Mainnet\n"
        "- Lifetime Founding Member access (never pay monthly again)\n"
        "- Royalty Card holder badge — visible to all users\n"
        "- Exclusive Royalty Card holder events and meetups\n"
        "- Direct line to the founder (Joshua Coleman)\n"
        "- Name engraved in the YouAndINotAI Hall of Founders\n\n"
        "Only a handful will ever be minted. This is the ultimate show of support "
        "for a platform built on honesty, real people, and giving back.\n\n"
        "60% of all revenue goes directly to Shriners Children's Hospitals.\n"
        "#ForTheKids\n\n"
        "Visit: https://youandinotai.com"
    ),
}

LISTING_TEMPLATES = {
    "founding_member": FOUNDING_MEMBER_TEMPLATE,
    "royalty_card": ROYALTY_CARD_TEMPLATE,
}


class EbayPoster(BasePoster):
    name = "ebay"
    method = "browser"

    def _check_config(self):
        """Always enabled — eBay uses browser login, no API keys needed."""
        self.enabled = True

    def post(self, text, image_path=None, **kwargs):
        """
        Create an eBay listing.
        kwargs:
            listing_type: "founding_member" or "royalty_card" (default: "founding_member")
            title: Override listing title
            price: Override listing price
            description: Override listing description
        Returns (success: bool, result_message: str).
        """
        from social_engine.browser_manager import get_context, close_context

        listing_type = kwargs.get("listing_type", "founding_member")
        template = LISTING_TEMPLATES.get(listing_type, FOUNDING_MEMBER_TEMPLATE).copy()

        # Allow overrides
        title = kwargs.get("title", template["title"])
        price = kwargs.get("price", template["price"])
        description = kwargs.get("description", template["description"])
        # Append any extra text to description
        if text and text.strip():
            description = description + "\n\n" + text.strip()

        context = get_context(self.name)
        page = context.new_page()
        try:
            # Step 1: Navigate to eBay sell page
            log.info(f"[{self.name}] Navigating to ebay.com/sl/sell")
            page.goto("https://www.ebay.com/sl/sell", wait_until="domcontentloaded")
            page.wait_for_timeout(3000)

            # Check login status
            if not self._check_browser_login(page):
                from social_engine.platforms.base_poster import NOT_LOGGED_IN
                return False, f"{NOT_LOGGED_IN} eBay — run: python scripts/daemon-login.py"

            # Step 2: Enter listing title / product name
            log.info(f"[{self.name}] Setting listing title: {title[:60]}...")
            title_input = page.wait_for_selector(
                'input[placeholder*="Tell us what you\'re selling"], '
                'input[placeholder*="what are you selling"], '
                'input[id*="title"], '
                'input[name="title"], '
                'textarea[id*="title"]',
                timeout=10000,
            )
            title_input.click()
            title_input.fill(title)
            page.wait_for_timeout(1000)

            # Step 3: Click "Continue" or "Get started" to proceed
            log.info(f"[{self.name}] Clicking Continue/Get Started")
            try:
                continue_btn = page.wait_for_selector(
                    'button:has-text("Continue"), '
                    'button:has-text("Get started"), '
                    'button:has-text("Start listing")',
                    timeout=10000,
                )
                continue_btn.click()
                page.wait_for_timeout(3000)
            except Exception:
                # Some flows skip this step
                log.info(f"[{self.name}] No continue button — proceeding")
                page.keyboard.press("Enter")
                page.wait_for_timeout(2000)

            # Step 4: Select category
            log.info(f"[{self.name}] Searching for category: {template['category_search']}")
            try:
                cat_input = page.wait_for_selector(
                    'input[placeholder*="category"], '
                    'input[id*="category"], '
                    'input[aria-label*="category"]',
                    timeout=5000,
                )
                cat_input.fill(template["category_search"])
                page.wait_for_timeout(2000)

                # Select first matching category
                cat_option = page.wait_for_selector(
                    'li[role="option"], '
                    'div[role="option"], '
                    'ul[role="listbox"] li:first-child',
                    timeout=5000,
                )
                cat_option.click()
                page.wait_for_timeout(1000)
            except Exception:
                log.warning(f"[{self.name}] Could not set category — will use default/suggested")

            # Step 5: Upload images if provided
            if image_path and os.path.isfile(image_path):
                log.info(f"[{self.name}] Uploading listing image: {image_path}")
                try:
                    file_input = page.wait_for_selector(
                        'input[type="file"]', timeout=10000
                    )
                    file_input.set_input_files(image_path)
                    page.wait_for_timeout(3000)
                except Exception:
                    log.warning(f"[{self.name}] Could not upload image — continuing without it")

            # Step 6: Set condition
            log.info(f"[{self.name}] Setting condition: {template['condition']}")
            try:
                condition_select = page.wait_for_selector(
                    'select[id*="condition"], '
                    'button:has-text("Condition"), '
                    'div[data-testid="condition"] select',
                    timeout=5000,
                )
                condition_select.click()
                page.wait_for_timeout(500)
                condition_option = page.wait_for_selector(
                    f'option:has-text("{template["condition"]}"), '
                    f'li:has-text("{template["condition"]}"), '
                    f'div[role="option"]:has-text("{template["condition"]}")',
                    timeout=5000,
                )
                condition_option.click()
                page.wait_for_timeout(1000)
            except Exception:
                log.warning(f"[{self.name}] Could not set condition — continuing")

            # Step 7: Set description
            log.info(f"[{self.name}] Setting listing description")
            try:
                desc_area = page.wait_for_selector(
                    'textarea[id*="description"], '
                    'div[contenteditable="true"][class*="description"], '
                    'iframe[id*="description"]',
                    timeout=10000,
                )

                tag_name = desc_area.evaluate("el => el.tagName")
                if tag_name == "IFRAME":
                    # eBay sometimes uses an iframe for description
                    frame = desc_area.content_frame()
                    frame_body = frame.wait_for_selector("body", timeout=5000)
                    frame_body.click()
                    frame.keyboard.type(description, delay=5)
                elif tag_name == "TEXTAREA":
                    desc_area.fill(description)
                else:
                    desc_area.click()
                    page.keyboard.type(description, delay=5)
                page.wait_for_timeout(2000)
            except Exception:
                log.warning(f"[{self.name}] Could not set description — continuing")

            # Step 8: Set price
            log.info(f"[{self.name}] Setting price: ${price}")
            try:
                price_input = page.wait_for_selector(
                    'input[id*="price"], '
                    'input[name*="price"], '
                    'input[aria-label*="Price"], '
                    'input[placeholder*="Price"]',
                    timeout=10000,
                )
                price_input.click()
                price_input.fill("")
                price_input.fill(price)
                page.wait_for_timeout(1000)
            except Exception:
                log.warning(f"[{self.name}] Could not set price — will need manual adjustment")

            # Step 9: Click "List it" / "List item" button
            log.info(f"[{self.name}] Clicking List It button")
            list_btn = page.wait_for_selector(
                'button:has-text("List it"), '
                'button:has-text("List item"), '
                'button:has-text("Submit listing"), '
                'button[type="submit"]:has-text("List")',
                timeout=10000,
            )
            list_btn.click()
            page.wait_for_timeout(5000)

            # Step 10: Check for success
            try:
                page.wait_for_selector(
                    'text="Your listing is live", '
                    'text="Congratulations", '
                    'text="listed"',
                    timeout=15000,
                )
                log.info(f"[{self.name}] Listing created successfully")
            except Exception:
                log.warning(f"[{self.name}] Could not confirm listing — may still have succeeded")

            final_url = page.url
            log.info(f"[{self.name}] Final URL: {final_url}")
            return True, f"Listed successfully — {final_url}"

        except Exception as e:
            log.error(f"[{self.name}] Listing failed: {e}")
            return False, str(e)
        finally:
            try:
                page.close()
            except Exception:
                pass
