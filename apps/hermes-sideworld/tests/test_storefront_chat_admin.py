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


def _index() -> str:
    return INDEX.read_text(encoding="utf-8")


def _parser() -> LinkParser:
    parser = LinkParser()
    parser.feed(_index())
    return parser


def test_storefront_is_alternate processor_only_no_square_or_cashapp() -> None:
    html = _index().lower()
    assert "buy.alternate processor.com" in html
    assert "square.link" not in html
    assert "checkout.square.site" not in html
    assert "cash.app" not in html
    assert "$youandinotai" not in html


def test_all_scan_to_pay_qr_links_are_alternate processor_and_assets_exist() -> None:
    parser = _parser()
    qr_images = [img for img in parser.images if img.get("src", "").startswith("assets/qr/")]
    assert len(qr_images) == 5
    for img in qr_images:
        assert (STORE_ROOT / img["src"]).exists()
        assert "alternate processor QR" in img.get("alt", "")
    qr_links = [a["href"] for a in parser.links if a.get("class") == "qr-card"]
    assert len(qr_links) == 5
    assert all(link.startswith("https://buy.alternate processor.com/") for link in qr_links)


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
