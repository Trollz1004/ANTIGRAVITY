import asyncio
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
            }
        )
        print(f"Status no version: {res.status_code}")
        try:
            print(res.json())
        except:
            print(res.text)

if __name__ == '__main__':
    asyncio.run(main())
