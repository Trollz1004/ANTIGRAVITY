"""Storefront invariants for admin testing and SupportClaw chat integration."""

from __future__ import annotations

from html.parser import HTMLParser
from pathlib import Path

STORE_ROOT = Path(__file__).resolve().parents[3] / "_deploy" / "ai-solutions-store"
INDEX = STORE_ROOT / "index.html"


class LinkParser(HTMLParser):
    def __init__(self) -> None:
        super().__init__()
        self.links: list[dict[str, str]] = []
        self.images: list[dict[str, str]] = []

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        data = {k: v or "" for k, v in attrs}
        if tag == "a":
            self.links.append(data)
        if tag == "img":
            self.images.append(data)


class ProductCatalogParser(HTMLParser):
    def __init__(self) -> None:
        super().__init__()
        self.in_apps = False
        self.in_card = False
        self.in_h3 = False
        self.card_count = 0
        self.card_titles: list[str] = []
        self._current_title: list[str] = []

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        data = {k: v or "" for k, v in attrs}
        if tag == "section" and data.get("id") == "apps":
            self.in_apps = True
        if self.in_apps and tag == "article" and "card" in data.get("class", "").split():
            self.in_card = True
            self.card_count += 1
        if self.in_card and tag == "h3":
            self.in_h3 = True
            self._current_title = []

    def handle_data(self, data: str) -> None:
        if self.in_h3:
            self._current_title.append(data)

    def handle_endtag(self, tag: str) -> None:
        if tag == "h3" and self.in_h3:
            self.card_titles.append("".join(self._current_title).strip())
            self.in_h3 = False
        if tag == "article" and self.in_card:
            self.in_card = False
        if tag == "section" and self.in_apps:
            self.in_apps = False


def _index() -> str:
    return INDEX.read_text(encoding="utf-8")


def _parser() -> LinkParser:
    parser = LinkParser()
    parser.feed(_index())
    return parser


def _catalog_parser() -> ProductCatalogParser:
    parser = ProductCatalogParser()
    parser.feed(_index())
    return parser


FIVE_Q3_SERVICE_LISTINGS = [
    "BotShield Checkout Guard Setup",
    "AI Storefront Starter Setup",
    "SupportClaw Customer Support Setup",
    "Content Droid Automation Suite Setup",
    "Agent Operations Kit + Uptime Review",
]


def test_storefront_is_stripe_only_no_square_or_cashapp() -> None:
    html = _index().lower()
    assert "buy.stripe.com" in html
    assert "square.link" not in html
    assert "checkout.square.site" not in html
    assert "cash.app" not in html
    assert "$youandinotai" not in html


def test_public_catalog_presents_exactly_five_q3_ai_service_listings() -> None:
    parser = _catalog_parser()
    assert parser.card_count == 5
    assert parser.card_titles == FIVE_Q3_SERVICE_LISTINGS


def test_public_catalog_excludes_previous_non_q3_listing_labels_and_blocked_terms() -> None:
    html = _index().lower()
    for old_label in [
        "founding member stack",
        "content droid suite",
        "agent operations kit</h3>",
        "white-label platform modules",
        "human verification layer",
        "tra marketplace",
        "royalty deck",
    ]:
        assert old_label not in html
    for blocked_term in [
        "charity",
        "donation",
        "fundraising",
        "investment",
        "equity",
        "ownership",
        "e-waste",
        "onlinerecycle",
        "royalty",
    ]:
        assert blocked_term not in html


def test_all_scan_to_pay_qr_links_are_stripe_and_assets_exist() -> None:
    parser = _parser()
    qr_images = [img for img in parser.images if img.get("src", "").startswith("assets/qr/")]
    assert len(qr_images) == 5
    for img in qr_images:
        assert (STORE_ROOT / img["src"]).exists()
        assert "Stripe QR" in img.get("alt", "")
    qr_links = [a["href"] for a in parser.links if a.get("class") == "qr-card"]
    assert len(qr_links) == 5
    assert all(link.startswith("https://buy.stripe.com/") for link in qr_links)
    html = _index()
    for label in FIVE_Q3_SERVICE_LISTINGS:
        assert label in html


def test_admin_key_tester_is_on_site_without_exposing_secret() -> None:
    html = _index()
    assert "id=\"admin-key-input\"" in html
    assert "id=\"admin-test-result\"" in html
    assert "validateAdminKey" in html
    assert "74e610a0360cfba3977c1f17cdf3d9befac953330e9e76531894ea4c70e72794" in html
    assert "AIS-ALL-ACCESS-02589c0a-86356390-5fed7e2d" not in html


def test_support_chat_widget_targets_supportclaw_bridge_contract() -> None:
    html = _index()
    assert "id=\"support-chat-widget\"" in html
    assert "SupportClaw" in html
    assert "sendSupportMessage" in html
    assert "sessionId" in html
    assert "should_escalate" in html
    assert "/api/support/chat" in html


def test_pages_function_for_support_chat_exists() -> None:
    fn = STORE_ROOT / "functions" / "api" / "support" / "chat.js"
    assert fn.exists()
    source = fn.read_text(encoding="utf-8")
    assert "SUPPORTCLAW_URL" in source
    assert "SUPPORTCLAW_TOKEN" in source
    assert "sessionId" in source
    assert "should_escalate" in source
