import asyncio
import json
import os
from pprint import pprint

# Set up the Python path for local imports
import sys
sys.path.insert(0, "C:/ANTIGRAVITY/youandinotai-api")

from app.config import get_settings
import httpx

async def main():
    settings = get_settings()
    token = settings.square_access_token
    print(f"Token present: {bool(token)}")
    if not token:
        print("No token.")
        return

    async with httpx.AsyncClient(timeout=10) as client:
        res = await client.get(
            "https://connect.squareup.com/v2/webhooks/subscriptions",
            headers={
                "Authorization": f"Bearer {token}",
                "Square-Version": "2024-01-18",
                "Content-Type": "application/json"
            }
        )
        print(f"Status: {res.status_code}")
        try:
            data = res.json()
            print(json.dumps(data, indent=2))
        except Exception as e:
            print("Response:", res.text)


if __name__ == '__main__':
    asyncio.run(main())
