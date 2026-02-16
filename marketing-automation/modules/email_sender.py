"""
Email automation module.
Uses Gmail SMTP (already configured on SABRETOOTH) or SendGrid for bulk.
"""
import smtplib
import logging
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from datetime import datetime, timedelta

from config import (
    SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS,
    FROM_EMAIL, FROM_NAME, SENDGRID_API_KEY,
    ENABLE_EMAIL_GMAIL, ENABLE_EMAIL_SENDGRID, LAUNCH_DATE,
)
from modules import database as db
from modules.content_library import EMAIL_SEQUENCES

log = logging.getLogger("email")


def send_via_gmail(recipient: str, subject: str, body: str) -> bool:
    """Send a single email via Gmail SMTP."""
    if not ENABLE_EMAIL_GMAIL:
        log.warning("Gmail SMTP not configured (GMAIL_APP_PASSWORD missing)")
        return False

    msg = MIMEMultipart("alternative")
    msg["From"] = f"{FROM_NAME} <{SMTP_USER}>"
    msg["To"] = recipient
    msg["Subject"] = subject

    # Plain text version
    msg.attach(MIMEText(body, "plain"))

    # Simple HTML version (wrap plain text in basic HTML)
    html_body = body.replace("\n", "<br>\n")
    html = f"""<html><body style="font-family: Georgia, serif; line-height: 1.6; max-width: 600px; margin: 0 auto; padding: 20px;">
{html_body}
</body></html>"""
    msg.attach(MIMEText(html, "html"))

    try:
        with smtplib.SMTP(SMTP_HOST, SMTP_PORT) as server:
            server.starttls()
            server.login(SMTP_USER, SMTP_PASS)
            server.send_message(msg)
        log.info(f"Email sent to {recipient}: {subject}")
        return True
    except Exception as e:
        log.error(f"Gmail send failed for {recipient}: {e}")
        return False


def send_via_sendgrid(recipient: str, subject: str, body: str) -> bool:
    """Send via SendGrid API (for bulk sending)."""
    if not ENABLE_EMAIL_SENDGRID:
        log.warning("SendGrid not configured")
        return False

    import requests
    url = "https://api.sendgrid.com/v3/mail/send"
    headers = {
        "Authorization": f"Bearer {SENDGRID_API_KEY}",
        "Content-Type": "application/json"
    }
    data = {
        "personalizations": [{"to": [{"email": recipient}]}],
        "from": {"email": FROM_EMAIL, "name": FROM_NAME},
        "subject": subject,
        "content": [{"type": "text/plain", "value": body}]
    }
    try:
        resp = requests.post(url, headers=headers, json=data, timeout=30)
        if resp.status_code == 202:
            log.info(f"SendGrid email sent to {recipient}")
            return True
        else:
            log.error(f"SendGrid error {resp.status_code}: {resp.text}")
            return False
    except Exception as e:
        log.error(f"SendGrid exception: {e}")
        return False


def send_email(recipient: str, subject: str, body: str) -> bool:
    """Send email using best available method."""
    # if ENABLE_EMAIL_SENDGRID:
    #    return send_via_sendgrid(recipient, subject, body)
    if ENABLE_EMAIL_GMAIL:
        return send_via_gmail(recipient, subject, body)
    else:
        log.error("No email provider configured!")
        return False


def schedule_sequence_for_subscriber(email: str, first_name: str):
    """Schedule the full email drip sequence for a new subscriber."""
    launch = datetime.strptime(LAUNCH_DATE, "%Y-%m-%d %H:%M:%S")

    for seq_name, seq in EMAIL_SEQUENCES.items():
        subject = seq["subject"]
        body = seq["body"].format(first_name=first_name or "there")
        offset = seq["day_offset"]

        if offset is None:
            # Send immediately
            send_time = datetime.now().isoformat()
        else:
            send_time = (launch + timedelta(days=offset)).replace(hour=10, minute=0).isoformat()

        db.insert_email(email, first_name, subject, body, send_time)

    log.info(f"Scheduled {len(EMAIL_SEQUENCES)} emails for {email}")


def process_pending_emails():
    """Check for and send pending emails."""
    pending = db.get_pending_emails()
    sent_count = 0

    for email_id, recipient, first_name, subject, body in pending:
        success = send_email(recipient, subject, body)
        if success:
            db.mark_email_sent(email_id)
            db.log_metric("email_sent", 1)
            sent_count += 1
        else:
            db.log_metric("email_failed", 1)

    if sent_count:
        log.info(f"Sent {sent_count} emails this cycle")
    return sent_count
