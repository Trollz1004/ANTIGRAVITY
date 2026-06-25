"""Email delivery helpers for AI Solutions Store fulfillment.

The module intentionally has a console fallback so webhook tests and local admin
issuance work before a production SMTP/transactional provider is wired.
"""

from __future__ import annotations

import os
import smtplib
from dataclasses import dataclass
from email.message import EmailMessage


@dataclass(frozen=True)
class DeliveryResult:
    """Result of an attempted email handoff."""

    delivered: bool
    provider: str
    detail: str


FORBIDDEN_PUBLIC_TERMS = ("donate", "donation", "charity", "solicitation", "giving back", "disbursement")


def build_license_email(*, buyer_email: str, product: str, license_key: str, admin: bool = False) -> tuple[str, str]:
    """Return subject/body for a license-key handoff email."""
    subject = f"Your AI Solutions Store key for {product}"
    access_type = "ADMIN TEST" if admin else "PURCHASE"
    body = f"""AI Solutions Store license issued

Access type: {access_type}
Product: {product}
Buyer email: {buyer_email}
License key: {license_key}

Activation:
1. Save this email.
2. Open the product package or onboarding link you received after checkout.
3. Paste the license key when prompted.
4. If anything fails, reply to this email with your Stripe receipt number.

Support: support@aidoesitall.website
"""
    lowered = body.lower()
    hits = [term for term in FORBIDDEN_PUBLIC_TERMS if term in lowered]
    if hits:
        raise ValueError(f"License email contains blocked public terms: {hits}")
    return subject, body


def send_license_email(*, buyer_email: str, product: str, license_key: str, admin: bool = False) -> DeliveryResult:
    """Send a license key email.

    Required SMTP env for real delivery:
    - AI_SOLUTIONS_SMTP_HOST
    - AI_SOLUTIONS_SMTP_USER
    - AI_SOLUTIONS_SMTP_PASSWORD

    Optional:
    - AI_SOLUTIONS_SMTP_PORT (default 587)
    - AI_SOLUTIONS_FROM_EMAIL (default support@aidoesitall.website)
    """
    subject, body = build_license_email(
        buyer_email=buyer_email,
        product=product,
        license_key=license_key,
        admin=admin,
    )
    host = os.getenv("AI_SOLUTIONS_SMTP_HOST")
    user = os.getenv("AI_SOLUTIONS_SMTP_USER")
    password = os.getenv("AI_SOLUTIONS_SMTP_PASSWORD")
    sender = os.getenv("AI_SOLUTIONS_FROM_EMAIL", "support@aidoesitall.website")
    if not (host and user and password):
        print("--- AI SOLUTIONS LICENSE EMAIL (console fallback) ---")
        print(f"To: {buyer_email}")
        print(f"From: {sender}")
        print(f"Subject: {subject}")
        print(body)
        return DeliveryResult(delivered=False, provider="console", detail="SMTP env missing; printed email body")

    msg = EmailMessage()
    msg["To"] = buyer_email
    msg["From"] = sender
    msg["Subject"] = subject
    msg.set_content(body)
    port = int(os.getenv("AI_SOLUTIONS_SMTP_PORT", "587"))
    with smtplib.SMTP(host, port, timeout=20) as smtp:
        smtp.starttls()
        smtp.login(user, password)
        smtp.send_message(msg)
    return DeliveryResult(delivered=True, provider="smtp", detail=f"sent via {host}")
