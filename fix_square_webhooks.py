import asyncio
import httpx
import json
import uuid
import os

async def main():
    token = os.environ.get("SQUARE_ACCESS_TOKEN", "")
    if not token:
        raise RuntimeError("SQUARE_ACCESS_TOKEN must be set in the environment.")
    
    async with httpx.AsyncClient() as client:
        # Step 1: Get subscriptions
        print("Fetching subscriptions...")
        res = await client.get(
            "https://connect.squareup.com/v2/webhooks/subscriptions",
            params={"include_disabled": "true"},
            headers={
                "Authorization": f"Bearer {token}",
                "Square-Version": "2024-02-22",
                "Content-Type": "application/json"
            }
        )
        
        print(f"Fetch Status: {res.status_code}")
        if res.status_code != 200:
            print(res.text)
            return
            
        data = res.json()
        
        subscriptions = data.get("subscriptions", [])
        if not subscriptions:
            print("No subscriptions found.")
        
        for sub in subscriptions:
            sub_id = sub["id"]
            print(f"Deleting subscription {sub_id}...")
            del_res = await client.delete(
                f"https://connect.squareup.com/v2/webhooks/subscriptions/{sub_id}",
                headers={
                    "Authorization": f"Bearer {token}",
                    "Square-Version": "2024-02-22",
                }
            )
            print(f"Delete {sub_id} Status: {del_res.status_code}")
            
        # Step 2: Create new subscription
        print("Creating new webhook subscription...")
        create_res = await client.post(
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
        print(f"Create Status: {create_res.status_code}")
        if create_res.status_code == 200:
            new_sub = create_res.json()["subscription"]
            print(f"\nSUCCESS! New Webhook created.")
            print(f"Signature Key: {new_sub['signature_key']}")
        else:
            print(create_res.text)

if __name__ == '__main__':
    asyncio.run(main())
