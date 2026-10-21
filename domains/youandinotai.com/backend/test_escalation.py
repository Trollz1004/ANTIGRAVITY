import asyncio
import logging
import os

# Load env file manually for the script test
env_path = r"C:\Users\joshi\.antigravity-vault\vault-handoff\env-stash-from-documents\.env-not-for-github.txt"
if os.path.exists(env_path):
    with open(env_path) as f:
        for line in f:
            if line.strip() and not line.startswith("#"):
                key, val = line.strip().split("=", 1)
                os.environ[key] = val

from app.config import get_settings  # noqa: E402
from app.models import SupportTicket  # noqa: E402
from app.support_service import notify_support_ticket  # noqa: E402

logging.basicConfig(level=logging.INFO)


async def test_escalation():
    settings = get_settings()

    class MockUser:
        id = "test-user-id"
        display_name = "Joshua Test"
        email = "test@youandinotai.com"

    user = MockUser()

    ticket = SupportTicket(
        id="TEST-TICKET-999",
        user_id=user.id,
        category="safety",
        escalation_reason="safety_review",
        customer_message="I need to report unsafe behavior: This is an automated escalation test.",
        bot_response="I'm escalating this to a human review queue now.",
        status="open",
    )

    print(
        f"Triggering escalation notification to WhatsApp/Telegram for {user.display_name}..."
    )
    success = await notify_support_ticket(ticket=ticket, user=user, settings=settings)

    if success:
        print("SUCCESS! Notification sent to WhatsApp/Telegram.")
    else:
        print("FAILED to send notification. Please check your API keys.")


if __name__ == "__main__":
    asyncio.run(test_escalation())
