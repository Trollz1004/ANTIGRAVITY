import asyncio
import json
import os
import sys

sys.path.insert(0, "C:/ANTIGRAVITY/youandinotai-api")
from app.config import get_settings
import httpx

async def main():
    settings = get_settings()
    token = settings.square_access_token
    async with httpx.AsyncClient() as client:
        res = await client.get(
            "https://connect.squareup.com/v2/webhooks/subscriptions",
            headers={
                "Authorization": f"Bearer {token}",
                "Square-Version": "2024-02-22",
                "Content-Type": "application/json"
            }
        )
        print(f"Status: {res.status_code}")
        try:
            print(json.dumps(res.json(), indent=2))
        except:
            pass

if __name__ == '__main__':
    asyncio.run(main())
