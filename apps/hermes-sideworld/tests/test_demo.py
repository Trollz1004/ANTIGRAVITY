"""Tests for the demo contact and license key pipeline."""

from __future__ import annotations

import json

import pytest

from hermes_sideworld.demo import create_demo_contact, issue_license, list_contacts


@pytest.fixture(autouse=True)
def isolated_db(tmp_path, monkeypatch):
    """Redirect the demo DB and data dir to a temp directory for each test."""
    import hermes_sideworld.demo as demo_mod

    monkeypatch.setattr(demo_mod, "DATA_DIR", tmp_path)
    monkeypatch.setattr(demo_mod, "DEMO_DB", tmp_path / "demo_contacts.json")
    yield tmp_path


def test_create_demo_contact_persists(isolated_db):
    contact = create_demo_contact(name="Jane Doe", product="platform-pro", email="jane@example.com")
    assert contact.id
    assert contact.purchase_url == "https://youandinotai.com/buy/platform-pro"
    assert contact.qr_path is not None

    db_path = isolated_db / "demo_contacts.json"
    assert db_path.exists()
    records = json.loads(db_path.read_text())
    assert len(records) == 1
    assert records[0]["name"] == "Jane Doe"


def test_issue_license_generates_key(isolated_db):
    contact = create_demo_contact(name="Bob", product="starter")
    lic = issue_license(contact.id)
    assert lic is not None
    assert lic.key
    assert lic.product == "starter"
    assert lic.contact_id == contact.id


def test_issue_license_idempotent(isolated_db):
    contact = create_demo_contact(name="Alice", product="pro")
    lic1 = issue_license(contact.id)
    lic2 = issue_license(contact.id)
    assert lic1.key == lic2.key


def test_issue_license_missing_contact(isolated_db):
    result = issue_license("00000000-0000-0000-0000-000000000000")
    assert result is None


def test_list_contacts(isolated_db):
    create_demo_contact(name="Lead A", product="pro")
    create_demo_contact(name="Lead B", product="starter")
    contacts = list_contacts()
    assert len(contacts) == 2
    names = {c.name for c in contacts}
    assert names == {"Lead A", "Lead B"}


def test_purchased_flag_set(isolated_db):
    contact = create_demo_contact(name="Buyer", product="pro")
    assert not contact.purchased
    issue_license(contact.id)
    contacts = list_contacts()
    buyer = next(c for c in contacts if c.name == "Buyer")
    assert buyer.purchased
    assert buyer.license_key is not None
