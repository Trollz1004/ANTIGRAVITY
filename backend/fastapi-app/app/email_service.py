"""Transactional email helpers for the YouAndINotAI backend."""

from __future__ import annotations

import asyncio
import html
import logging
import smtplib
from email.message import EmailMessage

from app.config import Settings

logger = logging.getLogger(__name__)


def _smtp_is_configured(settings: Settings) -> bool:
    has_host = bool(str(settings.smtp_host or "").strip())
    has_from = bool(str(settings.email_from_address or "").strip())
    has_user = bool(str(settings.smtp_username or "").strip())
    has_password = bool(str(settings.smtp_password or "").strip())

    if not has_host or not has_from:
        return False

    if has_user != has_password:
        logger.warning(
            "SMTP credentials are incomplete; skipping welcome email delivery."
        )
        return False

    return True


def _build_founder_badge_subject() -> str:
    return "Founder Badge unlocked"


def _build_email_message(
    *,
    recipients: list[str],
    subject: str,
    text_body: str,
    html_body: str,
    settings: Settings,
) -> EmailMessage:
    message = EmailMessage()
    message["To"] = ", ".join(recipients)
    message["From"] = f"{settings.email_from_name} <{settings.email_from_address}>"
    if settings.email_reply_to:
        message["Reply-To"] = settings.email_reply_to
    message["Subject"] = subject
    message.set_content(text_body)
    message.add_alternative(html_body, subtype="html")
    return message


def _build_founder_badge_text(
    *,
    display_name: str | None,
    app_url: str,
) -> str:
    name = (display_name or "there").strip() or "there"
    return (
        f"Hi {name},\n\n"
        "Your Founder Badge is live.\n\n"
        "Your $1 Bot-Shield payment is complete, and your verified-human status is active.\n\n"
        "What this unlocks:\n"
        "- Founder Badge on your account\n"
        "- Verified-human access for protected platform features\n"
        "- Early standing as the platform moves toward launch\n\n"
        "Platform note:\n"
        "- Your payment is for platform access and verification\n"
        "- Any later mission support follows the founder's current operating policy\n\n"
        f"Open the platform: {app_url}\n\n"
        "Josh Coleman\n"
        "Founder, YouAndINotAI\n"
    )


def _build_founder_badge_html(
    *,
    display_name: str | None,
    app_url: str,
) -> str:
    name = html.escape((display_name or "there").strip() or "there")
    safe_url = html.escape(app_url, quote=True)
    return f"""
<div style="font-family:Arial,sans-serif;max-width:640px;margin:0 auto;color:#1f2937;line-height:1.6;">
  <div style="background:#111827;padding:28px 24px;text-align:center;border-radius:16px 16px 0 0;">
    <div style="color:#f9fafb;font-size:28px;font-weight:700;">YouAndINotAI</div>
    <div style="color:#f472b6;font-size:12px;letter-spacing:2px;text-transform:uppercase;margin-top:6px;">
      Founder Badge unlocked
    </div>
  </div>
  <div style="border:1px solid #e5e7eb;border-top:none;border-radius:0 0 16px 16px;padding:28px 24px;background:#ffffff;">
    <p style="margin:0 0 16px;">Hi {name},</p>
    <p style="margin:0 0 16px;">
      Your <strong>Founder Badge</strong> is live. Your $1 Bot-Shield payment is complete,
      and your verified-human status is active.
    </p>
    <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:12px;padding:16px 18px;margin:20px 0;">
      <div style="font-weight:700;margin-bottom:8px;">What this unlocks</div>
      <ul style="margin:0;padding-left:18px;">
        <li>Founder Badge on your account</li>
        <li>Verified-human access for protected platform features</li>
        <li>Early standing as the platform moves toward launch</li>
      </ul>
    </div>
    <div style="background:#fff1f2;border:1px solid #fbcfe8;border-radius:12px;padding:16px 18px;margin:20px 0;">
      <div style="font-weight:700;margin-bottom:8px;">Platform note</div>
      <div>Your payment is for platform access and verification.</div>
      <div>Any later mission support follows the founder's current operating policy.</div>
    </div>
    <p style="margin:20px 0;">
      <a href="{safe_url}" style="display:inline-block;background:#ec4899;color:#ffffff;text-decoration:none;padding:12px 20px;border-radius:999px;font-weight:700;">
        Open YouAndINotAI
      </a>
    </p>
    <p style="margin:24px 0 0;">
      Josh Coleman<br>
      Founder, YouAndINotAI
    </p>
  </div>
</div>
""".strip()


def _build_waitlist_confirmation_subject() -> str:
    return "You’re on the YouAndINotAI waitlist"


def _build_waitlist_confirmation_text(
    *,
    recipient_email: str,
    app_url: str,
) -> str:
    return (
        "You’re on the YouAndINotAI waitlist.\n\n"
        "This is a confirmation for your launch-update signup.\n"
        "No charge was made and no account was created from this form.\n\n"
        f"We’ll send future updates to: {recipient_email}\n"
        f"Site: {app_url}\n\n"
        "If you did not request this, you can ignore this email.\n\n"
        "Josh Coleman\n"
        "Founder, YouAndINotAI\n"
    )


def _build_waitlist_confirmation_html(
    *,
    recipient_email: str,
    app_url: str,
) -> str:
    safe_email = html.escape(recipient_email)
    safe_url = html.escape(app_url, quote=True)
    return f"""
<div style="font-family:Arial,sans-serif;max-width:640px;margin:0 auto;color:#1f2937;line-height:1.6;">
  <div style="background:#111827;padding:28px 24px;text-align:center;border-radius:16px 16px 0 0;">
    <div style="color:#f9fafb;font-size:28px;font-weight:700;">YouAndINotAI</div>
    <div style="color:#f472b6;font-size:12px;letter-spacing:2px;text-transform:uppercase;margin-top:6px;">
      Waitlist confirmation
    </div>
  </div>
  <div style="border:1px solid #e5e7eb;border-top:none;border-radius:0 0 16px 16px;padding:28px 24px;background:#ffffff;">
    <p style="margin:0 0 16px;">You’re on the YouAndINotAI waitlist.</p>
    <p style="margin:0 0 16px;">
      This confirmation is for your launch-update signup only. No charge was made and no account was created from this form.
    </p>
    <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:12px;padding:16px 18px;margin:20px 0;">
      <div style="font-weight:700;margin-bottom:8px;">Signup address</div>
      <div>{safe_email}</div>
    </div>
    <p style="margin:20px 0;">
      <a href="{safe_url}" style="display:inline-block;background:#ec4899;color:#ffffff;text-decoration:none;padding:12px 20px;border-radius:999px;font-weight:700;">
        Visit YouAndINotAI
      </a>
    </p>
    <p style="margin:0;">If you did not request this, you can ignore this email.</p>
    <p style="margin:24px 0 0;">
      Josh Coleman<br>
      Founder, YouAndINotAI
    </p>
  </div>
</div>
""".strip()


def _waitlist_operator_recipients(settings: Settings) -> list[str]:
    recipients: list[str] = []
    for candidate in [
        *settings.support_operator_email_list,
        str(settings.email_reply_to or "").strip().lower(),
        str(settings.email_from_address or "").strip().lower(),
    ]:
        normalized = candidate.strip().lower()
        if normalized and normalized not in recipients:
            recipients.append(normalized)
    return recipients


def _build_waitlist_notification_subject() -> str:
    return "New YouAndINotAI waitlist signup"


def _build_waitlist_notification_text(
    *,
    recipient_email: str,
    app_url: str,
) -> str:
    return (
        "A new YouAndINotAI waitlist signup was received.\n\n"
        f"Email: {recipient_email}\n"
        f"Site: {app_url}\n"
    )


def _build_waitlist_notification_html(
    *,
    recipient_email: str,
    app_url: str,
) -> str:
    safe_email = html.escape(recipient_email)
    safe_url = html.escape(app_url, quote=True)
    return f"""
<div style="font-family:Arial,sans-serif;max-width:640px;margin:0 auto;color:#1f2937;line-height:1.6;">
  <div style="background:#111827;padding:24px;color:#f9fafb;font-size:24px;font-weight:700;">
    New YouAndINotAI waitlist signup
  </div>
  <div style="border:1px solid #e5e7eb;border-top:none;padding:24px;background:#ffffff;">
    <p style="margin:0 0 12px;"><strong>Email:</strong> {safe_email}</p>
    <p style="margin:0;"><strong>Site:</strong> <a href="{safe_url}">{safe_url}</a></p>
  </div>
</div>
""".strip()


def _deliver_email(message: EmailMessage, settings: Settings) -> None:
    if settings.smtp_use_ssl:
        with smtplib.SMTP_SSL(
            settings.smtp_host,
            settings.smtp_port,
            timeout=30,
        ) as server:
            if settings.smtp_username and settings.smtp_password:
                server.login(settings.smtp_username, settings.smtp_password)
            server.send_message(message)
        return

    with smtplib.SMTP(
        settings.smtp_host,
        settings.smtp_port,
        timeout=30,
    ) as server:
        server.ehlo()
        if settings.smtp_use_starttls:
            server.starttls()
            server.ehlo()
        if settings.smtp_username and settings.smtp_password:
            server.login(settings.smtp_username, settings.smtp_password)
        server.send_message(message)


async def send_welcome_email(
    *,
    recipient_email: str,
    display_name: str | None,
    settings: Settings,
) -> bool:
    """Deliver the Founder Badge welcome email when SMTP is configured."""
    if not _smtp_is_configured(settings):
        logger.info(
            "Skipping Founder Badge welcome email; SMTP is not configured for recipient=%s",
            recipient_email,
        )
        return False

    app_url = (
        str(settings.app_url or "https://youandinotai.com").strip()
        or "https://youandinotai.com"
    )
    text_body = _build_founder_badge_text(
        display_name=display_name,
        app_url=app_url,
    )
    html_body = _build_founder_badge_html(
        display_name=display_name,
        app_url=app_url,
    )
    message = _build_email_message(
        recipients=[recipient_email],
        subject=_build_founder_badge_subject(),
        text_body=text_body,
        html_body=html_body,
        settings=settings,
    )

    await asyncio.to_thread(_deliver_email, message, settings)
    logger.info("Founder Badge welcome email sent to %s", recipient_email)
    return True


async def send_waitlist_confirmation(
    *,
    recipient_email: str,
    settings: Settings,
) -> bool:
    if not _smtp_is_configured(settings):
        logger.info(
            "Skipping waitlist confirmation email; SMTP is not configured for recipient=%s",
            recipient_email,
        )
        return False

    app_url = (
        str(settings.app_url or "https://youandinotai.com").strip()
        or "https://youandinotai.com"
    )
    message = _build_email_message(
        recipients=[recipient_email],
        subject=_build_waitlist_confirmation_subject(),
        text_body=_build_waitlist_confirmation_text(
            recipient_email=recipient_email,
            app_url=app_url,
        ),
        html_body=_build_waitlist_confirmation_html(
            recipient_email=recipient_email,
            app_url=app_url,
        ),
        settings=settings,
    )
    await asyncio.to_thread(_deliver_email, message, settings)
    logger.info("Waitlist confirmation email sent to %s", recipient_email)
    return True


async def send_waitlist_operator_notice(
    *,
    recipient_email: str,
    settings: Settings,
) -> bool:
    if not _smtp_is_configured(settings):
        return False

    recipients = _waitlist_operator_recipients(settings)
    if not recipients:
        logger.info(
            "Skipping waitlist operator notice; no operator recipients configured for %s",
            recipient_email,
        )
        return False

    app_url = (
        str(settings.app_url or "https://youandinotai.com").strip()
        or "https://youandinotai.com"
    )
    message = _build_email_message(
        recipients=recipients,
        subject=_build_waitlist_notification_subject(),
        text_body=_build_waitlist_notification_text(
            recipient_email=recipient_email,
            app_url=app_url,
        ),
        html_body=_build_waitlist_notification_html(
            recipient_email=recipient_email,
            app_url=app_url,
        ),
        settings=settings,
    )
    await asyncio.to_thread(_deliver_email, message, settings)
    logger.info("Waitlist operator notice sent for %s", recipient_email)
    return True


sendWelcomeEmail = send_welcome_email
