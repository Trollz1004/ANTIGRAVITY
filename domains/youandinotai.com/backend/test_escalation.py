import asyncio
import logging
import os
import sys

# Load env file manually for the script test
env_path = r"C:\Users\joshi\.antigravity-vault\vault-handoff\env-stash-from-documents\.env-not-for-github.txt"
if os.path.exists(env_path):
    with open(env_path, "r") as f:
        for line in f:
            if line.strip() and not line.startswith("#"):
                key, val = line.strip().split("=", 1)
                os.environ[key] = val

from app.models import SupportTicket, User
from app.support_service import notify_support_ticket
from app.config import get_settings

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
        status="open"
    )
    
    print(f"Triggering escalation notification to Telegram for {user.display_name}...")
    success = await notify_support_ticket(ticket=ticket, user=user, settings=settings)
    
    if success:
        print("SUCCESS! Notification sent to Telegram/Joshua.")
    else:
        print("FAILED to send notification.")

if __name__ == "__main__":
    asyncio.run(test_escalation())
