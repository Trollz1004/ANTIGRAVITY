"""Demo contact creation, QR code generation, and license key issuance."""

from __future__ import annotations

import hashlib
import json
import os
import uuid
from pathlib import Path

from .models import DemoContact, LicenseKey

DATA_DIR = Path(__file__).parent.parent.parent / "data"
DEMO_DB = DATA_DIR / "demo_contacts.json"
DEFAULT_LICENSE_SECRET = "antigravity-local-license-secret"


def _load_db() -> list[dict]:
    if DEMO_DB.exists():
        return json.loads(DEMO_DB.read_text())
    return []


def _save_db(records: list[dict]) -> None:
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    DEMO_DB.write_text(json.dumps(records, indent=2))


def _license_secret() -> str:
    return os.getenv("AI_SOLUTIONS_LICENSE_SECRET", DEFAULT_LICENSE_SECRET)


def _make_license_key(contact_id: str, product: str, *, admin: bool = False) -> str:
    tier = "admin" if admin else "standard"
    raw = f"{contact_id}:{product}:{tier}:{_license_secret()}"
    digest = hashlib.sha256(raw.encode()).hexdigest()
    return f"AIS-{product.upper().replace('_', '-').replace(' ', '-')[:12]}-{digest[:8]}-{digest[8:16]}-{digest[16:24]}"


def create_demo_contact(
    name: str,
    product: str,
    base_url: str = "https://youandinotai.com",
    email: str | None = None,
    phone: str | None = None,
    contact_id: str | None = None,
) -> DemoContact:
    contact = DemoContact(
        id=contact_id or str(uuid.uuid4()),
        name=name,
        email=email,
        phone=phone,
        product=product,
        purchase_url=f"{base_url}/buy/{product}",
    )

    qr_path = _generate_qr(contact)
    contact.qr_path = str(qr_path)

    records = _load_db()
    for idx, rec in enumerate(records):
        if rec["id"] == contact.id:
            records[idx] = contact.model_dump()
            _save_db(records)
            return contact
    records.append(contact.model_dump())
    _save_db(records)

    return contact


def _generate_qr(contact: DemoContact) -> Path:
    """Generate a QR code PNG for the contact's purchase URL."""
    try:
        import qrcode  # type: ignore[import]
    except ImportError:
        # Fall back to a text placeholder if qrcode not installed
        out = DATA_DIR / f"qr_{contact.id}.txt"
        DATA_DIR.mkdir(parents=True, exist_ok=True)
        out.write_text(contact.purchase_url)
        return out

    out = DATA_DIR / f"qr_{contact.id}.png"
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    qr = qrcode.QRCode(error_correction=qrcode.constants.ERROR_CORRECT_M)
    qr.add_data(contact.purchase_url)
    qr.make(fit=True)
    img = qr.make_image()
    img.save(str(out))
    return out


def issue_license(contact_id: str, *, admin: bool = False) -> LicenseKey | None:
    """Mark a contact as purchased and return a deterministic license key."""
    records = _load_db()
    for rec in records:
        if rec["id"] == contact_id:
            if rec.get("license_key"):
                return LicenseKey(
                    key=rec["license_key"],
                    contact_id=contact_id,
                    product=rec["product"],
                    issued_at=rec.get("created_at", ""),
                )
            key = _make_license_key(contact_id, rec["product"], admin=admin)
            rec["purchased"] = True
            rec["license_key"] = key
            rec["admin"] = admin
            _save_db(records)
            return LicenseKey(key=key, contact_id=contact_id, product=rec["product"])
    return None


def issue_license_for_purchase(
    *,
    purchase_id: str,
    buyer_email: str,
    product: str,
    buyer_name: str | None = None,
) -> LicenseKey:
    """Idempotently issue a key from a payment/receipt/session fingerprint."""
    existing = issue_license(purchase_id)
    if existing:
        return existing
    create_demo_contact(
        contact_id=purchase_id,
        name=buyer_name or buyer_email,
        email=buyer_email,
        product=product,
        base_url="https://ai-solutions.store",
    )
    key = issue_license(purchase_id)
    if key is None:  # defensive; create_demo_contact just wrote it
        raise RuntimeError("license issuance failed after purchase contact creation")
    return key


def issue_admin_license(
    *,
    buyer_email: str,
    product: str,
    admin_secret: str,
    buyer_name: str = "Josh Admin",
) -> LicenseKey:
    """Issue an admin/test key when the provided admin secret matches env."""
    expected = os.getenv("AI_SOLUTIONS_ADMIN_SECRET")
    if not expected or admin_secret != expected:
        raise PermissionError("invalid AI_SOLUTIONS_ADMIN_SECRET")
    contact_id = f"admin-{hashlib.sha256(f'{buyer_email}:{product}:{expected}'.encode()).hexdigest()[:24]}"
    existing = issue_license(contact_id, admin=True)
    if existing:
        return existing
    create_demo_contact(
        contact_id=contact_id,
        name=buyer_name,
        email=buyer_email,
        product=product,
        base_url="https://ai-solutions.store/admin",
    )
    key = issue_license(contact_id, admin=True)
    if key is None:
        raise RuntimeError("admin license issuance failed")
    return key


def list_contacts() -> list[DemoContact]:
    return [DemoContact(**r) for r in _load_db()]
