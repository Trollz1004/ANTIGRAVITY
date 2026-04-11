import asyncio
import os
import sys

sys.path.insert(0, "C:/ANTIGRAVITY/youandinotai-api")
from app.config import get_settings
import httpx
import json

async def main():
    settings = get_settings()
    token = settings.square_access_token
    
    async with httpx.AsyncClient() as client:
        # Step 2: Get subscriptions using version 2024-02-22 first, and if 500, try 2025-07-16
        print("Fetching subscriptions...")
        res = await client.get(
            "https://connect.squareup.com/v2/webhooks/subscriptions",
            params={"include_disabled": "true"},
            headers={
                "Authorization": f"Bearer {token}",
                "Square-Version": "2025-07-16",
                "Content-Type": "application/json"
            }
        )
        
        print(f"Status: {res.status_code}")
        try:
            data = res.json()
            print(json.dumps(data, indent=2))
        except:
            print(res.text)
            return

        if res.status_code == 200 and "subscriptions" in data:
            subscriptions = data["subscriptions"]
            if not subscriptions:
                print("No subscriptions found.")
            for sub in subscriptions:
                sub_id = sub["id"]
                print(f"Deleting subscription {sub_id}...")
                del_res = await client.delete(
                    f"https://connect.squareup.com/v2/webhooks/subscriptions/{sub_id}",
                    headers={
                        "Authorization": f"Bearer {token}",
                        "Square-Version": "2025-07-16",
                    }
                )
                print(f"Delete {sub_id} Status: {del_res.status_code}")
        else:
            print("Failed or no subscriptions field.")

if __name__ == '__main__':
    asyncio.run(main())
