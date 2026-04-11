import asyncio
import httpx
import json
import os

async def main():
    token = os.environ.get("SQUARE_ACCESS_TOKEN", "")
    if not token:
        raise RuntimeError("SQUARE_ACCESS_TOKEN must be set in the environment.")
    
    async with httpx.AsyncClient() as client:
        # Step 1: Get subscriptions
        print("Fetching subscriptions with 2025-07-16...")
        res = await client.get(
            "https://connect.squareup.com/v2/webhooks/subscriptions",
            params={"include_disabled": "true"},
            headers={
                "Authorization": f"Bearer {token}",
                "Square-Version": "2025-07-16",
                "Content-Type": "application/json"
            }
        )
        
        print(f"Fetch Status: {res.status_code}")
        if res.status_code != 200:
            print(res.text)
            
        data = res.json()
        print(data)

if __name__ == '__main__':
    asyncio.run(main())
