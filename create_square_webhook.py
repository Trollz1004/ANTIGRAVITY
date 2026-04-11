import asyncio
import json
import uuid
import sys

sys.path.insert(0, "C:/ANTIGRAVITY/youandinotai-api")
from app.config import get_settings
import httpx

async def main():
    settings = get_settings()
    token = settings.square_access_token
    async with httpx.AsyncClient() as client:
        res = await client.post(
            "https://connect.squareup.com/v2/webhooks/subscriptions",
            headers={
                "Authorization": f"Bearer {token}",
                "Square-Version": "2024-02-22",
                "Content-Type": "application/json"
            },
            json={
                "idempotency_key": str(uuid.uuid4()),
                "subscription": {
                    "name": "Bot-Shield Webhook Handler",
                    "event_types": [
                        "payment.created",
                        "payment.updated",
                        "subscription.created",
                        "subscription.updated"
                    ],
                    "notification_url": "https://api.youandinotai.com/api/v1/webhooks/square-payment",
                    "api_version": "2024-02-22"
                }
            }
        )
        print(f"Status: {res.status_code}")
        try:
            print(json.dumps(res.json(), indent=2))
        except:
            print(res.text)

if __name__ == '__main__':
    asyncio.run(main())
